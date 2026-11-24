import { expect, test } from 'claude-code/testing'

// A real 4x2 PNG: the engine checks the bytes, and its 2:1 shape is what the layout is checked against.
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAQAAAACCAIAAADwyuo0AAAAEElEQVR4nGP4z8AARwzIHABvqgf5gNwAKAAAAABJRU5ErkJggg=='

const MESSAGE = (text: string) =>
  ({
    plugin: 'image-preview',
    surface: 'terminal',
    component: 'AssistantMessage',
    requestId: 'msg-1',
    viewport: { columns: 100, rows: 40, isFullscreen: true },
    props: { text, isFirstOfReply: true },
  }) as const

test('Option+hover over an image path floats a mini preview; moving off or letting go hides it', async ($, on) => {
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('process.run', () => ({ value: { exitCode: 0, stdout: '/home/me|/tmp/', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }))
  on('fs.stat', (_, e) =>
    e.path === '/work/shots/evidence.png'
      ? { value: { kind: 'file', size: 10, mtimeMs: 1000, isLink: false } }
      : { deny: 'ENOENT: missing' },
  )
  on('fs.read', () => ({ value: { base64: PNG } }))

  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount(MESSAGE('Intro **text**.\n\nSaved `shots/evidence.png` and missing.png, see https://x.dev/a.png\n\n```\nshots/evidence.png\n```'))

  // Only the line naming an existing image leaves markdown; the fence and the rest stay.
  expect((await ui.find({ type: 'Markdown' }))?.props.text).toBe('Intro **text**.\n')
  await ui.resize({ columns: 10, rows: 7 })
  // "Saved " | "shots/evidence.png" wrapped at 10: the path starts at row 0, column 6 and ends at row 2, column 3.
  expect(await ui.find({ type: 'Image' })).toBeUndefined()

  await ui.pointer({ type: 'move', x: 7, y: 0 })
  expect(await ui.find({ type: 'Image' })).toBeUndefined() // no Option held

  await ui.pointer({ type: 'move', x: 2, y: 2, alt: true })
  const image = await ui.find({ type: 'Image' })
  expect(image?.props.source).toEqual({ png: PNG })
  expect([image?.props.columns, image?.props.rows]).toEqual([40, 10])

  await ui.pointer({ type: 'move', x: 2, y: 4, alt: true }) // past the path, on "missing.png" text
  expect(await ui.find({ type: 'Image' })).toBeUndefined()

  await ui.pointer({ type: 'move', x: 7, y: 0, alt: true })
  expect(await ui.find({ type: 'Image' })).toBeDefined()
  await ui.pointer({ type: 'move', x: 7, y: 0 }) // Option released
  expect(await ui.find({ type: 'Image' })).toBeUndefined()
  await ui.unmount()
})

test('a reply without image paths is the engine’s own', async ($, on) => {
  on('ui.render', () => ({ type: 'Text', props: {}, children: ['engine'] }))
  const ui = await $.ui.mount(MESSAGE('nothing here, not even in ```\nx.png\n```'))
  expect(await ui.find({ type: 'Text', text: 'engine' })).toBeDefined()
  await ui.unmount()
})
