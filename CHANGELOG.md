# Changelog

## 2026-10-31

- Make Ponytail's persistent band visibility portable through `config/.ponytail-band`, defaulting to `off`, with installer preview, backup, apply, and check support.
- Add the `instructions` component to preview, back up, install, check, and capture personal `CLAUDE.md` independently of repository maintainer instructions.
- Let `config/settings.json` define managed preference fields instead of a hardcoded Python allowlist. New settings work with preview, apply, check, and scoped capture without script changes.
- Publish a macOS-first personal Claude Code baseline with reviewed Opus/UI preferences and an independent Context7 documentation rule.
- Add selective plan, apply, check, and allowlisted capture commands with private backups and work-profile protection.
- Connect upstream Ponytail, Moshi, and Herdr without vendoring shared skills, credentials, history, or app-generated integration source.
- Use Ponytail release tag v5.3.2 for the baseline. Its release commit differs from the original machine's installed commit, although both declare 5.3.2; record both in the integration recipe.
- Isolate Moshi's installer configuration to omit its generated visuals skill without changing host-wide settings or pairing.
- Publish a native community marketplace with an attributed, commit-pinned upstream Ponytail entry, independent of the personal baseline. No original custom plugins are included.
- Add agent-assisted setup, selective adoption, maintenance, recovery, contribution, and manual functional verification instructions.
