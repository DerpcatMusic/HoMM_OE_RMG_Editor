# CI

The `Verify editor` PR check installs the Bun lockfile once, runs TypeScript checking (`bun run check`), the four existing invariant suites (`bun run test`), and one browser build (`bun run ui:build`). Invariants protect mutations, editor schema/actions and UI session behavior. A build proves bundling succeeds; it is not a browser interaction test.

Locally use Bun 1.4.0 and Node 24, then the same commands after `bun install --frozen-lockfile`. Game-data refresh and asset extraction require external game inputs and are not part of CI. Existing tracked game-data assets are used by the normal build.

The existing Pages deployment workflow is unchanged and does not run on pull requests. No branch protection, publishing, or release settings are changed.

## Why this shape

GitHub recommends [minimum token permissions](https://docs.github.com/en/actions/tutorials/authenticate-with-github_token), [scoped concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency), and [full action commit pins](https://docs.github.com/en/actions/reference/security/secure-use). Validation cancels obsolete runs without changing deployment queues. Ubuntu 24.04 is explicit so the upcoming ubuntu-latest image migration does not silently change this lane. Required jobs have no workflow-level path exclusions, which can otherwise leave a required result pending.
