# Commit

A Claude Code mod that opens a three-choice picker for `/commit`, then delegates the complete Git workflow to one bundled `commit:committer` agent. Independent of the personal setup, librarian, Ponytail, and external skills.

## Workflows

| Choice | Behavior |
| --- | --- |
| **Commit and push on a new branch** (default) | Create a fresh descriptive branch from the current HEAD, make atomic commits, push that branch, and set its upstream. Leave the new branch checked out. |
| **Commit and push** | Commit on the current branch, then push to its resolved upstream. With no upstream, use the sole remote and current branch name; ask when ambiguous. |
| **Commit only** | Commit on the current branch without contacting remotes, switching branches, or changing its upstream. |

Use arrows to choose, Enter to confirm, or Esc to close without starting a workflow. Each opening starts on the first choice; the plugin does not persist the previous selection. Opening the picker does not run Git. Non-interactive `/commit` refuses rather than silently selecting the default push option.

Optional arguments carry file/glob restrictions and commit guidance:

```text
/commit
/commit src/api tests/api — keep unrelated frontend changes uncommitted
```

The picker offers exactly the three workflows, not a free-text fourth choice. A valid selection directly spawns the bundled committer with the exact mode and original user guidance; the parent model does not rewrite that brief. The plugin refuses another invocation while its owner is active. When the owner finishes, its report is submitted to the main conversation for presentation or clarification, not further Git work. Normal Claude permissions still apply; the plugin does not approve tools or bypass hooks. Do not reload the plugin during an active workflow; session-local owner tracking is not a cross-process Git lock.

## Commit policy

The bundled [committer prompt](agents/committer.md) adapts the user's supplied commit skill into a standalone plugin policy, not a dependency on a globally installed skill. It preserves:

- One owner in the same working tree for inspection, grouping, staging, checks, and commits.
- Full tracked/staged/untracked inspection and a grouping plan before mutation.
- Small independently coherent outcomes, biased toward splitting unrelated work.
- Conventional Commit messages with imperative summaries of at most 72 characters, no trailing period, and no unsolicited attribution or footers.
- Preservation of intentional staged changes; no automatic unstaging or mixing unrelated hunks into a staged group.
- Explicit file staging, staged-diff review, cheap relevant existing checks, and an index check between groups.
- No secrets, private configuration, unrelated changes, history rewrites, hook bypasses, force pushes, or remote modification.
- A final report with the plan, hashes/subjects, grouping rationale, branch, push result, and remaining changes.

While the plugin is loaded, its documented `attribution.text` hook returns an empty default commit trailer. This applies to commit-attribution instructions throughout that session, not only to one subagent, and does not change saved settings or Git configuration. Explicit user-requested attribution is still allowed. This avoids the engine's default co-author instruction contradicting the supplied commit policy.

The original skill permits commits only. This plugin expands that permission **only** when a push workflow is explicitly selected. A selection is not authorization to publish genuinely unpublished older commits outside the invocation; the agent must ask before mutation if those exist. Ancestors already published on another advertised branch of the same remote are not newly published work; a new branch must not be compared blindly to the remote default branch. Multiple plausible remotes, unclear grouping, conflicts, detached/unborn HEAD, or in-progress Git operations stop the workflow before mutation. With no eligible changes, it does not create a branch or push old commits. A rejected push leaves local commits intact and is reported, never force-retried or rolled back.

The new branch is based on **current HEAD**, not automatically the remote default branch. A new branch name is validated and checked for collisions. Remote policy or protected-branch rejection is a reported failure, not permission to change remotes or history.

The committer runs on Haiku and receives the selected mode and user guidance. It is an LLM following a policy, **not a sandboxed or deterministic Git executor**: Read/Bash access and the user's existing hooks/permissions govern actual execution. Review its plan and results, especially before publication. It never needs a GitHub token or `gh`; ordinary Git authentication handles network pushes.

## Install

Requires Git and Claude Code with mods and the native Select element. Develop and verify against the installed Claude Code build; older clients may not support these APIs.

```bash
claude plugin marketplace add santychuy/claude-setup
claude plugin install commit@claude-setup --scope user
```

For local development without changing installed plugins:

```bash
claude --plugin-dir /path/to/claude-setup/plugins/commit
```

This mod owns `/commit` while loaded. Do not load multiple mods/skills that compete for that name. A build with a reserved built-in command may refuse registration; inspect startup errors rather than assuming the plugin loaded. Reload plugins or start a fresh session after installation. The standalone agent is invoked by the command, not proactively.

## Develop and verify

```bash
claude plugin validate plugins/commit
claude plugin test plugins/commit
npx --yes --package typescript tsc --project plugins/commit/tsconfig.json --noEmit
```

An interactive `--plugin-dir` session generates ignored `.claude-plugin/types/` declarations for the installed build. There is no bundling or runtime package-install step. Tests protect repeated-selection, non-interactive refusal, and fail-closed picker errors, not LLM adherence to the commit policy. The failure-path regression demonstrates that a failed picker must not fall through to another `/commit` implementation.

Use a disposable configuration directory and Git repository with an initial commit and a **local bare remote**, never the user's real workspace history, for live verification:

1. Open `/commit`; inspect all three choices and the first-choice default. Cancel and confirm no Git state changed.
2. Select **Commit only**; confirm the branch stays put, the intended commits exist locally, and the remote ref is unchanged.
3. Add another scoped change, select **Commit and push**, and confirm the selected branch's remote ref matches local HEAD. Explicitly authorize any earlier unpublished fixture commits if needed.
4. Add a further change, select the default new-branch workflow, and confirm a new branch/upstream exists, the new remote ref matches HEAD, and the original branch is unchanged.
5. Exercise independent changes, restricted paths, intentional staged changes, and blockers before using the workflow on valuable work. A model request or permission failure is not a successful Git workflow.

### Observed verification

Verified in the Claude Code **2.1.309 terminal**, with a disposable profile, temporary repository, and local bare remote: the three-choice/default picker, cancellation, all three workflows, independent atomic groups, path exclusions, staged-only commit preservation, ordinary push rejection with local commits retained, concurrent-invocation refusal, and no eligible changes producing no Git mutation. Direct dispatch preserved the mode and guidance; successful final runs omitted unsolicited attribution. No public/network remote was used. This is smoke evidence for those scenarios, not a guarantee of every future model decision.

The native suite passed three tests; TypeScript, agent validation, and marketplace validation passed. The plugin validator on that build reports `/commit` as reserved even though actual command registration and live execution work; this discrepancy was reported. It also emits an optional catalog-icon warning. Desktop, VS Code, network authentication, and other Claude Code builds were not exercised.

## Disable or remove

```bash
claude plugin disable commit@claude-setup
claude plugin uninstall commit@claude-setup --scope user
```

Choose disable or uninstall, then reload or restart. The plugin stores no Git configuration, credentials, or persistent picker preference. Commits and branches it created are ordinary repository history and are not removed on uninstall.

## References

- [Mod commands and prompt submission](https://code.claude.com/docs/en/plugins/mods/api)
- [Native panes and controls](https://code.claude.com/docs/en/plugins/mods/interface)
- [Subagent definitions](https://code.claude.com/docs/en/sub-agents)
- [Native mod testing](https://code.claude.com/docs/en/plugins/mods/test)

MIT; see the repository's [LICENSE](../../LICENSE).
