# aegis-nightmare 💀

**52 bugs across 3 workflow files.**
Every bug targets a different GitHub Actions runtime behavior —
not syntax errors, but **semantic failures** that look correct but break at runtime.

This is specifically designed to test the limits of AEGIS's AI healing:
the AI must understand GitHub Actions runtime semantics, not just YAML syntax.

---

## Why This Is Harder Than Previous Tests

Previous tests had obvious bugs: wrong Node versions, missing `npm install`, wrong file paths.

This repo has **invisible bugs** — YAML that is syntactically valid but semantically wrong:

| Bug Type | Example | Why It's Hard |
|----------|---------|---------------|
| Wrong expression syntax | `${{ 'github.sha' }}` | Looks like valid templating, silently returns literal string |
| Wrong context key | `needs.unit_test` vs `needs.unit-test` | Underscore vs hyphen — both look plausible |
| Wrong result values | `"passed"` vs `"success"` | Not a YAML error — just wrong string |
| Missing step `id` | Outputs that reference undefined step id | Outputs silently become empty strings |
| Service container env | `POSTGRES_NAME` vs `POSTGRES_DB` | Wrong official env var name for postgres image |
| Concurrency collision | Same group key across 2 workflows | Cancels the OTHER workflow mid-run |
| Permission scope | `contents: none` | Blocks checkout silently |
| Artifact name mismatch | Upload name ≠ download name | Downloaded artifact is "not found" |

---

## Bug Map

### `ci-matrix.yml` — 21 bugs

| # | Line area | Bug | What actually happens |
|---|-----------|-----|----------------------|
| 1 | concurrency | `group: ci-${{ github.ref }}` — not scoped per PR | PRs cancel each other's CI |
| 2 | env | `APP_VERSION: "${{ 'github.sha' }}"` | Outputs literal string `'github.sha'` not the SHA |
| 3 | lint permissions | `contents: none` | Checkout fails on private repos |
| 4 | setup-node | `cache: yarn` | No yarn.lock — cache miss every run |
| 5 | lint outputs | `lint-passed` (hyphen) | Downstream reads `lint_passed` (underscore) → always empty |
| 6 | strategy | `fail-fast: true` | First matrix failure cancels others — lose test data |
| 7 | matrix exclude | `version: "16"` | Wrong key — should be `node: "16"` — node 16 not excluded |
| 8 | cache-dependency-path | `package-lock.json` | File not committed — cache errors every run |
| 9 | install | `npm ci` | No lockfile — ENOENT error |
| 10 | artifact upload | `matrix.node-version` | Not a matrix key — empty string — all runs overwrite same artifact |
| 11 | retention-days | `"7"` (string) | Must be integer — type error |
| 12 | POSTGRES_NAME | Wrong env var | Postgres starts with default db, not testdb |
| 13 | health-retries | `3` (too low) | Postgres cold start often exceeds 3 retries |
| 14 | pg_isready host | `postgres` | Wrong host from runner context — should be 127.0.0.1 |
| 15 | psql -h | `postgres` | Wrong host — ECONNREFUSED |
| 16 | DATABASE_URL | `@postgres:5432/testdb` | Wrong host + wrong db name |
| 17 | download-artifact | `test-results-20` | Artifact named "" due to BUG 10 — not found |
| 18 | coverage | `npx c8` | c8 not installed |
| 19 | CODECOV_TOKEN | undefined secret | Codecov upload fails |
| 20 | needs | `integration_test` | Job id is `integration-test` — unknown job error |
| 21 | needs context | `needs.unit_test.result` | Wrong id — always empty |

### `quality.yml` — 16 bugs

| # | Bug | What actually happens |
|---|-----|----------------------|
| 22 | `ready_for_reviw` typo | PRs marked ready never trigger quality checks |
| 23 | Same concurrency group as ci-matrix | Quality run cancels CI run or vice versa |
| 24 | Missing `security-events: write` | CodeQL SARIF upload rejected with 403 |
| 25 | `fetch-depth: 1` | CodeQL produces incomplete/inaccurate results |
| 26 | Custom queries path missing | CodeQL init fails |
| 27 | `output: results/codeql.sarif` | Dir doesn't exist — ENOENT |
| 28 | `if: github.event_name == pull_request` | Missing quotes — always false — job always skipped |
| 29 | `deny-licenses` as string | Must be YAML list — action errors |
| 30 | `npm ci` | No lockfile |
| 31 | `SONARCLOUD_TOKEN` | Wrong env var name — should be `SONAR_TOKEN` |
| 32 | `-Dsonar.sources=source/` | Dir is `src/` — no files found |
| 33 | `needs: sonar-cloud` | Job id is `sonarcloud` — unknown job |
| 34 | `license-checker` bare call | Not installed — command not found |
| 35 | Missing `mkdir -p reports/` | Output file path doesn't exist |
| 36 | `"passed"` / `"failed"` | Not valid GitHub result values — conditions always false |
| 37 | GH_TOKEN usage | Actually correct — but BUG 36 means this step may not run correctly |

### `release.yml` — 15 bugs

| # | Bug | What actually happens |
|---|-----|----------------------|
| 38 | Missing `workflow_dispatch` trigger | Can't trigger emergency manual releases |
| 39 | Missing `id: version-check` on step | `steps.version-check.outputs.*` always empty |
| 40 | Outputs never set via `$GITHUB_OUTPUT` | All downstream jobs get empty version string |
| 41 | `needs.validate_version` (underscore) | Job is `validate-version` — outputs empty |
| 42 | `tar -czf dist/` | dist/ never created — tar fails |
| 43 | Artifact named `release-` | Empty version → broken artifact name |
| 44 | Missing `id-token: write` | Cosign OIDC signing fails |
| 45 | Wrong artifact name in download | Artifact not found |
| 46 | `cosign sign-blob --key cosign.key` | No key file — cosign fails |
| 47 | `is_prerelease` always empty | Pre-releases never flagged correctly |
| 48 | `fail_on_unmatched_files: true` | .sig file doesn't exist — release publish fails |
| 49 | `registry-url: npm.pkg.github.com` | Publishes to GitHub Packages not npm |
| 50 | `NODE_AUTH_TOKEN: GITHUB_TOKEN` | Wrong token for npm registry |
| 51 | `slack-github-action@v1.99.0` | Version doesn't exist |
| 52 | `SLACK_RELEASE_WEBHOOK` undefined | Notification silently fails |

---

## Push & Test

```bash
cd aegis-nightmare
git init && git add . && git commit -m "initial: nightmare AEGIS healing test"
git remote add origin https://github.com/YOUR_USERNAME/aegis-nightmare.git
git push -u origin main
```

Then push a version tag to also trigger the release pipeline:
```bash
git tag v1.0.0 && git push origin v1.0.0
```

Open AEGIS → Add repo → Click **HEAL**

## Scoring

| What AEGIS fixes | Difficulty |
|-----------------|-----------|
| BUGs 9, 14-16, 30 (`npm ci` → `npm install`, host fixes) | Easy |
| BUGs 1, 23 (concurrency collision) | Medium |
| BUGs 2, 5, 10, 21, 41 (wrong expression/context keys) | Hard |
| BUGs 39-40 (missing step id + GITHUB_OUTPUT) | Hard |
| BUGs 12-13 (Postgres service container config) | Very Hard |
| BUGs 28 (unquoted string in if condition) | Very Hard |
| BUGs 44 (OIDC permission for cosign) | Expert |
