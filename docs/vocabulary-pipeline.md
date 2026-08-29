# Vocabulary Entry Pipeline

New entries must pass this path before they enter the production vocabulary.

1. Intake as draft with `headword`, source, candidate meanings, and track.
2. Normalize spelling, part of speech, levels, register, and source metadata.
3. Split meanings into Sense records; never merge only because `headword` matches.
4. Add pronunciation, romanization, and sound-change labels when applicable.
5. Add examples and collocations only when sourced or human verified.
6. Calculate Quality Score and record blocking issues.
7. Human reviewer marks `verificationStatus` as `approved`.
8. Run `scripts/vocab-quality-audit.mjs`; only approved, valid entries can move into the formal word bank.
