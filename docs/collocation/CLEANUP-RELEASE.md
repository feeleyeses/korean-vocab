# Deterministic collocation cleanup 122

This release removes only 122 literal headword duplicates from collocations.
The frozen cleanup-release-manifest.json retains every removed object, original
entry/sense/collocation identity and index. It also retains the exact 113 added
and 9 removed warning records, not merely a net warning count.

Only this allowlisted delta is accepted. Existing quality audit source and all
example-release rules, manifests and provenance remain unchanged. No source
enrichment or other production data changes are part of this release.

Commands:

```
node docs/collocation/cleanup-production.mjs verify --phase post_publish
node docs/collocation/cleanup-production.mjs verify --phase pre_publish
node docs/collocation/cleanup-ci.mjs
```

After publication, pre_publish returns already_published. Writer defaults to
disabled; the only authorized one-shot command was:

```
node docs/collocation/cleanup-production.mjs publish --enabled --release collocation-cleanup-122-v1
```

No automatic retry or next batch exists. Runtime backups are retained under
`.git/collocation-backups/<backupId>/`, including the full original vocabulary,
manifest and transaction log. These private backups are not deployed. On any
transaction/post-audit failure the original bytes are restored atomically.

## CI historical fixture boundary

The previous CI assumed production must retain the complete Release B hash.
Cleanup changes that hash without changing examples. cleanup-ci.mjs therefore:

1. Verifies actual production against this cleanup manifest and full warning delta.
2. Reconstructs the exact previous B snapshot in an isolated temporary checkout,
   restores only the 122 archived collocations and checks the complete old hash.
3. Runs the unchanged A/B verification, automation, rollback and ingest tests there.
4. Runs cleanup transaction/rollback tests against the actual current checkout.

No hash protection is relaxed. CI does not run the old B verifier on the new
cleanup state or fake a release phase. The cleanup record explicitly declares
post_publish. The temporary historical fixture is never copied to production.

Production count: 4020 entries / 4059 senses / 4459 examples / 484 collocations.
Warnings: 7039 to 7143 (+113 missing verified pair, -9 missing Chinese); blocking=0.
