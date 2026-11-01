# Community catalog and contributions

This repository serves two different audiences:

1. **Baseline users** apply reviewed personal preferences and integrations with `bash scripts/setup.sh`.
2. **Plugin users** register the marketplace and install just a catalog entry, without adopting the personal baseline.

The table-first catalog presentation is inspired by [midudev/better-claude](https://github.com/midudev/better-claude). No better-claude plugin code is copied here. No shared skills are copied or installed.

## Usage Meter

[Usage Meter](../plugins/usage-meter/README.md) is this repository's TypeScript mod. It shows available subscription windows vertically at the footer's right edge, including weekly-only accounts.

```bash
claude plugin marketplace add santychuy/claude-setup
claude plugin install usage-meter@claude-setup --scope user
```

It is independent of the personal baseline and the Ponytail entry. It uses native session usage, not credentials, scraped account endpoints, or model requests. See its README for local development and availability limits.

## Curated third-party Ponytail

Ponytail is external upstream software, not a plugin authored by Santychuy. The catalog points to its upstream GitHub repository at a pinned commit; it does not vendor or relicense that code. See [the catalog](../.claude-plugin/marketplace.json) for the exact source and pin and [integration notes](integrations.md) for attribution and prerequisites.

Use this route **instead of**, not in addition to, the baseline's upstream Ponytail installation:

```bash
claude plugin marketplace add santychuy/claude-setup
claude plugin install ponytail@claude-setup
```

The baseline installer uses Ponytail's upstream marketplace identity. `ponytail@claude-setup` is a separate Claude Code installation identity even though it points to the same upstream project. Installing both can load duplicate behavior. Choose one route, inspect existing installations first, and do not run the baseline's Ponytail component after choosing the catalog route. You can still install the remaining baseline components explicitly:

```bash
bash scripts/setup.sh plan --only preferences,instructions,rules,moshi,herdr
bash scripts/setup.sh apply --only preferences,instructions,rules,moshi,herdr
```

Catalog installation does not install the full baseline, configure Moshi or Herdr, or apply personal preferences. Review third-party code before installing: plugin hooks execute with your account's permissions. A commit pin improves reproducibility; it is not a security audit or a promise that upstream will retain that commit forever.

## Marketplace format and pin updates

Claude Code's official [Create a marketplace](https://code.claude.com/docs/en/plugins/create-marketplace) and [Marketplace reference](https://code.claude.com/docs/en/plugins/marketplace-reference) document external plugin sources. A `github` plugin source has this shape:

```json
{
  "source": "github",
  "repo": "owner/repository",
  "sha": "<full 40-character lowercase commit SHA>"
}
```

This is an explanatory schema example, not a usable source or an additional catalog entry. The real manifest contains a resolved upstream commit. Keep the entry name equal to the upstream plugin manifest name. Do not add catalog-level components that alter an external plugin's behavior.

To update a pin, inspect the upstream diff and license, confirm the plugin manifest and installation requirements, update the exact SHA, and explain the reviewed change in the pull request. Marketplace validation checks structure; only installation exercises fetching the remote source. Users must update their marketplace and plugin through Claude Code to receive a new pin; merely pulling this repository does not update an already cached installation.

## Contributing original plugins and mods

Open an issue or pull request with the user-visible behavior, platform requirements, permissions, and upstream references. Keep baseline preferences and optional plugins independent. Do not submit a placeholder plugin, unrelated shared skills, or an unrequested integration.

Follow the existing Usage Meter layout for an original plugin:

```text
plugins/<name>/
  .claude-plugin/plugin.json
  hooks/hooks.json          # only if the plugin actually uses hooks
  ...real implementation files...
```

Only the manifest belongs inside `.claude-plugin/`; hooks and implementation files belong under the plugin root. Declare a matching kebab-case name, version, description, author, and license in the manifest. Use paths relative to the plugin root, and `${CLAUDE_PLUGIN_ROOT}` for runtime hook paths rather than a developer's absolute paths. Add a catalog entry with `"source": "./plugins/<name>"`, resolved from the repository root. Follow the official [plugin manifest reference](https://code.claude.com/docs/en/plugins/manifest-reference) and [hook reference](https://code.claude.com/docs/en/hooks).

Include concise usage, supported platforms, failure behavior, and real functional verification steps. Validate the plugin and marketplace and exercise the actual behavior before publishing; do not report checks as passed unless they ran. For account-dependent UI, distinguish real session verification from unavailable account states covered in the native test suite.

## License and attribution

Repository-owned code and documentation are MIT licensed, copyright Santychuy; see [LICENSE](../LICENSE). External integrations remain their authors' work under their own licenses. A catalog reference does not transfer ownership or imply endorsement by upstream maintainers or Anthropic.
