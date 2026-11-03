# Setup and CLI reference

Run commands from the cloned repository root with `bash scripts/setup.sh`. The shell entry point uses Python 3's standard library; there is no Python package install step.

```text
bash scripts/setup.sh plan|apply|check|capture \
  [--only preferences,instructions,rules,agents,ponytail,moshi,herdr] \
  [--config-dir PATH]
```

## Commands

| Command | Purpose | Changes |
| --- | --- | --- |
| `plan` | Show the selected configuration changes and integration prerequisites. | No target changes. |
| `apply` | Apply the selected baseline after checking prerequisites. | Backs up affected existing files, merges owned settings, writes selected instructions/rules/agents, and configures selected integrations. |
| `check` | Detect missing/mismatched owned configuration and selected setup prerequisites. | No repair. Exit `0` means setup checks are satisfied; exit `1` means missing/mismatched state. Functional checks remain manual. |
| `capture` | Export declared preferences, personal instructions, the Context7 rule, and librarian definition back to repository inputs. | Updates selected files in `config/`. Never exports shared skills, integration state, or whole-profile snapshots. |

`plan`, `apply`, and `check` select all components by default. `capture` defaults to `preferences,instructions,rules,agents` and rejects integration components. Supply a comma-separated `--only` selection for a smaller scope. The `instructions` component installs `config/CLAUDE.md` as the target's global `CLAUDE.md`; it is separate from the repository's maintainer instructions.

## Targets and profile safety

The default is `~/.claude`. An inherited `CLAUDE_CONFIG_DIR` does not change that default. The protected `~/.claude-and` work-profile target is refused, including paths resolving to it. Do not bypass this safeguard.

For an isolated preferences/documentation-research target, first make the externally maintained `find-docs` skill available under that target's `skills/find-docs/` directory:

```bash
TARGET=$(mktemp -d "${TMPDIR:-/tmp}/claude-setup-personal.XXXXXX")
bash scripts/setup.sh plan --only preferences,rules,agents --config-dir "$TARGET"
bash scripts/setup.sh apply --only preferences,rules,agents --config-dir "$TARGET"
bash scripts/setup.sh check --only preferences,rules,agents --config-dir "$TARGET"
```

Installed targets and private backups must live outside this public checkout; targets inside it are refused. Integration tools have their own routing and external app state. A custom Claude configuration directory is not a sandbox for app installation, OS permissions, pairing, or third-party global state. Read [integration notes](integrations.md) before selecting integrations for a custom target; unsupported target routing must be reported, not silently redirected to the real personal profile.

## Before applying

1. Inspect `config/settings.json`, `config/CLAUDE.md`, `config/rules/context7.md`, and `config/agents/librarian.md`. These are opinionated personal defaults.
2. Read the selected integration's upstream requirements in [integration notes](integrations.md). Install required tools using the linked, verified upstream instructions. Installation may need network access or explicit OS approval.
3. Run `plan` with the exact selection and target you intend to apply. Missing selected prerequisites cause `apply` to fail preflight; previewing is not a prerequisite installation.
4. Check that you have not already installed Ponytail by the other marketplace route.
5. Apply, then run `check`, then perform [manual functional verification](verification.md).

Node.js/npm are needed for the Context7 rule's `npx ctx7@latest` commands at use time. The rule is plain Markdown; adding it is not proof that a documentation query has succeeded. Context7 authentication, if required for your quota, stays outside this repository.

## Librarian documentation research

Install `rules,agents` together for automatic delegation. The `agents` component owns only `agents/librarian.md`, not other agents. Installing `rules` alone requires an existing librarian definition. Both components require the external `skills/find-docs/SKILL.md` in the selected profile; preflight fails before mutation if it is missing. Provision that shared skill separately, including for disposable profiles.

The parent delegates whenever technology-specific documentation is needed: libraries, frameworks, SDKs, APIs, CLI tools, cloud services, setup, configuration, migrations, integrations, and technology-specific debugging. It supplies exact questions, names, versions, environment, constraints, and expected output. Independent questions run in parallel; documentation-dependent work waits for results. Incidental technology mentions and technology-independent work do not trigger research.

The librarian uses `model: haiku`, `effort: low`, `tools: Read, Bash`, `omitClaudeMd: true`, and `skills: [find-docs]`. Its system prompt retains the Context7 policy because it starts without inherited CLAUDE.md context. It uses only Context7 for retrieval, reports source/version gaps and failures, and never substitutes remembered API claims. No WebFetch, WebSearch, implementation tools, persistent memory, or worktree isolation are configured. Bash remains a general command-execution capability; the research-only prompt is not a filesystem security boundary.

Use a Claude Code version supporting `omitClaudeMd` (v2.1.271+) and the selected model's effort setting. `effort: low` requests low effort, not a numeric thinking-token budget; model support and environment overrides affect effective behavior. Restart if this is the profile's first `agents/` directory. See the official [subagent configuration](https://code.claude.com/docs/en/sub-agents#configure-subagents) and [effort behavior](https://code.claude.com/docs/en/sub-agents#choose-an-effort-level).

## Ownership and preservation

The installer owns only the preferences represented by the reviewed settings source, the personal `CLAUDE.md`, the Context7 rule, `agents/librarian.md`, and selected integration configuration. Existing unrelated JSON settings, hooks, agents, and skills remain intact. Selecting `instructions` replaces the target's entire `CLAUDE.md`, with a private backup of any existing file. Affected existing files are backed up under `backups/claude-setup/<UTC-unique>/`, including on repeated applies.

A successful setup does not authenticate Claude Code, grant model access, pair devices, establish app delivery, create a running Herdr session, or establish that any hook executes. The [verification guide](verification.md) separates these concerns.

For updating the portable baseline from a deliberately chosen profile, see [capture and maintenance](maintenance.md). For contributing code or catalog entries, see [community guidance](community.md).
