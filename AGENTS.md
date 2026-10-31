# Repository instructions

Maintain a portable Claude Code setup and a community plugin/mod catalog. This file guides repository maintenance; it is not installed as global user instructions.

## Layout

- `config/`: portable baseline inputs.
- `scripts/`: setup, verification, and allowlisted capture commands.
- `.claude-plugin/marketplace.json`: independently installable plugin catalog.
- `plugins/<name>/`: original plugins, each with its own manifest and implementation.
- `docs/`: setup, maintenance, and contribution guidance.

## Working rules

- Always consult the current [official Claude Code documentation](https://code.claude.com/docs) when answering questions, planning changes, implementing features, or troubleshooting this setup; verify behavior against the docs rather than relying on memory.
- Keep baseline configuration and optional plugins independently usable. Shared skill collections live outside this repository.
- Preserve unrelated user configuration. Preview changes without mutation, back up affected files before applying, and avoid duplicate configuration.
- Capture only explicitly owned settings and rules, never entire profiles.
- Develop and verify against disposable configuration directories, not real user profiles.
- Never commit credentials, account state, history, machine-specific paths, caches, backups, or downloaded binaries.
- Follow existing conventions and verify upstream integration commands. Attribute external work and preserve its licensing.
- Ship working implementations, not placeholders. Update affected documentation when behavior changes.
- Exercise changed behavior and report only observed results. Configuration detection is not end-to-end verification; follow [docs/verification.md](docs/verification.md).
