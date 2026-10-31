# claude-setup

A portable personal [Claude Code](https://code.claude.com/docs) baseline, plus a community plugin/mod catalog maintained by [Santychuy](https://github.com/santychuy).

**Two independent ways to use it:** apply the full personal baseline or choose individual components; alternatively, install only a catalog plugin without adopting the baseline. This is **macOS-first**, not a claim that every integration works on every platform.

## What's included

| Component | What it does | Install route |
| --- | --- | --- |
| **Preferences** | Opus, high effort for the configured Opus model, fullscreen terminal UI, dark theme, and the dangerous-mode prompt preference. | `--only preferences` · [source](config/settings.json) |
| **Context7 rule** | Ask Claude to consult current technology documentation with the Context7 CLI, rather than rely on remembered APIs. A standing rule, not a shared skill. | `--only rules` · [source](config/rules/context7.md) |
| **Ponytail** | Upstream simplicity-first coding guidance and task feedback by Dietrich Gebert. | `--only ponytail` · [integration notes](docs/integrations.md) |
| **Moshi** | Upstream Claude lifecycle/permission hooks and Chat View integration for the paired app. | `--only moshi` · [integration notes](docs/integrations.md) |
| **Herdr** | Upstream terminal orchestration and Claude session integration. | `--only herdr` · [integration notes](docs/integrations.md) |

Inspired by the clear catalog presentation in [midudev/better-claude](https://github.com/midudev/better-claude), not a copy of its plugins. No original custom plugins are shipped here yet. Shared skill collections, Orca, Argent, credentials, account state, and personal/work session data are outside this repository's scope. Ponytail is fetched as its native upstream plugin, including the components upstream ships; no separate shared-skills repository is copied or installed.

## Quickstart: full baseline

You need Git, Bash, and Python 3 to use the installer. Integration components also need their upstream prerequisites: install Claude Code and the runtime/apps described in [integration notes](docs/integrations.md) first. The rules component requires Node.js/npm (`npx`), and Context7 lookups need network access. The installer reports missing prerequisites rather than silently installing every app.

```bash
git clone https://github.com/santychuy/claude-setup.git
cd claude-setup
bash scripts/setup.sh plan
```

Review the planned settings, integrations, and prerequisites before continuing. `plan` is read-only.

```bash
bash scripts/setup.sh apply
bash scripts/setup.sh check
```

The default target is `~/.claude`, deliberately ignoring an inherited `CLAUDE_CONFIG_DIR` so a work profile is not selected accidentally. The protected `~/.claude-and` profile is refused, including aliases resolving to it. Use `--config-dir PATH` to select another target; see [setup details](docs/setup.md) before routing third-party integrations there.

**Read the preferences first.** They include `skipDangerousModePermissionPrompt: true`, which suppresses a warning prompt; it is not a recommendation to bypass permissions, and the installer does not launch Claude with a permission-bypass flag. Model access and UI support depend on your installed Claude Code version and account.

`apply` backs up affected existing configuration and preserves unrelated settings and hooks. It is re-runnable. A successful `check` confirms the documented setup state, **not** working paired-app delivery, Chat View, plugin hooks, or terminal orchestration. Complete the [manual functional checks](docs/verification.md).

## Pick only what you want

No integration is mandatory when selecting a subset. For example, apply only portable preferences and the documentation rule:

```bash
bash scripts/setup.sh plan --only preferences,rules
bash scripts/setup.sh apply --only preferences,rules
bash scripts/setup.sh check --only preferences,rules
```

The accepted component names are `preferences`, `rules`, `ponytail`, `moshi`, and `herdr`. Omit `--only` to select the full baseline. Missing dependencies for an unselected component should not require installing it.

## Set up with an agent

Clone the repository, open your coding agent in it, and give it this prompt:

> Set up this repository's Claude Code baseline for my personal profile. Read README.md, AGENTS.md, docs/setup.md, and docs/integrations.md first. Do not copy or install shared skill collections or add Orca/Argent. Do not inspect or modify my work profile or capture account state. Run `bash scripts/setup.sh plan` before making changes and show the target and planned changes. Install only selected missing prerequisites using the verified upstream instructions, then apply the baseline with `bash scripts/setup.sh apply`. Preserve unrelated settings and hooks and use the installer's backups. Never choose both Ponytail marketplace routes. Run `bash scripts/setup.sh check`, report what it actually detects, and guide me through the manual functional checks without claiming pairing, app delivery, hooks, or sessions work until observed. Never commit secrets or private backups.

If you want only certain components or a separate target, replace “baseline” in the prompt with the exact `--only` selection and `--config-dir` path.

## Community plugins, without the baseline

| Plugin | What it does | Ownership/source |
| --- | --- | --- |
| **Ponytail** | Simplicity-first coding guidance and task feedback. | **Third-party**, [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail), pinned external GitHub source. |

```bash
claude plugin marketplace add santychuy/claude-setup
claude plugin install ponytail@claude-setup
```

This is an **alternative** to the baseline's `ponytail@ponytail` upstream route, not an extra plugin to install alongside it. Choose one to avoid duplicate loading. The upstream route remains the baseline default; the community entry is a curated reference, not a Santychuy-authored plugin. See [community distribution and contributions](docs/community.md).

## Keep it personal, portable, and reviewable

- [Setup and CLI reference](docs/setup.md)
- [Integration prerequisites and upstream attribution](docs/integrations.md)
- [Capture, maintenance, and recovery](docs/maintenance.md)
- [Setup detection versus functional verification](docs/verification.md)
- [Community catalog and contributions](docs/community.md)

The root [AGENTS.md](AGENTS.md) is for repository maintainers. It is **not installed as global Claude instructions**. Portable installed behavior comes from the reviewed `config/` inputs.

MIT © 2026 Santychuy for repository-owned work. External projects retain their own authorship and licenses; see [LICENSE](LICENSE) and the integration references.
