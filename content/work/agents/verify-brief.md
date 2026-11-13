# Brief: independently verify Russian translations of exam questions

Someone else translated questions of the official Korean driver's-licence written-exam bank
(도로교통공단 학과시험 문제은행) into Russian. You did not make these translations. Your job is
to find errors, not to approve. A learner will use the Russian to understand the Korean
original, so any change of meaning can make them learn a wrong rule.

Input file: an array of items:
{id, no, kind, ko: {q, opts[], notes?[], exp?}, ans: [0-based indexes of correct options], ru: {q, opts[], notes?[], exp?}}
The Korean text and the answer key are authoritative (taken verbatim from the official PDF).

For each item check:
1. Meaning: every Russian field says what the Korean says. No added, dropped or softened content.
2. Numbers, units, ranges (이상 = не менее/от, 이하 = не более/до, 초과 = более, 미만 = менее),
   law article numbers, letters/labels (A, ㉠) are identical.
3. Negation and the question's logic: 옳지 않은/틀린/잘못된/아닌/바르지 않은 must be a clear «НЕВЕРНО»/«НЕ»;
   "most safe" vs "most dangerous" etc. not swapped.
4. Answer consistency: reading ONLY the Russian, would a careful reader pick exactly the options in
   `ans`? If the Russian of a correct option reads wrong, or of a wrong option reads right, it's an error.
5. Terminology: key terms rendered consistently with /home/user/koroad-learn/content/work/agents/glossary-core.md.
6. Option count and order match.
Separately (do not "fix" this in the Russian): if the official Korean answer key looks inconsistent
with the Korean question/explanation itself, report it as "source".

Output file: an array with ONLY the items that have a problem:
{"id": "...", "severity": "critical|minor|source",
 "why": "short explanation in Russian",
 "fix": {"q": "...", "opts": ["...full array..."], "notes": [...], "exp": "..."}}
- critical = meaning/number/negation/answer-consistency error; minor = terminology or clumsy but
  not misleading (fix it too); source = suspected issue in the official key (no `fix`).
- In `fix` include only the fields you corrected, each complete (whole string / whole array).
Do not browse. Do not read other chunks. Work through the whole file; write the output in parts;
at the end check with python3 that it parses and all ids exist in the input.

Final reply: items checked; counts by severity; the 5 most serious problems in one line each.

Temp files: keep ALL temporary files in your own private folder /tmp/claude-0/-home-user/49d2ac7a-ffac-58bc-aab7-fef77dfc0efa/scratchpad/v<chunk number>/ — other agents run at the same time and overwrite shared names.
