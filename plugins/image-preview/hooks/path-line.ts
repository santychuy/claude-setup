import type { ClientModule, ClientSurface, RenderElement } from 'claude-code'

import type { Segment } from '../types'

type Props = { segments: Segment[] }
type State = { hover: string | null }

// The module function's latest props per instance, read by its pointer listener.
const latest = new WeakMap<object, Props>()

/** The image path drawn at cell (x, y) when the line is hard-wrapped at `columns`. */
export function pathAt(segments: readonly Segment[], columns: number, x: number, y: number): string | null {
  if (columns <= 0 || x < 0 || y < 0 || x >= columns) return null
  const index = y * columns + x
  let at = 0
  for (const s of segments) {
    if (index < at + s.text.length) return s.path ?? null
    at += s.text.length
  }
  return null
}

function listen(surface: ClientSurface<State>) {
  surface.onPointer(event => {
    const props = latest.get(surface)
    // Option is reported as alt; a held button means a drag, not a hover.
    const path =
      props && event.alt && event.type !== 'leave' && event.button === undefined
        ? pathAt(props.segments, surface.columns, event.x, event.y)
        : null
    if (path === (surface.state?.hover ?? null)) return
    surface.setState({ hover: path })
    surface.post(path ? { path, row: event.y } : {})
  })
}

const PathLine: ClientModule<Props, State> = (props, surface) => {
  latest.set(surface, props)
  if (surface.state === undefined) {
    listen(surface)
    surface.setState({ hover: null })
  }
  const { Box, Text, Link } = surface.elements
  const hover = surface.state?.hover ?? null
  // shortcut: one cell per character, so wide characters (CJK, emoji) misplace the hover; measure widths if that matters.
  const width = surface.columns > 0 ? surface.columns : Infinity
  const rows: (string | RenderElement)[][] = [[]]
  let used = 0
  for (const s of props.segments) {
    let rest = s.text
    while (rest.length > 0) {
      if (used === width) {
        rows.push([])
        used = 0
      }
      const part = rest.slice(0, width - used)
      rest = rest.slice(part.length)
      used += part.length
      rows[rows.length - 1]!.push(
        s.path
          ? Link({
              href: `file://${encodeURI(s.path)}`,
              children: Text({ color: 'suggestion', underline: s.path === hover, children: part }),
            })
          : part,
      )
    }
  }
  return Box({ flexDirection: 'column', children: rows.map(row => Text({ wrap: 'truncate-end', children: row })) })
}

export default PathLine
