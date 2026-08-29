# KRDict Collocation Coverage

Generated from `scripts/krdict-collocation-coverage.mjs` on 2026-08-29.

The coverage check is read-only. It queries the Korean Basic Dictionary Open API
for each published collocation and classifies it into one of three completion
paths:

- `auto`: exactly one KRDict entry matches the full collocation text and includes
  a Chinese translation.
- `unavailable`: KRDict returns no entry for the full collocation text.
- `manual`: KRDict returns a non-exact match, ambiguous exact matches, an API
  error, or an exact match without a Chinese translation.

## Full Run Summary

Source: `data/vocabulary.json`

| Category | Count | Coverage |
|---|---:|---:|
| Total checked | 650 | 100.0% |
| Auto-completable | 159 | 24.5% |
| Not found / unavailable | 478 | 73.5% |
| Needs manual completion | 13 | 2.0% |

## By TOPIK Level

| TOPIK | Total | Auto | Unavailable | Manual |
|---|---:|---:|---:|---:|
| TOPIK-1 | 203 | 26 | 173 | 4 |
| TOPIK-2 | 119 | 3 | 116 | 0 |
| TOPIK-3 | 144 | 90 | 50 | 4 |
| TOPIK-4 | 24 | 1 | 22 | 1 |
| TOPIK-5 | 131 | 38 | 89 | 4 |
| TOPIK-6 | 29 | 1 | 28 | 0 |

## Strategy Notes

- KRDict can directly repair a limited but valuable subset of complete lexicalized
  collocations, for example `겨울 방학 -> 寒假`, `공항버스 -> 机场大巴`, and
  `남자 친구 -> 男朋友`.
- Verb phrase collocations such as `가게에 가다`, `가격이 비싸다`, and
  `학생을 가르치다` are usually not standalone KRDict entries. They should not be
  auto-filled from the headword gloss.
- The next collocationZh cleanup should first apply the `auto` class, then route
  `manual` and `unavailable` rows into human review or a separate corpus-backed
  phrase translation process.
- The raw full-run JSON remains in `artifacts/krdict-collocation-coverage-2026-08-29T21-26-08-061Z.json`.
