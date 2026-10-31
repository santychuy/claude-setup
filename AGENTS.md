# Repository maintainer instructions

These instructions govern work **in this repository**. This file is not installed as a user's global Claude instructions. The portable instructions under `config/` are the installation source of truth; keep repository maintenance policy separate from their content.

## Scope

- Maintain a portable personal baseline and a community Claude Code plugin/mod catalog.
- The baseline consists only of preferences, a Context7 documentation rule, Ponytail, Moshi, and Herdr.
- Shared skills are out of scope: do not copy, discover, capture, link, or install skill collections. Do not add Orca or Argent.
- Never read or modify a maintainer's real personal/work configuration to develop or verify the installer. Use a disposable configuration directory; the protected `.claude-and` target must remain refused.
- Never commit credentials, authentication/account state, session history, machine-specific paths, downloaded binaries, plugin caches, or configuration backups.

## Ownership and layout

- `config/`: reviewed, portable baseline inputs, not a full home-directory snapshot.
- `scripts/setup.sh`: public command entry point; `scripts/setup.py`: Python 3 standard-library implementation.
- `.claude-plugin/marketplace.json`: the community catalog, independent of installing the full baseline.
- `docs/`: setup, maintenance, contribution, and manual verification guidance.
- Future original plugins belong in `plugins/<name>/`, with a real `.claude-plugin/plugin.json` and any hook files under that plugin's root. Do not create empty examples, fake plugins, or unrequested behavior.

## Installer contract

Keep `plan`, `apply`, `check`, and `capture` aligned with the documented CLI. Support `--only preferences,rules,ponytail,moshi,herdr` and `--config-dir PATH`. Preview must not mutate the target. Applying must back up affected existing files, preserve unrelated JSON settings and hooks, and avoid duplicate owned configuration. Capture is limited to preferences and rules: use an explicit allowlist rather than copying a settings file wholesale.

Keep baseline Ponytail's upstream installation identity distinct from the alternative `ponytail@claude-setup` catalog identity. Never enable both routes or silently migrate a user's existing plugin ownership. Attribute external work accurately and retain upstream licensing.

## Change discipline

Read existing implementation and the relevant upstream documentation before changing behavior. Keep configuration portable and integration commands explicit. Do not weaken checks to hide failures or claim platform support without evidence. Update affected documentation with a permanent change.

Setup detection is not a functional integration test. Report exactly which checks were run, which were not, and what remains manual. Use the disposable-target and end-to-end guidance in [docs/verification.md](docs/verification.md); never treat a present executable or settings key as proof of working audio, notifications, hooks, documentation lookup, or terminal orchestration.
