# Vocabulary Model

Sprint 2 keeps the visible UI unchanged while moving the production word bank to `data/vocabulary.json`. The JavaScript page module loads this JSON and maps it into the existing UI contract at runtime.

## LexicalEntry

- `lexicalEntryId`: stable unique ID; this is the merge key, never `headword`.
- `headword`: Korean spelling shown to learners.
- `homographNo`: optional number for same-spelling, different-word entries.
- `partOfSpeech`: normalized Korean/Chinese grammar label.
- `levels`: TOPIK levels or custom track levels.
- `tracks`: source route such as `topik`, `daily`, `internet`, or `exam-rescue`.
- `register`: optional usage layer such as spoken, written, formal, slang.
- `pronunciation`: one Pronunciation object.
- `senses`: one or more Sense objects.
- `qualityScore`: one Quality Score object.
- `source`: source notes or citations for human review.
- `verifiedAt`: ISO date or null.
- `verificationStatus`: `draft`, `reviewed`, or `approved`.

## Sense

- `senseId`: stable unique ID under the lexical entry.
- `glossZh`: concise Chinese meaning for the learning card.
- `definitionZh`: optional fuller explanation.
- `usageNote`: optional nuance, register, or confusion note.
- `examples`: Example objects tied to this sense.
- `collocations`: Collocation objects tied to this sense.
- `relations`: optional synonym, antonym, and confused-with links.

## Example

- `exampleId`: stable unique ID.
- `ko`: Korean sentence.
- `zh`: Chinese translation.
- `source`: source or reviewer note.
- `verified`: boolean.

## Collocation

- `collocationId`: stable unique ID.
- `ko`: Korean phrase.
- `zh`: Chinese meaning.
- `note`: optional usage note.

## Pronunciation

- `hangul`: actual pronunciation.
- `romanization`: learner-facing romanization.
- `soundRules`: optional sound-change labels.
- `audio`: optional audio URL or asset path.

## Quality Score

- `completeness`: 0-100 field coverage.
- `accuracy`: 0-100 linguistic confidence.
- `sourceReliability`: 0-100 source quality.
- `humanReviewed`: boolean.
- `issues`: known issues that block approval.
- `score`: final 0-100 score.
