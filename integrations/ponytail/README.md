# Ponytail

An upstream Claude Code plugin, not a plugin implemented by this repository. The [recipe manifest](manifest.json) selects release **5.3.2**, tag `v5.3.2`, resolved to commit `16352ac229eb08a9598dcae48fe9f2b342567d86`, with `ledger` and `sendNames` enabled. The known local install also reported 5.3.2 but used commit `09c434ab73ca43761c5d8b0c5d341926c2fba710`; these are **different snapshots**, not interchangeable provenance. This is a tested-version reference, not a claim that this repository ran Ponytail's functional tests.

## Prerequisites and scope

- Claude Code with native plugin support. Command help and read-only installed metadata were inspected with Claude Code **2.1.309**.
- Node.js on the non-interactive shell's `PATH`; upstream lifecycle hooks run Node. The optional band requires Claude Code 2.1.290 or newer and does not appear in `claude -p`, cloud sessions, or the VS Code chat panel.
- Git/network access to the upstream repository. Claude authentication remains local; do not capture login data in this repository.
- Choose either this upstream baseline route or this repository's community marketplace route, not both: their qualified plugin IDs differ and duplicate installs can load Ponytail twice.

Ponytail bundles its own plugin components. This recipe does **not** copy shared skills into a global skill directory or run the skills CLI. It does not install Orca or Argent.

## Native installation

These commands are examples for a deliberately selected personal config directory. Back it up first. Never aim them at a work profile such as `~/.claude-and`.

```bash
export CLAUDE_CONFIG_DIR="$HOME/.claude"
claude plugin marketplace add 'DietrichGebert/ponytail#v5.3.2' --scope user --json
claude plugin install ponytail@ponytail --scope user --config ledger=true --config sendNames=true --json
```

Claude's native marketplace source syntax accepts `owner/repo#ref` for a branch/tag. Use the release tag above: an attempted raw-commit marketplace ref failed because Claude's installer clones it as a branch. The tag fixes the selected upstream release and its relative `./` plugin source together, but a tag is not immutable; the manifest records the resolved release commit separately. A marketplace plugin source can instead pin a native `source: "github"`, `repo`, and `sha`, as in a curated catalog. Neither mechanism requires vendoring upstream source. Do not silently refresh an existing marketplace from a different revision: inspect it before changing the user's registration.

For an already installed plugin, explicitly save just the requested options:

```bash
printf '%s\n' '{"ledger":"true","sendNames":"true"}' | claude plugin configure ponytail@ponytail --values-stdin --json
```

`ledger=true` records local task-board rows under `~/.config/ponytail/band/`. `sendNames=true` permits task names in an optional webhook's payload; it does **not** configure a webhook. Webhook URLs/tokens, any existing webhook, and private task history must remain local. Do not infer that no data leaves the machine merely because this recipe does not set a URL.

## Setup detection versus functional checks

Read-only native detection:

```bash
claude plugin list --json
claude plugin configure ponytail@ponytail --json
```

`list` returns an array. Find `id: "ponytail@ponytail"`, `scope: "user"`, `enabled: true`, and `version: "5.3.2"`. Other observed fields include `installPath`, `installedAt`, `lastUpdated`, `projectEnabled`, and `hasUserConfig`. `configure` returns `pluginId`, `displayName`, `schema`, `inputs`, `choices`, `configured`, and `unconfigured`; the observed `inputs.ledger` and `inputs.sendNames` are **strings**, `"true"`, not JSON booleans. Avoid printing an entire options response into a public issue: it may describe sensitive configuration.

For mutating plugin commands with `--json`, parse only the **last stdout line** and check the exit status. The documented object always has `command`, `outcome` (`ok` or `failed`), and `message`; `pluginId`, `scope`, and `failureCode` are conditional. Marketplace commands use values such as `marketplace-add` and may include `marketplace`. Usage errors can emit no JSON result.

Detection does not establish that the plugin ran. Manual end-to-end check: start a new Claude Code session using the same `CLAUDE_CONFIG_DIR`, inspect `/plugin`, then invoke `/ponytail` and `/ponytail-help`. Review the hook trust prompts and confirm the active mode. Check the optional task board only if desired; do not upload its private records. This repository's recipe research did not perform that manual flow.

## Removal

Remove the native install from the same config directory and scope:

```bash
claude plugin uninstall ponytail@ponytail --scope user --json
# Optional: removes this marketplace and any remaining plugins installed from it.
claude plugin marketplace remove ponytail --scope user --json
```

Upstream documents optional state outside the plugin cache: mode flags, `~/.config/ponytail/config.json`, task-board data, and an optional statusline script/settings entry. If you want upstream's extra cleanup, review and run `node scripts/uninstall.js` from the installed plugin directory **before** native uninstall (or from a separately obtained trusted checkout). Do not delete shared settings or task history indiscriminately. Native uninstall is not a promise that every external data file disappears.

## Sources

- [Pinned upstream manifest](https://github.com/DietrichGebert/ponytail/blob/09c434ab73ca43761c5d8b0c5d341926c2fba710/.claude-plugin/plugin.json) and [installation/removal guide](https://github.com/DietrichGebert/ponytail/blob/09c434ab73ca43761c5d8b0c5d341926c2fba710/INSTALL.md).
- [Claude marketplace reference](https://code.claude.com/docs/en/plugins/marketplace-reference.md) and [plugin command/result reference](https://code.claude.com/docs/en/plugins/cli-reference.md).

Personal baseline preferences, especially permission-bypass or dangerous-operation choices, are **opt-in personal behavior**. They are not Ponytail features, not required to use this plugin, and must not be promoted as community plugin defaults.
