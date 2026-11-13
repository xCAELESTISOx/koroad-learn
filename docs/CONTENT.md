# Content: where it comes from and how it is checked

**Source**: 도로교통공단 (KoROAD), «[2026년 11월 30일 시행] 1·2종보통, 대형·특수 학과시험 문제은행 (한국어)»,
https://www.safedriving.or.kr/subExamBoard/selectSubExamBoardKorList.do — 382-page PDF, 1136 questions,
kept in `content/source/`. Every question in the app carries its number and page in that PDF.

Switching between Korean and Russian is where language models make mistakes, so each step is either
done by a program or by a separate agent with one job, and every agent's output is checked by another.

| Step | Who | Output |
|---|---|---|
| 1. Korean text, options, answer keys, explanations, side notes | `scripts/extract.py`: a parser over the PDF's text layer; no model. Side notes in the right column are split off by position; a translator caught 10 options whose last line had landed in the notes, fixed in the parser | `work/ko.json` |
| 2. Pictures | `extract.py`: cropped from the rendered page at the PDF's own image positions | `apps/web/public/img/` |
| 3. Line breaks inside words (HWP breaks lines mid-word) | `extract.py`: Kiwi morphological analyzer decides each break | — |
| 4. Check of 1–3 | `scripts/check_ko.py`: a second, independent extractor (pdfplumber) must contain every question and option; keys must be valid; "2가지" ↔ two answers | `work/check_ko.txt` |
| 5. Vocabulary | `scripts/vocab.py`: Kiwi lemmas with their spellings in the bank, by frequency; no model | `work/vocab.candidates.json` |
| 6. Glosses | 2 translator agents, Korean in, Russian out | `work/agents/vocab-out-*.json` |
| 7. Gloss review | 1 separate reviewer agent | `work/agents/vocab-check-out.json` |
| 8. Question translation | 10 translator agents, ~110 questions each, **without answer keys**, with a shared glossary | `work/agents/q-ru-*.json` |
| 9. Translation review | 10 separate reviewer agents: Korean + key + Russian; meaning, numbers, negations, and whether the Russian alone leads to the keyed answer | `work/agents/q-check-*.json` |
| 10. Number review | every field whose digits differ between Korean and Russian (495 of them, mostly 5만 → 50 000) goes to one more reviewer agent, which fixes the real errors | `work/agents/num-check-out.json` |
| 11. Assembly | `scripts/build.py`: applies fixes, structural guards (option counts must match) | `apps/web/src/data/*.json`, `work/report.md` | `apps/web/src/data/*.json`, `work/report.md` |

Video questions (№ 966–1000) are left out: they need the video from the KoROAD site.

To rebuild after a new edition of the bank:
```sh
python3 -I content/scripts/extract.py content/source/<bank>.pdf content/work
python3 -I content/scripts/check_ko.py content/source/<bank>.pdf content/work
python3 -I content/scripts/vocab.py content/work 3
# translate + review with agents (briefs in content/work/agents/*.md), then:
python3 -I content/scripts/build.py content/work
```
Requires `pip install pdfplumber pillow kiwipiepy korean-romanizer` and poppler-utils.
