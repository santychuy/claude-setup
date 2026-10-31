# Setup and CLI reference

Run commands from the cloned repository root with `bash scripts/setup.sh`. The shell entry point uses Python 3's standard library; there is no Python package install step.

```text
bash scripts/setup.sh plan|apply|check|capture \
  [--only preferences,instructions,rules,ponytail,moshi,herdr] \
  [--config-dir PATH]
```

## Commands

| Command | Purpose | Changes |
| --- | --- | --- |
| `plan` | Show the selected configuration changes and integration prerequisites. | No target changes. |
| `apply` | Apply the selected baseline after checking prerequisites. | Backs up affected existing files, merges owned settings, writes selected instructions/rules, and configures selected integrations. |
| `check` | Detect missing/mismatched owned configuration and selected setup prerequisites. | No repair. Exit `0` means setup checks are satisfied; exit `1` means missing/mismatched state. Functional checks remain manual. |
| `capture` | Export declared preferences, personal instructions, and the Context7 rule back to repository inputs. | Updates selected files in `config/`. Never exports integration state or whole-profile snapshots. |

`plan`, `apply`, and `check` select all components by default. `capture` defaults to `preferences,instructions,rules` and rejects integration components. Supply a comma-separated `--only` selection for a smaller scope. The `instructions` component installs `config/CLAUDE.md` as the target's global `CLAUDE.md`; it is separate from the repository's maintainer instructions.

## Targets and profile safety

The default is `~/.claude`. An inherited `CLAUDE_CONFIG_DIR` does not change that default. The protected `~/.claude-and` work-profile target is refused, including paths resolving to it. Do not bypass this safeguard.

For an isolated preferences/rules target:

```bash
TARGET=$(mktemp -d "${TMPDIR:-/tmp}/claude-setup-personal.XXXXXX")
bash scripts/setup.sh plan --only preferences,rules --config-dir "$TARGET"
bash scripts/setup.sh apply --only preferences,rules --config-dir "$TARGET"
bash scripts/setup.sh check --only preferences,rules --config-dir "$TARGET"
```

Installed targets and private backups must live outside this public checkout; targets inside it are refused. Integration tools have their own routing and external app state. A custom Claude configuration directory is not a sandbox for app installation, OS permissions, pairing, or third-party global state. Read [integration notes](integrations.md) before selecting integrations for a custom target; unsupported target routing must be reported, not silently redirected to the real personal profile.

## Before applying

1. Inspect `config/settings.json`, `config/CLAUDE.md`, and `config/rules/context7.md`. These are opinionated personal defaults.
2. Read the selected integration's upstream requirements in [integration notes](integrations.md). Install required tools using the linked, verified upstream instructions. Installation may need network access or explicit OS approval.
3. Run `plan` with the exact selection and target you intend to apply. Missing selected prerequisites cause `apply` to fail preflight; previewing is not a prerequisite installation.
4. Check that you have not already installed Ponytail by the other marketplace route.
5. Apply, then run `check`, then perform [manual functional verification](verification.md).

Node.js/npm are needed for the Context7 rule's `npx ctx7@latest` commands at use time. The rule is plain Markdown; adding it is not proof that a documentation query has succeeded. Context7 authentication, if required for your quota, stays outside this repository.

## Ownership and preservation

The installer owns only the preferences represented by the reviewed settings source, the personal `CLAUDE.md`, the Context7 rule, and selected integration configuration. Existing unrelated JSON settings and hooks remain intact. Selecting `instructions` replaces the target's entire `CLAUDE.md`, with a private backup of any existing file. Affected existing files are backed up under `backups/claude-setup/<UTC-unique>/`, including on repeated applies.

A successful setup does not authenticate Claude Code, grant model access, pair devices, establish app delivery, create a running Herdr session, or establish that any hook executes. The [verification guide](verification.md) separates these concerns.

For updating the portable baseline from a deliberately chosen profile, see [capture and maintenance](maintenance.md). For contributing code or catalog entries, see [community guidance](community.md).
