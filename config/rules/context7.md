# Current documentation policy

This standing user-level rule requires current documentation independently of project scope. Delegate research to the `librarian` subagent; do not fetch documentation in the main conversation or answer from remembered APIs.

Always spawn `librarian` when an answer or implementation depends on a specific technology, library, framework, SDK, API, CLI tool, or cloud service, including popular and familiar ones. Triggers include API syntax and behavior, configuration, setup, CLI commands, version migration, integrations, and technology-specific debugging. A name mentioned incidentally without a documentation need does not trigger research. General programming concepts, business logic, and purely structural refactoring or code review do not require research unless they depend on technology-specific behavior.

Give the librarian a self-contained brief: exact documentation questions, official technology names, known versions (or explicitly unknown), relevant environment and constraints, and requested findings/examples. Pass only necessary context, never secrets; it does not inherit conversation history or CLAUDE.md instructions. Preserve its configured Haiku model and low effort.

Spawn independent documentation questions in parallel and continue unrelated work while they run. Wait for the relevant findings before making documentation-dependent claims or changes. Do not duplicate the librarian's research in the main conversation. If the agent or its `find-docs` skill is unavailable, report the missing prerequisite rather than silently bypassing delegation.

The librarian uses only the Context7 CLI through Bash, with Read for explicitly supplied local context. Its preloaded external `find-docs` skill provides the CLI procedure; this repository does not copy or install shared skills. The following policy must remain consistent with the librarian's system prompt because it starts with `omitClaudeMd: true`.

## Steps

1. Resolve library: `npx ctx7@latest library <name> "<what to look up>"` — use the official library name with proper punctuation (e.g., "Next.js" not "nextjs", "Customer.io" not "customerio", "Three.js" not "threejs")
2. Pick the best match (ID format: `/org/project`) by: exact name match, description relevance, code snippet count, source reputation (High/Medium preferred), and benchmark score (higher is better). If results don't look right, try alternate names or queries (e.g., "next.js" not "nextjs", or rephrase the question)
3. Fetch docs: `npx ctx7@latest docs <libraryId> "<what to look up>"` — run a separate `docs` command per distinct concept if the question spans multiple topics, unless it's about how they interact
4. Answer using the fetched documentation

You MUST call `library` first to get a valid ID unless the user provides one directly in `/org/project` format. Be specific about what to look up in the library's documentation — specific and detailed queries return better results than vague single words, but keep each query to a single concept unless the question is about how they interact; combined multi-topic queries dilute ranking and return shallow results for each topic. Do not run more than 3 commands per question. Do not include sensitive information (API keys, passwords, credentials) in queries.

For version-specific docs, use `/org/project/version` from the `library` output (e.g., `/vercel/next.js/v14.3.0`).

If a command fails with a quota error, inform the user and suggest `npx ctx7@latest login` or setting `CONTEXT7_API_KEY` env var for higher limits. Do not silently fall back to training data.
