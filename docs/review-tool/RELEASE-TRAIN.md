# Example Release Train v1

Release A remains immutable. B is prepared only; no production write is authorized by preparation. All paths below are relative to the repository root. Node 22+, the existing pinned Kiwi Python environment, local Tatoeba index and homograph-disambiguation cache are required for preparation. No API or new source discovery is involved.

## Commands

```sh
node docs/review-tool/prepare-next-release.mjs --size 250 --name B
node docs/review-tool/verify-release.mjs --release B --phase pre_publish
node docs/review-tool/train-ci.mjs
node --test docs/review-tool/*.test.mjs
```

Preparation refuses existing output files rather than overwriting a frozen manifest. Repeating verification is safe. Release B already exists: do not run preparation again to repair errors. A failed dry-run remains non-publishable. Future C preparation requires a published B record with successful CI, Pages, online smoke and current production hash. Only one next manifest is prepared at a time. B and C are capped at 250; larger batches up to 400 require two successful train batches. The source export version and all frozen rule files are locked. Any change requires stopping this train and explicitly versioning/revalidating the policy; editing the lock is not an automatic repair.

## Future explicitly authorized publication (NOT executed for B)

```sh
node docs/review-tool/publish-release.mjs --release B --enabled
node docs/review-tool/verify-release.mjs --release B --phase post_publish
```

Without `--enabled`, the command exits disabled before accessing production. With authorization it requires clean Git status, a passing frozen dry-run and explicit B manifest, backs up vocabulary and release inputs under the Git directory, then invokes the existing atomic writer with post verification inside rollback. Production changes, the published record and deployed attribution must then be committed and pushed. `GIT_BINARY` can name the Git executable when it is not on PATH. `PIPELINE_PYTHON` can name the pinned Python interpreter. No machine-specific paths or credentials belong in records.

The CI dispatcher takes the latest explicit release record, mapping prepared to pre_publish and published to post_publish. It never guesses the phase from the vocabulary hash. Historical A/B tests reconstruct their frozen fixtures in temporary files, not production. No source/scoring/gate implementation was changed.

## After CI and Pages finish

```sh
node docs/review-tool/record-online-smoke.mjs --release B --ci-run RUN_ID --pages-run RUN_ID --url https://feeleyeses.github.io/korean-vocab/
```

This command checks both run identities, success and exact commit via GitHub API (optional `GITHUB_TOKEN` environment variable only), exact deployed vocabulary hash, all manifest example IDs/KO/ZH, then runs the existing full Pages smoke and release-specific samples. It samples every available TOPIK level, noun/verb/adjective, shortest/longest, plus five release-seeded random candidates at 1440 and 390. Each sample uses an isolated browser context with the exact fetched entry as a deterministic UI fixture; remote production and user learning data are not modified. Reveal text, knowledge scrolling, footer geometry, overflow and page errors are checked. The record distinguishes a verified live dataset from the isolated UI fixture.

Only success is recorded as online.passed; failures exit and leave the next-batch guard blocked. Missing GitHub access is unavailable, not success. Commit the resulting smoke record before C preparation. An already-new hash returns already_published and writerAllowed=false, never another insertion. No command automatically pushes Git or schedules further batches.

## Current B baseline

5986 Tatoeba matches replayed with Kiwi: zero mismatches. Eligible entries 3826; structural pass 4274; post-candidate-cap auto_verified 1763; final gate releaseReady 1030. Publication capacity selection excludes 733. Duplicate checks reject 593 rows (150 more than before A); candidate-stage per_sense_cap is 2511 (96 fewer), final publication example_cap is 733 (96 more). These are stage counts, not disjoint quality-failure totals; A releases free preliminary selection slots while consuming actual production capacity. No historical releaseReady list was used to select B.

B: 250 distinct senses, T1 51 / T2 79 / T3 49 / T4 24 / T5 21 / T6 26. Ranking and strict A batch selection predicates are unchanged. No replacement or deletion. New warnings zero; total warnings reduce by 249, because one selected sense already had a real example. Production remains at A's hash until a separate publication authorization.
