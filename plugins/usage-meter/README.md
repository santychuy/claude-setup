# Usage Meter

A minimal TypeScript mod showing account usage limits vertically at the right edge of Claude Code's footer.

```text
5h  77%
7d  59%
```

Percentages mean **remaining allowance**: `100%` when unused, decreasing to `0%` when exhausted. The values above are illustrative.

- Shows only the subscription windows Claude Code reports: `five_hour` and `seven_day`.
- Weekly-only accounts show only `7d`; no plan-name detection or empty 5-hour row.
- Preserves Claude Code's existing footer controls and other mods' drawing.
- No side panel, progress bars, account polling, model calls, credentials access, or stored account readings.

## Install

Once this plugin is published in the repository's marketplace:

```bash
claude plugin marketplace add santychuy/claude-setup
claude plugin install usage-meter@claude-setup --scope user
```

If you already registered the marketplace, update it before installing a newly published entry:

```bash
claude plugin marketplace update claude-setup
```

In an open session, run `/reload-plugins`; otherwise start Claude Code again. The mod is independent of this repository's personal baseline and does not require Ponytail, Moshi, or Herdr.

To try the current checkout without installing it:

```bash
claude --plugin-dir ./plugins/usage-meter
```

## Availability and freshness

Tested in the Claude Code **2.1.309 terminal**, including its real footer. The `SessionMode` render site is documented for the terminal and Claude Desktop, not the VS Code chat panel; Desktop has not been visually verified here. This is a Claude Code mod, not a cross-harness extension.

The meter reads `$.session.usage().rateLimits` at startup and replaces its snapshot on native `session.measure` updates. It displays `100 - percentUsed`, rounded to a whole percentage. It uses the active session's account readings rather than inspecting its plan name. Subscription percentages usually arrive after the session's first API response. Missing readings, API-key sessions without subscription windows, and gateway spend limits produce no meter; absence never means a full or exhausted allowance.

Readings are only as fresh as Claude Code's latest reported measurement, not a separate live account query. A local timer removes a reading at its reset timestamp. The row returns when the engine reports a fresh reading; the mod never invents a reset to `100%` remaining. Reset times are not displayed.

The footer owns its position and outer padding. Usage rows occupy the right edge of its `SessionMode` slot; additional mods can still wrap that slot according to hook order. On very narrow terminals the native footer may wrap its controls. The plugin does not remove keyboard hints to gain space.

## Develop and verify

Claude Code loads `hooks/register.ts` directly; users need no bundler, Node.js installation, or build step for this mod. Loading it interactively with `--plugin-dir` generates the local `.claude-plugin/types/` declarations that `tsconfig.json` extends. Those declarations are ignored by git because they depend on the local Claude Code build and connected tools.

```bash
claude plugin validate plugins/usage-meter
claude plugin test plugins/usage-meter
npx --yes --package typescript tsc --project plugins/usage-meter/tsconfig.json --noEmit
```

The native tests cover switching from both windows to weekly-only, expiry and fresh-window recovery, and missing/non-subscription readings without destroying existing footer content. TypeScript is a development tool only.

For a live check, load the mod, send a harmless message to obtain a real account reading, and inspect the footer. Confirm the rows stack at its right edge and existing controls remain visible. Test weekly-only and missing-window states through the native test suite when your account cannot exercise them. Do not replace real account values with demo data in the published mod.

Increment `.claude-plugin/plugin.json`'s version for releases, validate the marketplace, and publish the repository changes. Develop in this source directory, not Claude's installed plugin cache.

## Disable or remove

```bash
claude plugin disable usage-meter@claude-setup
claude plugin uninstall usage-meter@claude-setup --scope user
```

Choose disable or uninstall, then reload plugins or start a fresh session. For a development session, omit `--plugin-dir` on the next launch. No account cache is left behind.

## References

- [Native usage data and render sites](https://code.claude.com/docs/en/plugins/mods/reference)
- [Mod interface composition](https://code.claude.com/docs/en/plugins/mods/interface)
- [TypeScript modules and publishing](https://code.claude.com/docs/en/plugins/mods/create)

MIT; see the repository's [LICENSE](../../LICENSE).
