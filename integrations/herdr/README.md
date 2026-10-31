# Herdr

[Herdr](https://herdr.dev) is a persistent terminal workspace manager. Its native Claude integration reports **session identity for restore**. Claude's working/blocked/done state still comes from Herdr's screen detection; installing the hook does not replace that detector.

Research inspected installed **Herdr 0.9.5** help, read-only integration status, and the official [agent setup guide](https://herdr.dev/agent-guide.md). No Herdr integration was installed into personal/work settings, and no live restore workflow was exercised during recipe research.

## Install the binary, without shared skills

For Linux/macOS, upstream's installer is:

```bash
curl -fsSL https://herdr.dev/install.sh | sh
herdr --version
```

Read the script before executing remote code. The inspected installer detects OS/architecture, resolves `https://herdr.dev/latest.json`, verifies the downloaded binary's SHA-256, and installs only `herdr` into `${HERDR_INSTALL_DIR:-$HOME/.local/bin}`. The manifest uses `version`, `assets[<platform>]`, and `sha256[<platform>]`; platform keys include `macos-aarch64`, `macos-x86_64`, `linux-aarch64`, and `linux-x86_64`.

**It does not install shared skills.** There is no `--no-skills` flag needed for this shell installer. Do not run the separate skills-install command offered later in the upstream agent guide; shared skills are explicitly out of scope here. `herdr --skill` only prints an operation guide, and is neither necessary nor used by this baseline.

Official package-manager alternative on macOS:

```bash
brew install herdr
```

Use that manager for future updates/removal; use `herdr update` only for direct installer-managed binaries. Upstream also publishes Windows, mise, Nix, and manual downloads; see the [current installation guide](https://herdr.dev/tui/docs/install/). This repository's installer recipe and CLI research were on macOS, not a claim of end-to-end verification on every upstream platform.

## Native Claude integration

Select the intended personal config directory explicitly; it must already exist. Back up its settings first. Never target a work profile such as `~/.claude-and`.

```bash
export CLAUDE_CONFIG_DIR="$HOME/.claude"
herdr integration install claude
herdr integration status
```

Upstream documents and read-only path detection confirmed `CLAUDE_CONFIG_DIR` support. Without it, Herdr defaults to `~/.claude`. There is no separate integration `--config-dir` flag. `HERDR_CONFIG_PATH` chooses Herdr's own `config.toml`, not Claude's settings destination.

The native installer writes `<target>/hooks/herdr-agent-state.sh` and adds its entries to `<target>/settings.json`. Uninstall removes the matching entries and generated script. Let the installed Herdr binary generate the hook; this repository does not copy it. Backups and preserving unrelated settings/hooks remain necessary even when an upstream installer is merge-aware.

For 0.9.5, `integration install` and `integration uninstall` take a single agent target such as `claude`; they do not install every detected agent as a side effect. Do not broaden the command to other targets.

## Setup detection versus functional checks

```bash
herdr --version
CLAUDE_CONFIG_DIR="$HOME/.claude" herdr integration status
```

`integration status` has **no JSON option** in the inspected help. It emits plaintext lines for all supported agents, even though only the Claude target is relevant here. The observed Claude line was:

```text
claude: current (v11) (<selected-config>/hooks/herdr-agent-state.sh)
```

The missing case was `claude: not installed (<selected-config>/hooks/herdr-agent-state.sh)`. The integration version (`v11` in this observation) is **not** the binary's version and may change upstream. Check the Claude line and expected destination; do not require all agents to be installed or assume a successful status-command exit means every integration is current. `--outdated-only` exists but omits current entries, so it is not a substitute for positive detection.

These are installation checks, not proof of pane detection or session restore. Herdr's general `herdr status`, `herdr status server`, and `herdr status client` describe the terminal runtime, not whether this selected Claude integration is installed.

### Manual functional check

1. From a project terminal **outside** Herdr, run `herdr`. If already inside (`HERDR_ENV=1`), use the current pane instead of nesting Herdr.
2. Start an authenticated `claude` session using the selected `CLAUDE_CONFIG_DIR` inside that pane.
3. Confirm the agent appears in Herdr and inspect `herdr agent list`. Observe working/blocked/done transitions rather than inferring hook installation drives them.
4. Detach via the UI/default prefix sequence (`Ctrl+B`, release, then `Q`) and reattach with `herdr`; the process should still be present.
5. Only in a disposable session where stopping processes is acceptable, exercise upstream's native session-restore flow after a server restart. `herdr server stop` stops the default server and its processes; it is **not** a read-only diagnostic or an ordinary detach.

A usable terminal, supported agent version, Claude login/network access, permissions to execute the generated hook, and a running Herdr server are separate prerequisites. SSH credentials for remote machines remain local. None belong in capture output or this repository. The manual flow above was not exercised by recipe research.

## Removal

Remove just this Claude profile's integration:

```bash
CLAUDE_CONFIG_DIR="$HOME/.claude" herdr integration uninstall claude
```

Keep other agents' integrations, settings, sessions, and shared skills untouched. Native uninstall is separate from removing the Herdr program. For a Homebrew installation, use `brew uninstall herdr` only when you deliberately want the program removed. A direct shell install has no documented uninstall subcommand; after deliberately stopping sessions you no longer need, remove only the binary from the exact installation path you selected. Do not delete `~/.config/herdr` automatically: it may contain useful configuration and runtime state.

## Sources

- [Official agent guide](https://herdr.dev/agent-guide.md).
- [Official shell installer source](https://herdr.dev/install.sh) and [installation/update guide](https://herdr.dev/tui/docs/install/).
- [Native integrations guide, including Claude path and behavior](https://herdr.dev/tui/docs/integrations/).

Personal baseline permission/danger-warning preferences are optional user choices, not Herdr integration features and not requirements for session restore.
