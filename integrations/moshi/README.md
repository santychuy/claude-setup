# Moshi

[Moshi](https://getmoshi.app) is a terminal/client application; `moshi-hook` is its companion host daemon and CLI. This repository installs only the **Claude integration** through the upstream CLI. It does not bundle generated hook/plugin source, pair a device, or configure your SSH keys.

Research used installed **moshi-hook 0.4.43**, its command help, official documentation, and `brew info --json=v2 moshi-hook`. An install/status/uninstall cycle was exercised only in an isolated temporary configuration tree. No real personal/work configuration was changed, and no phone approval or live agent session was tested.

## Install the binary

The inspected Homebrew formula is **`rjyo/moshi/moshi-hook`**, from tap `rjyo/moshi`, homepage `https://getmoshi.app`. On macOS:

```bash
brew tap rjyo/moshi
# Review/trust the tap if required by your Homebrew version:
brew trust rjyo/moshi
brew install moshi-hook
moshi-hook version
```

`brew info --json=v2 moshi-hook` returns `formulae` and `casks` arrays. The observed formula provides `name`, `full_name`, `tap`, `homepage`, `versions.stable`, `urls.stable.url`, `urls.stable.checksum`, `installed[].version`, and service metadata. The observed version was 0.4.43; archive URLs/checksums depend on platform, so do not hard-code the Apple-silicon archive for other machines.

Official alternative for macOS/Linux/WSL: review [the upstream installer](https://getmoshi.app/install.sh) before running it. Its noninteractive setup knobs include `MOSHI_HOOK_SKIP_FIRST_RUN=1` and `MOSHI_HOOK_SKIP_SERVICE=1`; the latter is documented in the bundled 0.4.43 README. Use Homebrew service management for a Homebrew install. Native Windows is an upstream experimental preview; this repository's Bash/Python baseline and recipe research do not claim Windows verification.

## Critical shared-skills boundary

A default global `moshi-hook install` can install the **`moshi-visuals` skill** for Claude/Codex because inline visuals defaults to on. There is **no** `--no-skills` or `--config-dir` flag in 0.4.43's install help. `--local --target claude` avoids that skill but targets the current project's `.claude/settings.local.json`, so it is not a substitute for this personal baseline.

Do not automatically run `moshi-hook set inline-visuals off` against the real host: it persists a host-wide setting and immediately removes Moshi-owned visuals skills for Claude/Codex. Shared skills are outside this repository's scope.

Instead, the baseline invokes the **official installer with temporary host settings**, while preserving the real selected Claude target. The environment contract exercised in a temporary tree was:

| Value | Role |
| --- | --- |
| `HOME=<temporary>/home` | Isolate fallback home locations |
| `XDG_CONFIG_HOME=<temporary>/xdg` | Isolate Moshi TOML settings |
| `MOSHI_CONFIG_DIR=<temporary>/state` | Isolate Moshi host/pairing state |
| `CLAUDE_CONFIG_DIR=<chosen absolute Claude config directory>` | The intended integration destination |
| `MOSHI_HOOK_SKIP_FIRST_RUN=1` | Do not prompt for host-wide defaults |

Create the temporary directories and write **only in the temporary tree**:

```toml
# <temporary>/xdg/moshi/config.toml
[gateway]
inline_visuals = false
```

Then run, with that complete environment:

```bash
moshi-hook install --target claude
moshi-hook status --json
# For explicit removal, under the same isolated environment:
moshi-hook uninstall --target claude
```

Always pass `--target claude`: without it, install/uninstall defaults to **all supported agents**. The repository's setup wrapper constructs and removes the temporary tree; users do not need to change their real host settings. Do not export these temporary overrides into your normal shell or daemon service.

`CLAUDE_CONFIG_DIR` was observed to change Claude hook detection, and the isolated install wrote to the selected config directory. `MOSHI_CONFIG_DIR` alone does **not** move `config.toml`; the read-only `set inline-visuals` command still reported the real TOML path until `XDG_CONFIG_HOME` was also overridden. With the full environment above, daemon socket/log paths also resolved under the temporary `HOME`, and install reported no daemon there. No daemon was started by the exercised install. After the temporary environment is discarded, generated hooks execute normally under the user's real runtime environment.

## What the installer manages

In the isolated fresh-target exercise, upstream wrote:

- `<target>/settings.json`: `hooks` entries and `env.CLAUDE_CODE_PLUGIN_DIRS`.
- `<target>/moshi-plugin/.claude-plugin/plugin.json`.
- `<target>/moshi-plugin/hooks/hooks.json` and `hooks/register.ts`.

No skills directory was created. Generated settings used the installed `moshi-hook` executable's absolute path and `<target>/moshi-plugin`, not paths into temporary host state. Do not check those generated sources into this repository. The installer owns their version and evolution.

The observed `PermissionRequest` hook was synchronous (`async: false`), while Notification, PreToolUse, PostToolUse, SessionStart, SessionEnd, Stop, and UserPromptSubmit entries were asynchronous. Preserve these upstream semantics; a blanket async rewrite would break approval round-trips. Existing unrelated hooks and any existing plugin-dir environment value need preservation by the baseline's settings merge/backup policy.

## Setup detection versus functional checks

```bash
moshi-hook version
moshi-hook status --json
moshi-hook probe --json
```

Use the isolated inline-visuals-disabled environment for the baseline's hook-status check too. Otherwise a host's enabled visuals preference can make a hook installation without its visuals skill appear incomplete. `status` is read-only; `doctor` is **not** a baseline check because it can offer/apply fixes (`--yes` explicitly applies them).

Observed `status --json` is one object with `baseUrl`, `e2ee`, `hooks`, `paired`, `platform`, `secretStore`, `socketPath`, and `logPath`; paired hosts additionally exposed `hostId` and `displayName`. Each hook item has `target`, `status`, `command`, and optionally `path`. Find the `target: "claude"` entry and require `status: "current"`. `not_found` was observed for a missing target. Do not mistake `paired: true` for current hook installation, or installation for pairing. Avoid publishing host identifiers or full private status output.

Observed `probe --json` includes booleans `installed`, `running`, `gateway`, a `version`, `e2ee`, and a `hostId` when available. These checks only detect local setup; they do not prove the phone received an event. Install/uninstall have human-readable output, not a documented JSON flag (`claude -> installed` / `claude -> uninstalled` were observed); use exit status plus native status afterward.

## Local pairing and manual end-to-end check

After the baseline is applied, leave the temporary installer environment behind. Install/open the Moshi app, configure SSH/Mosh access to this machine, and obtain a pairing token in the app's Hooks/Integrations settings. Pair **locally**, never via committed tokens:

```bash
moshi-hook pair --token "$MOSHI_PAIRING_TOKEN"
# Homebrew/macOS:
brew services start moshi-hook
# Other supervisor/foreground alternative:
moshi-hook serve
```

Choose one daemon management method. macOS pairing uses Keychain by default; `pair --store file` is a supported explicit alternative for headless use, not a repository default. On Linux/WSL, `moshi-hook service install` manages the user service; check your platform's current upstream guide. Do not run host setup, pairing, service installation, or authentication automatically during baseline capture/check.

Manual functional check: start a new Claude Code session in Herdr or your supported multiplexer using the selected config, confirm Moshi shows the session, trigger a harmless permission request requiring approval, approve it in the app, and confirm the session resumes. Check a completion notification separately. Phone permissions, a running daemon, pairing, SSH/network reachability, agent login, and app support are independent prerequisites. This manual flow was **not exercised** by this repository's recipe research.

## Removal

To remove only the selected Claude integration, use the isolated environment above and `moshi-hook uninstall --target claude`. Native uninstall removes Moshi-owned entries; it is not permission to remove other hooks. Back up settings first.

Full host removal is a separate deliberate action, affecting other integrations and apps. If wanted, use the appropriate service manager (`brew services stop moshi-hook` for Homebrew or `moshi-hook service uninstall` for a service installed by Moshi), then `moshi-hook unpair`, then `brew uninstall moshi-hook` for a Homebrew binary. Do not unpair or stop a shared host merely to remove one Claude profile's hooks.

## Sources

- [Official hook installation guide](https://getmoshi.app/docs/install-moshi-hook).
- [Hook behavior and managed locations](https://getmoshi.app/docs/hooks).
- [Inline visuals skill side effects](https://getmoshi.app/docs/inline-visuals) and [persistent settings](https://getmoshi.app/docs/hook-settings).
- [Official Homebrew formula source](https://github.com/rjyo/homebrew-moshi/blob/main/Formula/moshi-hook.rb).
