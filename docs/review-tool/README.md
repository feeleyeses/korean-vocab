# Example release tooling / Data Inspector

Release A is frozen at `examples-7d882c8df890c5ba0278`. Preparation never publishes production data.

## Clean-checkout verification

From the repository root, Node.js 22+; no network, private cache, Python runtime or model is required:

```sh
node docs/review-tool/verify-release-a.mjs --phase=pre_publish
node --test docs/review-tool/automation.test.mjs docs/review-tool/sense-alignment.test.mjs docs/review-tool/example-lanes.test.mjs docs/review-tool/publication.test.mjs docs/review-tool/readiness.test.mjs docs/review-tool/expanded.test.mjs docs/review-tool/preparation.test.mjs
node docs/review-tool/ingest-test.mjs
```

Historical full-corpus/WSD tests skip explicitly when ignored research data is absent. The 150-candidate release gate and writer transaction/rollback tests remain mandatory.

## Frozen release inputs

- release-a-manifest.json: unchanged original manifest.
- RELEASE-A-ATTRIBUTION.md: unchanged original contributor/ID/version credits.
- release-a-input.json: exact original 150 candidate inputs and policy, checked against manifest.sourceDatasetHash; only needed source nodes, not the full export.
- release-a-record.json: prepared-not-published record with original manifest/attribution byte hashes and canonical capsule hash.
- candidate.schema.json / provenance.schema.json: candidate/provenance contracts.

Git -text attributes preserve frozen manifest and attribution bytes across platforms. Vocabulary hashes use automation.mjs canonical JSON, distinct from file-byte SHA256. Stop on any drift; never regenerate an existing manifest to repair validation.

## Safety

## Explicit release phases

The verifier requires `phase: 'pre_publish'` or `phase: 'post_publish'`; omission is an error. Pre-publish requires the previous hash. An already-new hash returns `already_published` with `writerAllowed: false` (CLI exit 2), never another write. Other hashes fail with `Production drift`.

Post-publish requires the new hash and distinct previous/new hashes. It checks all 150 example IDs and their sense associations, removes only these additions in memory to reconstruct the exact previous hash, reruns the unchanged complete publication gate and quality audit, and compares the full expected projection including provenance. Unexpected hashes fail with `Post-release drift`.

`releaseATransaction` is the explicit orchestration API: disabled by default, exact Release A ID only, pre verification -> existing backup/atomic writer -> post verification inside the rollback boundary. It never changes a manifest. Enabled calls in tests target temporary copies only.

CI selects a declared phase from `release-a-record.json.kind`, not from the vocabulary hash: `prepared-not-published` means `pre_publish`; `published` means `post_publish`; unknown states fail. A future authorized production release must update that release record to `published` in the same commit as the vocabulary. For local post-release verification run `node docs/review-tool/verify-release-a.mjs --phase=post_publish`; run tests with `RELEASE_PHASE=post_publish` in that phase. The frozen manifest, candidate input and attribution remain unchanged in both phases.

publication.mjs checks registry, source nodes and KO/ZH links, credit, IDs, entry/dataset hashes, duplicate data, capacity, realExamples, and complete vocabulary quality audit. Only additions may be projected; all originals must remain unchanged. Writer defaults disabled; automated tests enable it only on temporary fixtures. verify-release-a.mjs never invokes writer.

A future authorized release must independently back up data and ship example provenance and the attribution file. Current Pages excludes docs, so preparation does not yet deploy these credits. No production release occurred.

## Optional research dependencies

Create and activate a Python environment, then:

```sh
python -m venv docs/review-tool/.venv
python -m pip install -r docs/review-tool/requirements.txt
python -m unittest discover -s docs/review-tool -p unblock_tests.py
```

Activate the venv before pip/Python commands. Set PIPELINE_PYTHON if needed; default interpreters are docs/review-tool/.venv/Scripts/python.exe on Windows and docs/review-tool/.venv/bin/python on POSIX. BGE has a separate pinned wsd-requirements.txt environment; model weights remain local. Release A verification needs neither.

KRDict accepts local JSON/XML caches or KRDICT_API_KEY supplied through the environment; never place a key in files, logs or Git. Tatoeba accepts official detailed sentence exports and direct links. unavailable is not zero coverage. Research generators require their ignored input datasets and are not release-verification commands.

Full exports, raw corpora, models, virtualenvs, large historical benchmark outputs, isolated writer copies and backups stay local. RELEASE-PREPARATION-AUDIT.md enumerates the initial 330 dirty paths. run-readiness.mjs and prepare-expanded.mjs are historical generation commands: do not use them to regenerate frozen Release A.

## Inspector

Optional read-only debugging: node docs/review-tool/serve.mjs. It binds loopback only; REVIEW_PORT selects the port, REVIEW_URL configures UI tests. Loopback defaults are development endpoints, not production endpoints or credentials. Import release-a-input.json to inspect source evidence; no human approval participates in publishing.

## Scope

D2, schedule, groupSenses, production vocabulary and learning flows are unchanged. The old asset's formatting-only diff was restored after normalized-code comparison. No caches, historical outputs or unrelated files were deleted.
