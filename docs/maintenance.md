# Capture, maintenance, and recovery

The repository is a reviewed portable baseline, not a backup of a Claude home directory. Keep credentials, account/project state, session history, hooks from unrelated tools, shared skills, and machine-specific paths out of commits.

## Change the baseline directly

Edit or add preferences directly in `config/settings.json`, or edit the Context7 policy in `config/rules/context7.md`. The settings file defines the managed preference fields; no Python allowlist needs updating. Nested objects are merged by their declared leaf fields, preserving undeclared siblings. Arrays and explicitly empty objects are managed as whole values. Removing a field stops managing it; it does not delete the installed value. Review the change and use `plan` before applying it.

For integration changes, inspect the linked upstream documentation and current commands before changing a recipe. Do not turn a known unsupported platform or profile-routing limitation into a silent fallback. Update the recipe and user-facing caveats together.

## Capture intentional personal changes

Capture reads only preference fields already declared in `config/settings.json` and the Context7 rule; it is **not** a full profile export. Add a preference to the repository settings first if you want to capture its local value. Its default selection is `preferences,rules`, and integration capture is rejected. The output updates `config/settings.json` and `config/rules/context7.md` for the selected components.

From the repository root, explicitly select the intended personal source if it is not the default:

```bash
bash scripts/setup.sh capture --only preferences,rules --config-dir "$HOME/.claude"
```

Omit `--config-dir` only when you deliberately want to capture from the default personal `~/.claude` profile. The work profile `~/.claude-and` remains refused. Do not copy a profile into the repository to make capture easier.

Before publishing captured changes:

1. Inspect the exact diff of `config/`. Capture only exports owned preference keys; still review every value and every line of the rule for private paths, names, tokens, URLs containing credentials, and accidental instructions.
2. Declare only preferences you intend to publish in `config/settings.json`; never add private settings just to capture an entire profile.
3. Confirm no integration caches, shared skills, downloaded apps, account state, or backup directories were added.
4. Update documentation if the default behavior changed. A captured preference is a deliberate baseline change, not automatically suitable for everyone.
5. Exercise the updated baseline in a disposable target using the [verification guide](verification.md), then submit a focused change.

Do not run `capture` as an automatic post-install step: it writes repository inputs and could replace reviewed defaults with unrelated local choices.

## Updating and reapplying

Pull reviewed repository changes, read the diff, run `plan` with your chosen components, then `apply` and `check`. Reapplying preserves unrelated JSON settings/hooks and avoids duplicating owned integration configuration. It can still overwrite values this baseline owns, so keep local intentional changes captured or recorded before updating.

The community catalog's Ponytail source is pinned independently of the baseline's upstream marketplace route. Updating this repository does not automatically update a cached plugin, an upstream CLI, or a running application. Manage third-party updates through the upstream tool and Claude Code's plugin controls, then repeat the corresponding manual functional check. Never install both Ponytail identities as an update strategy.

## Backups and recovery

Affected existing configuration is backed up before apply under the target directory, including on repeated applies:

```text
backups/claude-setup/<UTC-unique>/
```

Those files may contain private settings and hooks. They belong to the selected configuration target, **not** the public repository. Backups are not substitutes for a complete profile backup and do not roll back external application installation, OS permissions, pairing, or arbitrary upstream global state.

To recover a setting or rule:

1. Stop the relevant Claude session before changing its active configuration.
2. Locate the backup for the apply operation and compare it with the current target file.
3. Restore only the intended owned values or rule content, preserving unrelated changes made since the backup. A wholesale settings restore can erase newer unrelated work.
4. Use upstream uninstall/configuration commands from the integration recipe for externally managed plugin or hook state. Do not delete unrelated hooks or remove all marketplaces.
5. Start a new session and repeat the relevant setup and functional checks.

There is no blanket “delete the Claude directory” recovery step and no general-purpose profile synchronization command. The installer does not own the rest of your configuration.
