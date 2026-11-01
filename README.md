# claude-setup

My portable [Claude Code](https://code.claude.com/docs) setup and a catalog of plugins and mods you can install independently.

## Quick start

The full setup includes personal preferences and instructions, a Context7 documentation rule, Ponytail, Moshi, and Herdr. Currently macOS-first.

Install Git, Bash, Python 3, Claude Code, and Node.js/npm. Follow the [integration prerequisites](docs/integrations.md) for Moshi and Herdr.

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

## Install selected components

Use `--only` with any combination:

| Component | Includes |
| --- | --- |
| `preferences` | Model, appearance, attribution, and the built-in Concise output style |
| `instructions` | General workflow guidance from [config/CLAUDE.md](config/CLAUDE.md), installed as `~/.claude/CLAUDE.md` |
| `rules` | Context7: consult current documentation instead of relying on remembered APIs |
| `ponytail` | Simplicity-first coding guidance, with its interface band hidden by default |
| `moshi` | Claude notifications, approvals, and Chat View integration |
| `herdr` | Terminal workspace and Claude session integration |

For example, install only preferences and rules:

```bash
bash scripts/setup.sh plan --only preferences,rules
bash scripts/setup.sh apply --only preferences,rules
bash scripts/setup.sh check --only preferences,rules
```

Use `--config-dir PATH` to choose another installation directory. See the [CLI reference](docs/setup.md) for details.

## Set up with an agent

Copy this prompt into your coding agent:

```text
Clone https://github.com/santychuy/claude-setup into a local directory
and use it to set up my personal Claude Code environment.

Read README.md, AGENTS.md, docs/setup.md, and docs/integrations.md.
Install the required prerequisites using their upstream instructions.
Run `bash scripts/setup.sh plan` and show me the planned changes.
Then apply the setup and run `bash scripts/setup.sh check`.

Preserve unrelated configuration and use the installer's backups.
Guide me through any sign-in, pairing, and manual functional checks.
Report what was verified and what still needs my action.
```

For a smaller setup, add your selection to the prompt—for example, “Install only `preferences,rules`.”

## Community plugins and mods

Install individual plugins without applying the personal setup:

```bash
claude plugin marketplace add santychuy/claude-setup
claude plugin install usage-meter@claude-setup
```

| Plugin | Description |
| --- | --- |
| [Usage Meter](plugins/usage-meter/README.md) | Vertical account usage limits at the footer's right edge; supports weekly-only accounts |
| [Ponytail](https://github.com/DietrichGebert/ponytail) | Simplicity-first coding guidance by Dietrich Gebert |

Choose either this Ponytail installation or the full setup's upstream route, not both.

Future plugins will appear in this catalog. Once listed, install one using its published name:

```text
claude plugin install <plugin-name>@claude-setup
```

See [community guidance](docs/community.md) to contribute a plugin or mod.

## Maintenance

- [Capture local changes, update, and recover backups](docs/maintenance.md)
- [Integration setup](docs/integrations.md)
- [Functional verification](docs/verification.md)

MIT © 2026 Santychuy. See [LICENSE](LICENSE); third-party plugins retain their own licenses.
