import { atom, read, update } from 'claude-code'
import type { EngineInterface, ImageSource, Register } from 'claude-code'

import type { Hover, Segment } from '../types'

const hovered = atom({ plugin: 'image-preview', key: 'hover' } as const, null as Hover | null)

// A markdown link to an image, an inline-code image path, or a bare image path.
// shortcut: paths with spaces are not detected, quote-aware parsing if that matters.
const IMAGE =
  /\[([^\]\n]*)\]\(([^)\s]+?\.(?:png|jpe?g))\)|`([^`\s]+?\.(?:png|jpe?g))`|(?<![\w:/.~@%+-])((?:file:\/\/|~\/|\.{1,2}\/|\/)?(?:[\w@%+.,-]+\/)*[\w@%+,-][\w@%+.,-]*\.(?:png|jpe?g))(?![\w/-]|\.\w)/gi

type Preview = { source: ImageSource; width: number; height: number } | { error: string }

export function normalize(path: string, cwd: string, home: string): string {
  let p = path.replace(/^file:\/\//, '')
  try {
    p = decodeURI(p)
  } catch {}
  if (p.startsWith('~/')) p = `${home}/${p.slice(2)}`
  else if (!p.startsWith('/')) p = `${cwd}/${p}`
  const parts: string[] = []
  for (const part of p.split('/')) {
    if (part === '..') parts.pop()
    else if (part !== '' && part !== '.') parts.push(part)
  }
  return `/${parts.join('/')}`
}

/** The image paths written in one line of markdown: what matched, what it reads as, and the path. */
export function findImages(line: string): { match: string; label: string; path: string; index: number }[] {
  const found = []
  for (const m of line.matchAll(IMAGE)) {
    const path = m[2] ?? m[3] ?? m[4] ?? ''
    if (path === '' || /^https?:/i.test(path)) continue
    found.push({ match: m[0], label: m[1] || path, path, index: m.index })
  }
  return found
}

/** Light inline markdown a line drawn as plain text should not show. */
const plain = (text: string) => text.replace(/`([^`]*)`/g, '$1').replace(/\*\*|__/g, '')

function pngSize(base64: string): { width: number; height: number } | undefined {
  const b = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
  if (b.length < 24 || b[0] !== 0x89 || b[1] !== 0x50) return undefined
  const u32 = (o: number) => new DataView(b.buffer).getUint32(o)
  return { width: u32(16), height: u32(20) }
}

async function mtime($: EngineInterface, path: string, isFile: Map<string, number>) {
  if (isFile.has(path)) return isFile.get(path)
  try {
    const s = await $.fs.stat(path)
    if (s.kind !== 'file') return undefined
    isFile.set(path, s.mtimeMs)
    return s.mtimeMs
  } catch {
    return undefined
  }
}

async function preview($: EngineInterface, path: string, mtimeMs: number, tmp: string): Promise<Preview> {
  let file = path
  if (!/\.png$/i.test(path)) {
    // The terminal only decodes PNG files, so JPEGs are converted (and capped at 2000px) once.
    file = `${tmp}/${Math.trunc(mtimeMs)}-${path.replace(/[^\w.-]/g, '_').slice(-120)}.png`
    if (!(await $.fs.exists(file))) {
      await $.process.run(['mkdir', '-p', tmp])
      const sips = await $.process.run(['sips', '-Z', '2000', '-s', 'format', 'png', path, '--out', file]).catch(() => undefined)
      if (sips?.exitCode !== 0) {
        const magick = await $.process.run(['magick', path, '-resize', '2000x2000>', file]).catch(() => undefined)
        if (magick?.exitCode !== 0) return { error: 'cannot convert JPEG (needs sips or ImageMagick)' }
      }
    }
  }
  const size = pngSize((await $.fs.read(file, { as: 'bytes', length: 24 })).base64)
  if (!size) return { error: 'not a readable PNG' }
  // Bytes work on every kitty-protocol terminal; some (Rex) refuse the file-medium probe, so a file name is only the fallback past the 2 MiB bytes limit.
  if ((await $.fs.stat(file)).size <= 2 * 1024 * 1024) return { source: { png: (await $.fs.read(file, { as: 'bytes' })).base64 }, ...size }
  return { source: { file, format: 'png', generation: Math.trunc(mtimeMs) }, ...size }
}

export const register: Register = on => {
  let cwd = '/'
  let home = '/'
  let tmp = '/tmp'
  const isFile = new Map<string, number>() // path -> mtimeMs, positives only
  const previews = new Map<string, Promise<Preview>>()

  on('session.start', async ($, e, next) => {
    cwd = e.cwd
    const { stdout } = await $.process.run(['sh', '-c', 'printf %s "$HOME|${TMPDIR:-/tmp}"'])
    const [h = '/', t = '/tmp'] = stdout.split('|')
    home = h
    tmp = `${t.replace(/\/$/, '')}/claude-image-preview`
    return next(e)
  })

  on('ui.message', async ($, e, next) => {
    // Posted by a path line: data from code, so checked before it is kept.
    const data = e.data as { path?: unknown; row?: unknown } | null
    const next_: Hover | null =
      typeof data?.path === 'string' && typeof data.row === 'number' && Number.isInteger(data.row)
        ? { requestId: e.requestId, line: e.element, path: data.path, row: data.row }
        : null
    await update($, hovered, last => (JSON.stringify(last) === JSON.stringify(next_) ? last : next_))
    return next(e)
  })

  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    if (e.surface !== 'terminal') return next(e)

    // Lines naming an existing image are drawn by a path line (pointer-aware); the rest stays markdown.
    type Line = { key: string; segments: Segment[] }
    const blocks: (Line | { md: string })[] = []
    const mtimes = new Map<string, number>()
    let md: string[] = []
    let isFenced = false
    for (const line of e.props.text.split('\n')) {
      if (/^\s*```/.test(line)) isFenced = !isFenced
      const segments: Segment[] = []
      let last = 0
      for (const hit of isFenced ? [] : findImages(line)) {
        const path = normalize(hit.path, cwd, home)
        const mtimeMs = await mtime($, path, isFile)
        if (mtimeMs === undefined) continue
        mtimes.set(path, mtimeMs)
        segments.push({ text: plain(line.slice(last, hit.index)) }, { text: hit.label, path })
        last = hit.index + hit.match.length
      }
      if (segments.length === 0) {
        md.push(line)
        continue
      }
      segments.push({ text: plain(line.slice(last)) })
      if (md.length > 0) blocks.push({ md: md.join('\n') })
      md = []
      blocks.push({ key: `line-${blocks.length}`, segments: segments.filter(s => s.text !== '') })
    }
    if (mtimes.size === 0) return next(e)
    if (md.length > 0) blocks.push({ md: md.join('\n') })

    const hover = await read($, hovered)
    const { Box, Text, Markdown, Image, Client } = $.ui.resolve(e)

    async function card(at: Hover) {
      const mtimeMs = mtimes.get(at.path)
      if (mtimeMs === undefined) return null
      const key = `${at.path}@${mtimeMs}`
      if (!previews.has(key)) previews.set(key, preview($, at.path, mtimeMs, tmp).catch(err => ({ error: String(err) })))
      const p = await previews.get(key)!
      const name = at.path.split('/').pop()!
      if ('error' in p) {
        return (
          <Box position="absolute" top={at.row - 3} left={2} borderStyle="round" borderColor="error">
            <Text color="error">{`${name}: ${p.error}`}</Text>
          </Box>
        )
      }
      // shortcut: assumes a terminal cell is twice as tall as wide, read the cell pixel size if previews look stretched.
      let columns = 40
      let rows = Math.round((columns * p.height) / p.width / 2)
      if (rows > 12) {
        rows = 12
        columns = Math.round((rows * 2 * p.width) / p.height)
      }
      columns = Math.min(255, Math.max(12, columns))
      rows = Math.min(255, Math.max(1, rows))
      const caption = `${name} · ${p.width}×${p.height}`.slice(0, columns).padEnd(columns)
      // shortcut: always floats above the hovered row, so it clips when that row is at the top of the screen.
      return (
        <Box position="absolute" top={at.row - rows - 3} left={2} flexDirection="column" borderStyle="round" borderColor="suggestion">
          <Text dimColor>{caption}</Text>
          <Image key="mini" source={p.source} columns={columns} rows={rows} alt={`[image: ${name}]`.slice(0, columns).padEnd(columns)} />
        </Box>
      )
    }

    const drawn = []
    for (const [i, block] of blocks.entries()) {
      if ('md' in block) {
        drawn.push(<Markdown key={`md-${i}`} text={block.md} />)
        continue
      }
      const isHovered = hover?.requestId === e.requestId && hover.line === block.key && block.segments.some(s => s.path === hover.path)
      drawn.push(
        <Box key={block.key} flexDirection="column">
          <Client key={block.key} module="./path-line.ts" props={{ segments: block.segments }} width="100%" />
          {isHovered ? await card(hover) : null}
        </Box>,
      )
    }

    return (
      <Box flexDirection="row">
        <Text>{e.props.isFirstOfReply ? '⏺ ' : '  '}</Text>
        <Box flexDirection="column" flexGrow={1}>
          {drawn}
        </Box>
      </Box>
    )
  })
}
