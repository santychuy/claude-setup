# Setup detection versus functional verification

This document is a checklist to run deliberately, not a record of checks already performed. **No command output or passing result is claimed here.** Record your actual command, selected components, target, tool versions, observed result, and any manual steps not completed. Never publish private target files or transcripts containing sensitive data.

## 1. Installer behavior in a disposable target

Use a throwaway directory, never the maintainer's real personal/work profile. Start with preferences and rules so testing the installer cannot install apps, pair a device, or register integration hooks globally:

```bash
TARGET=$(mktemp -d "${TMPDIR:-/tmp}/claude-setup-check.XXXXXX")
bash scripts/setup.sh plan --only preferences,rules --config-dir "$TARGET"
bash scripts/setup.sh apply --only preferences,rules --config-dir "$TARGET"
bash scripts/setup.sh check --only preferences,rules --config-dir "$TARGET"
```

At this public CLI boundary, confirm these independent behaviors:

- `plan` makes no target changes and describes the selected scope.
- `apply` writes the owned preferences and Context7 rule to that target only.
- Existing unrelated settings and hooks survive an apply. Seed them deliberately before applying; do not use private real-profile fixtures.
- Repeating an apply leaves equivalent configuration and does not duplicate owned hooks/settings.
- Changing an owned preference causes `check` to report a mismatch and return `1`; matching setup returns `0`.
- An existing changed file has a recoverable backup under the target's private `backups/claude-setup/` directory.
- Capture exports only allowlisted preferences/the Context7 rule and rejects integration capture. Because capture changes repository inputs, exercise it in a disposable checkout, not the checkout holding uncommitted baseline edits.

Do not point an automated check at the real protected work profile. Its refusal should be exercised only with an isolated home/profile fixture; a separate target is not permission to inspect a user's work configuration.

## 2. Integration setup detection

Run `bash scripts/setup.sh check` with the same `--only` and `--config-dir` options used to apply. Read [integration notes](integrations.md) for each tool's prerequisites, detection limits, and target support.

A zero exit status is limited to the implemented setup checks. Examples of setup evidence include a recognized executable, a selected plugin identity, a configuration value, or registered hooks. None of these alone proves that a real Claude turn can invoke a hook or that a paired app, terminal, notification, or voice workflow works.

Before integration installation, confirm the planned target routing. Some upstream commands also affect app-wide state outside the Claude directory; disposable configuration does not make those side effects disposable. Never use the real maintainer profile as a substitute for missing isolated end-to-end coverage.

## 3. Functional manual checks

Perform these only in a deliberately chosen personal test environment after prerequisites and permissions are configured. Follow the concrete commands in the linked integration recipes.

| Component | Exercise the actual behavior | What counts as evidence |
| --- | --- | --- |
| Preferences | Start a fresh Claude session using the selected profile and inspect the effective model/UI preferences. | Supported settings are reflected in the live session; unsupported model access or version limitations are reported. |
| Context7 rule | Ask a technology-specific question that requires current documentation. | Claude resolves the library with `npx ctx7@latest library`, fetches relevant docs, and grounds its answer in the retrieved material. File presence alone does not count. |
| Ponytail | Start a fresh session with exactly one Ponytail identity enabled and use an upstream-supported command/interaction. | The plugin loads without hook/runtime errors and the documented upstream behavior is observed. Do not infer success merely from an `enabledPlugins` entry. |
| Moshi | Complete upstream app/device pairing, then exercise a documented lifecycle/permission event and the Chat View integration from a real Claude session. | The intended paired app receives/displays the actual event and the selected Chat View workflow is observed. An executable or installed hook is not delivery evidence. |
| Herdr | Start/use a Herdr-managed terminal session and start Claude inside it according to the recipe. | The real session is detected and the documented identity/restore/terminal workflow works. Registered SessionStart hooks outside Herdr are not proof. |

Use the installer's isolated Moshi route, which disables inline visuals only inside its temporary installer configuration. Do not install visuals skills or change another harness's global preferences merely to complete a test. See [the Moshi recipe](../integrations/moshi/README.md).

## 4. Marketplace release checks

These commands are suggested for the integration owner/release maintainer; this document does not claim they have run:

```bash
claude plugin validate .
```

Validation checks local manifest structure. It does not prove a pinned external repository can be fetched or that plugin hooks work. In a deliberately isolated Claude configuration, add the local checkout as a marketplace, install `ponytail@claude-setup`, and perform the Ponytail functional check above. Do not install this catalog identity alongside the baseline's `ponytail@ponytail` identity. Do not register an unpublished GitHub repository as evidence that publishing already succeeded.

A release report should distinguish: installer behavior checked; marketplace structure validated; remote source installation exercised; integration setup detected; and manual functional checks completed or not completed. Report a blocker honestly instead of presenting setup detection as end-to-end success.
