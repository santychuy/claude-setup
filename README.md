# claude-setup

My portable [Claude Code](https://code.claude.com/docs) setup and a catalog of plugins and mods you can install independently.

## Quick start

The full setup includes my personal preferences and instructions.

Shared skills are maintained separately and are not included in this repository. If you don't already have them, [install the required skills](#shared-skills) before applying the setup.

```bash
git clone https://github.com/santychuy/claude-setup.git
cd claude-setup

# Preview the changes.
bash scripts/setup.sh plan

# Apply the setup, then check its configuration.
bash scripts/setup.sh apply
bash scripts/setup.sh check
```

Installs into `~/.claude`, backs up affected files, and preserves unrelated settings. Review [the preferences](config/settings.json) first: they include skipping the dangerous-mode confirmation prompt. Complete the [functional checks](docs/verification.md) after installation.

## Set up with an agent

Copy this prompt into your coding agent:

```text
Clone https://github.com/santychuy/claude-setup into a local directory
and use it to set up my personal Claude Code environment.

Read README.md, AGENTS.md, docs/setup.md, and docs/integrations.md.
Set up missing shared skills and selected integrations using the
linked instructions.
Run `bash scripts/setup.sh plan` and show me the planned changes.
Then apply the setup and run `bash scripts/setup.sh check`.

Preserve unrelated configuration and use the installer's backups.
Guide me through any sign-in, pairing, and manual functional checks.
Report what was verified and what still needs my action.
```

For a smaller setup, add your selection to the prompt—for example, “Install only `preferences,rules,agents`.”

## Shared skills

Shared skills are maintained separately. Install any you're missing:

| Skill | Description | Install |
| --- | --- | --- |
| [find-docs](https://skills.sh/upstash/context7/find-docs) | Current documentation lookup through Context7; required by librarian | `npx skills add upstash/context7 --skill find-docs --agent claude-code --global` |

## Install selected components

Use `--only` with any combination:

| Component | Includes |
| --- | --- |
| `preferences` | Model, appearance, attribution, and the built-in Concise output style |
| `instructions` | General workflow guidance from [config/CLAUDE.md](config/CLAUDE.md), installed as `~/.claude/CLAUDE.md` |
| `rules` | Require delegation of technology-specific documentation research to `librarian` |
| `agents` | Haiku librarian: low effort, Read/Bash only, preloaded external `find-docs`, no inherited CLAUDE.md |
| `ponytail` | Simplicity-first coding guidance, with its interface band hidden by default |
| `moshi` | Claude notifications, approvals, and Chat View integration |
| `herdr` | Terminal workspace and Claude session integration |

For example, install preferences and documentation research:

```bash
bash scripts/setup.sh plan --only preferences,rules,agents
bash scripts/setup.sh apply --only preferences,rules,agents
bash scripts/setup.sh check --only preferences,rules,agents
```

Use `--config-dir PATH` to choose another installation directory. See the [CLI reference](docs/setup.md) for details and the [integration notes](docs/integrations.md) for Ponytail, Moshi, and Herdr.

## Community plugins and mods

Install individual plugins without applying the personal setup:

```bash
claude plugin marketplace add santychuy/claude-setup
claude plugin install usage-meter@claude-setup
```

| Plugin | Description |
| --- | --- |
| [Usage Meter](plugins/usage-meter/README.md) | Vertical account usage limits at the footer's right edge; supports weekly-only accounts |
| [Commit](plugins/commit/README.md) | Three-choice `/commit` picker with atomic Conventional Commits, optional push, and new-branch push |
| [Ponytail](https://github.com/DietrichGebert/ponytail) | Simplicity-first coding guidance by Dietrich Gebert |

Choose either this Ponytail installation or the full setup's upstream route, not both.

Install any catalog entry using its published name:

```text
claude plugin install <plugin-name>@claude-setup
```

See [community guidance](docs/community.md) to contribute a plugin or mod.

## Maintenance

- [Capture local changes, update, and recover backups](docs/maintenance.md)
- [Integration setup](docs/integrations.md)
- [Functional verification](docs/verification.md)

MIT © 2026 Santychuy. See [LICENSE](LICENSE); third-party plugins retain their own licenses.
