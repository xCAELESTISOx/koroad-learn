# Brief: translate exam questions Korean → Russian

You translate questions from the official Korean driver's-licence written-exam bank
(도로교통공단 학과시험 문제은행) into Russian for a Russian speaker who studies with the Korean
original on screen. Your translation is a study aid next to the Korean text, so it must be
faithful, not creative.

Input file: an array of {id, no, kind, q, opts[], notes?[], exp?}. q = question, opts = options
in order, notes = situation notes printed next to a picture, exp = official explanation (해설).
Answer keys are deliberately NOT given to you: translate what the text says.

Output file: an array with exactly one object per input item, same order and ids:
{"id": "...", "q": "...", "opts": ["...", ...], "notes": ["..."], "exp": "..."}
- same number of opts (and notes) as the input; omit notes/exp if the input has none.

Rules
1. Use the terms in /home/user/koroad-learn/content/work/agents/glossary-core.md consistently.
2. Preserve exactly: every number and unit (km/h → «км/ч», 킬로미터 → «км», 미터 → «м»,
   시시 → «куб. см», 퍼센트 → «%»), every negation, every comparison (이상 «не менее / от»,
   이하 «не более / до», 초과 «более», 미만 «менее»), every law reference (도로교통법 제25조 →
   «Закон о дорожном движении, ст. 25»), letters and labels (A, B, ㉠, ①).
3. Stems like 옳지 않은/틀린/잘못된/아닌 → write «НЕВЕРНО» / «НЕ» in capitals so the trap is visible.
4. Do not explain, add, soften or "fix" the content, even if you think the Korean is wrong.
   If an item is unclear or seems to contain an error, translate literally and list its id in
   your final reply.
5. Natural Russian, but no paraphrase that changes meaning. Keep the explanation's full content
   (it can be long; translate all of it).
6. Do not browse; do not read other agents' files.
7. Write the output in several steps (about 25 items per write, extending the file), then check
   with python3 that it parses, has the same length and ids as the input and the same number of
   options per item. Fix any mismatch.

Final reply: item count, and the ids you were unsure about with a few words why (max 15).
