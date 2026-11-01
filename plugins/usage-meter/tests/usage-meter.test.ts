import { expect, mock, test } from 'claude-code/testing'

const FOOTER = {
  plugin: 'usage-meter',
  component: 'SessionMode',
  requestId: 'session-mode',
  surface: 'terminal',
  viewport: { columns: 80, rows: 24, isFullscreen: true },
  props: { modes: ['focus'] },
} as const

const CONTEXT = { window: 200_000 }

test('removes the five-hour row when the account reports weekly limits only', async ($, on) => {
  mock.clock(on)
  on('session.usage', () => ({ value: {
    startedAt: 0,
    context: CONTEXT,
    rateLimits: [
      { kind: 'five_hour', percentUsed: 23.4 },
      { kind: 'seven_day', percentUsed: 41.2 },
    ],
  } }))
  on('session.start', ($, e) => ({ cwd: e.cwd }))
  on('session.measure', ($, e) => ({ changed: e.changed }))
  on('ui.render', () => ({ type: 'Text', props: {}, children: ['focus'] }))

  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount(FOOTER)
  expect(await ui.find({ type: 'Text', text: '5h  77%' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: '7d  59%' })).toBeDefined()

  await $.session.measure({ context: CONTEXT, changed: ['rateLimits'], rateLimits: [
    { kind: 'seven_day', percentUsed: 52.8 },
  ] })
  expect(await ui.find({ type: 'Text', text: /^5h/ })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: '7d  47%' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: 'focus' })).toBeDefined()
  await ui.unmount()
})

test('expires old readings without inventing fresh allowance and accepts real boundary values', async ($, on) => {
  const clock = mock.clock(on)
  on('session.measure', ($, e) => ({ changed: e.changed }))
  on('ui.render', () => ({ type: 'Text', props: {}, children: ['focus'] }))
  await $.session.measure({ context: CONTEXT, changed: ['rateLimits'], rateLimits: [
    { kind: 'five_hour', percentUsed: 95, resetsAt: '1970-01-01T00:00:01.000Z' },
    { kind: 'seven_day', percentUsed: 60, resetsAt: '1970-01-01T00:00:02.000Z' },
  ] })
  const ui = await $.ui.mount(FOOTER)
  expect(await ui.find({ type: 'Text', text: '5h   5%' })).toBeDefined()
  await clock.advance(1000)
  expect(await ui.find({ type: 'Text', text: /^5h/ })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: '7d  40%' })).toBeDefined()
  await clock.advance(1000)
  expect(await ui.find({ key: 'usage-meter' })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: 'focus' })).toBeDefined()

  await $.session.measure({ context: CONTEXT, changed: ['rateLimits'], rateLimits: [
    { kind: 'seven_day', percentUsed: 0, resetsAt: '1970-01-08T00:00:02.000Z' },
  ] })
  expect(await ui.find({ type: 'Text', text: '7d 100%' })).toBeDefined()
  await $.session.measure({ context: CONTEXT, changed: ['rateLimits'], rateLimits: [
    { kind: 'seven_day', percentUsed: 100, resetsAt: '1970-01-08T00:00:02.000Z' },
  ] })
  expect(await ui.find({ type: 'Text', text: '7d   0%' })).toBeDefined()
  await ui.unmount()
})

test('leaves the footer alone with missing or non-subscription limits', async ($, on) => {
  mock.clock(on)
  on('session.measure', ($, e) => ({ changed: e.changed }))
  on('ui.render', () => ({ type: 'Text', props: {}, children: ['focus'] }))
  const ui = await $.ui.mount(FOOTER)
  expect(await ui.find({ key: 'usage-meter' })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: 'focus' })).toBeDefined()

  await $.session.measure({ context: CONTEXT, changed: ['rateLimits'], rateLimits: [
    { kind: 'spend_limit', percentUsed: 120 },
  ] })
  expect(await ui.find({ key: 'usage-meter' })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: 'focus' })).toBeDefined()
  await ui.unmount()
})
