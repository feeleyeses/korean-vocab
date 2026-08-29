# V2 Card Spec

Sprint 4 defines a unified card contract for learning and review cards. It is an implementation-ready specification, not a new feature surface.

## Spec Diagrams

- [学习卡片（初始）](card-spec-v2/learning-initial.svg)
- [学习卡片（揭晓）](card-spec-v2/learning-revealed.svg)
- [复习卡片（初始）](card-spec-v2/review-initial.svg)
- [复习卡片（揭晓）](card-spec-v2/review-revealed.svg)

## Shared Contract

- Card shell, grid, radius, shadow, and bottom action rail use the existing Layout System tokens.
- The card has one stable bottom action rail. State changes may change content, but may not move the rail vertically.
- Optional learning content is rendered only when present. Missing collocation or sound-rule content collapses without reserving empty rows.
- The revealed reading order is fixed: definition, example, collocation, sound rule, optional review answer map, action rail.

## Learning Card

- Initial state shows Korean, actual pronunciation, romanization, favorite, and audio only.
- Initial state hides Chinese meaning, examples, collocations, and sound rules.
- Bottom actions are `认识`, `模糊`, and `不认识`.
- Revealed state shows Chinese meaning, Korean example, Chinese example, collocation when present, and sound rule when present.
- The `继续` button width equals the full three-button group width, including gaps.

## Review Card

- Initial state keeps the current four-choice mode.
- Initial state shows Korean, actual pronunciation, romanization, and four Chinese options.
- Initial state does not show `认识`, `模糊`, or `不认识`.
- Revealed state shows the correct meaning, example, collocation when present, sound rule when present, and the existing option-to-Korean map.
- Revealed state uses the same `继续` action rail geometry as the learning card.
