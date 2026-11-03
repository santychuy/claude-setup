import { expect, test } from 'claude-code/testing'

const COMMAND = {
  command: 'commit',
  args: '',
  origin: { kind: 'composer' },
  presentation: { isFullscreen: false, columns: 100 },
} as const

const PANE = {
  plugin: 'commit',
  component: 'Pane',
  requestId: 'commit-workflow',
  surface: 'terminal',
  viewport: { columns: 100, rows: 30 },
  props: {
    title: 'Commit workflow',
    isFocused: true,
    bodyColumns: 80,
    placement: 'inline',
    scroll: { offset: 0, bodyRows: 9 },
    view: {},
  },
} as const

test('a confirmed picker cannot dispatch a second owner on a repeated selection', async ($, on) => {
  let submissions = 0
  on('session.start', ($, e) => ({ cwd: e.cwd }))
  on('command.register', () => ({ value: { command: 'commit' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.close', () => ({ value: undefined }))
  on('ui.log', () => ({ value: undefined }))
  on('agent.spawn', () => {
    submissions += 1
    return { model: 'haiku' }
  })

  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: true })
  await $.command.run(COMMAND)
  const ui = await $.ui.mount(PANE)
  expect(submissions).toBe(0)
  await ui.select({ key: 'workflow', value: 'commit' })
  expect(submissions).toBe(1)
  // A stale/repeated surface event must not grant a second workflow.
  await ui.select({ key: 'workflow', value: 'push' })
  expect(submissions).toBe(1)
  await ui.unmount()
})

test('a non-interactive command refuses before opening a picker or submitting work', async ($, on) => {
  let sideEffects = 0
  on('session.start', ($, e) => ({ cwd: e.cwd }))
  on('command.register', () => ({ value: { command: 'commit' } }))
  on('ui.open', () => { sideEffects += 1; return { value: { isPlaced: true } } })
  on('agent.spawn', () => { sideEffects += 1; return { model: 'haiku' } })
  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: false })
  const result = await $.command.run(COMMAND)
  expect(result.exitCode).toBe(1)
  expect(sideEffects).toBe(0)
})

test('a failed picker cannot fall through to the underlying commit command', async ($, on) => {
  let underlyingRuns = 0
  on('session.start', ($, e) => ({ cwd: e.cwd }))
  on('command.register', () => ({ value: { command: 'commit' } }))
  on('ui.open', () => ({ deny: 'surface unavailable' }))
  on('command.run', () => {
    underlyingRuns += 1
    return { text: 'underlying command executed' }
  })
  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: true })
  const result = await $.command.run(COMMAND)
  expect(underlyingRuns).toBe(0)
  expect(result.exitCode).toBe(1)
})
