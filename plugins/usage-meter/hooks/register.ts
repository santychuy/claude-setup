import type { EngineInterface, Register, SessionRateLimit, Timer } from 'claude-code'

// Session-local only: never reuse another account's persisted readings.
let limits: readonly SessionRateLimit[] = []
let expiry: Timer | undefined

const WINDOWS = [
  { kind: 'five_hour', label: '5h' },
  { kind: 'seven_day', label: '7d' },
] as const


async function scheduleExpiry($: EngineInterface): Promise<void> {
  const now = await $.clock.now()
  expiry?.cancel()
  expiry = undefined
  let nextReset = Infinity
  for (const limit of limits) {
    if (!WINDOWS.some(window => window.kind === limit.kind)) continue
    const reset = limit.resetsAt === undefined ? Infinity : Date.parse(limit.resetsAt)
    if (reset > now && reset < nextReset) nextReset = reset
  }
  if (Number.isFinite(nextReset)) {
    // Redraw at the reset boundary, not by polling the account. An expired
    // reading disappears until the engine reports the new window's usage.
    expiry = $.clock.after(nextReset - now, () => {
      $.ui.invalidate('ui.render')
      void scheduleExpiry($)
    })
  }
}

export const register: Register = on => {
  limits = []
  expiry?.cancel()
  expiry = undefined

  on('session.start', async ($, e, next) => {
    limits = (await $.session.usage()).rateLimits
    await scheduleExpiry($)
    $.ui.invalidate('ui.render')
    return next(e)
  }).catch(($, e, next) => next(e))

  on('session.measure', async ($, e, next) => {
    if (e.changed.includes('rateLimits')) {
      // Replace the snapshot so a disappeared limit never leaves a stale row.
      limits = e.rateLimits
      await scheduleExpiry($)
      $.ui.invalidate('ui.render')
    }
    return next(e)
  })

  on('session.end', ($, e, next) => {
    expiry?.cancel()
    expiry = undefined
    limits = []
    return next(e)
  })

  on('ui.render', { component: 'SessionMode' }, async ($, e, next) => {
    const beneath = await next(e)
    const now = await $.clock.now()
    const rows = WINDOWS.flatMap(window => {
      const limit = limits.find(item => item.kind === window.kind)
      if (!limit || (limit.resetsAt !== undefined && Date.parse(limit.resetsAt) <= now)) return []
      return [`${window.label} ${String(Math.round(100 - limit.percentUsed)).padStart(3)}%`]
    })
    if (rows.length === 0) return beneath

    const { Box, Text } = $.ui.resolve(e)
    // SessionMode occupies the footer's right-hand slot. Keep the engine's
    // labels and other mods on its left; our column is the rightmost child.
    return Box({
      flexDirection: 'row',
      alignItems: 'flex-start',
      columnGap: 2,
      children: [
        beneath,
        Box({
          key: 'usage-meter',
          flexDirection: 'column',
          alignItems: 'flex-end',
          flexShrink: 0,
          children: rows.map(text => Text({ children: [text] })),
        }),
      ],
    })
  })
}
