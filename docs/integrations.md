# Integration prerequisites and upstream attribution

This baseline is **macOS-first**. Portable JSON/Markdown preferences do not make desktop apps, paired-device integration, terminal integration, or upstream installers universally cross-platform. Check each upstream project's requirements for your environment before applying it. Repository setup detection does not establish functional behavior.

| Component | Maintained recipe | Role |
| --- | --- | --- |
| Ponytail | [Ponytail recipe](../integrations/ponytail/README.md) | Native upstream Claude Code plugin; baseline uses `ponytail@ponytail`. |
| Moshi | [Moshi recipe](../integrations/moshi/README.md) | Upstream app/CLI, Claude lifecycle/permission hooks, and Chat View integration; app pairing remains manual. |
| Herdr | [Herdr recipe](../integrations/herdr/README.md) | Upstream terminal multiplexer/orchestration CLI and Claude session hooks. |

The recipes link authoritative upstream sources, exact installation/configuration commands, dependencies, profile-routing constraints, and manual functional checks. Review third-party installers and plugin hooks before allowing them to run with your account's permissions. External software remains its authors' work under its own license; this repository does not claim authorship or endorsement.

## Prerequisites are explicit

The baseline installer previews missing selected prerequisites with `plan` and fails `apply` preflight when they are not met. It does not silently install every system application, authenticate accounts, pair devices, or grant OS permissions. Use the recipe's verified installation instructions, then rerun your selected plan/apply/check commands.

Context7's standing rule separately requires Node.js/npm (`npx`) and network access when looking up documentation. It is not an MCP server installation or a copied shared skill. Authentication for quota, if needed, is private user state and must not be captured.

## Moshi and the no-shared-skills boundary

Moshi's upstream global installation can install `moshi-visuals` skills when its inline-visuals default is enabled. There is no documented `--no-skills` switch in the researched CLI. Do not run that unisolated default path to reproduce this baseline.

The baseline uses an isolated temporary installer environment: temporary `HOME`, `XDG_CONFIG_HOME`, and `MOSHI_CONFIG_DIR`, `MOSHI_HOOK_SKIP_FIRST_RUN=1`, and temporary Moshi configuration with `[gateway] inline_visuals = false`. `CLAUDE_CONFIG_DIR` still points to the explicitly selected Claude target. It invokes the native `moshi-hook install --target claude` command, generating the target's native hooks and local plugin without installing shared visuals skills or changing the user's host-wide inline-visuals preference. The temporary installer paths are not runtime hook dependencies. See the recipe for the full procedure and detection limitations; do not replace it with a global toggle that changes another harness.

## Ponytail: choose one installation identity

The personal baseline uses upstream `ponytail@ponytail`. The community catalog offers `ponytail@claude-setup`, pinned to an external upstream commit, as an independent alternative. Both refer to Dietrich Gebert's project; neither makes the plugin Santychuy-authored. Never install both in one profile. See [community guidance](community.md) for the catalog route and update policy.

Ponytail is installed as its native upstream plugin, including whatever plugin components upstream ships. This does not authorize a separate shared-skills collection install or copying upstream skills into this repository. Optional upstream task ledgers, webhook URLs/tokens, app pairings, and similar runtime state are private; review their defaults and do not capture them.

## Custom targets are not app sandboxes

A selected `--config-dir` must be respected by the integration command or rejected explicitly. It must never silently fall back to the real personal/work profile. Even tools with correct Claude target routing can have host-wide state outside that directory. Use integration recipes to understand that boundary before exercising an apply in a disposable target.

After setup checks, use the [manual verification guide](verification.md). Presence of a binary, hooks, or an enabled plugin is only detection, not end-to-end proof.
