"""Turns work/ko.json into work/questions.ko.json (kinds, answer indexes) and checks it.

Checks, none of which use a language model:
  1. A second, independent extractor (pdfplumber's own text layer, not pdftotext) must contain
     every question and option text of the page, ignoring spaces and line breaks.
  2. Answer keys parse to valid option numbers, and "2가지" questions have exactly two answers.
  3. Every picture question has a picture, every option is non-empty.
Problems go to work/check_ko.txt; the build stops on any.

Usage: python3 -I content/scripts/check_ko.py content/source/bank-2026-11-30.pdf content/work
"""

import json
import re
import sys
from pathlib import Path

import pdfplumber

PDF, WORK = Path(sys.argv[1]), Path(sys.argv[2])
raw = json.loads((WORK / "ko.json").read_text())


def kind(q):
    n = q["no"]
    # Sections of the 2026-11-30 bank, from its layout: pictures by size (photos ~775px wide,
    # illustrations ~597px), signs are 4-option picture questions, video questions say 홈페이지 참조.
    if 681 <= n <= 780:
        return "photo"
    if 781 <= n <= 865:
        return "illust"
    if 866 <= n <= 965:
        return "sign"
    if 966 <= n <= 1000:
        return "video"
    return "text"


squash = lambda s: re.sub(r"[\s⏎]+", "", s).replace("ⓛ", "①")
def interleaved(needle, hay, notes):
    """The picture questions' side notes are interleaved into option lines in pdfplumber's text.
    Accept the option if it appears in order there with only side-note characters in between."""
    start = hay.find(needle[:8])
    while start != -1:
        i, j, ok = 0, start, True
        while i < len(needle) and j < len(hay):
            if hay[j] == needle[i]:
                i += 1
            elif hay[j] not in notes + "■":
                ok = False
                break
            j += 1
        if ok and i == len(needle):
            return True
        start = hay.find(needle[:8], start + 1)
    return False


problems = []
pages = {}
with pdfplumber.open(PDF) as pdf:
    for q in raw:
        for p in (q["page"], q["page"] + 1):
            if p <= len(pdf.pages) and p not in pages:
                pages[p] = squash(pdf.pages[p - 1].extract_text() or "")

out = []
for q in raw:
    k = kind(q)
    text = pages[q["page"]] + pages.get(q["page"] + 1, "")
    for label, s in [("question", q["q"])] + [(f"option {i + 1}", o) for i, o in enumerate(q["opts"])]:
        if squash(s) not in text and not interleaved(squash(s), text, squash(" ".join(q["bullets"]))):
            problems.append(f"{q['no']}: {label} not found by second extractor: {s[:60]}")
    nums = [int(x) for x in re.findall(r"\d", q["ans_raw"] or "")]
    if not nums or any(n < 1 or n > len(q["opts"]) for n in nums):
        problems.append(f"{q['no']}: bad answer key {q['ans_raw']!r}")
    two = bool(re.search(r"2\s*가지", q["q"]))
    if two != (len(nums) == 2):
        problems.append(f"{q['no']}: '2가지' is {two} but {len(nums)} answers ({q['ans_raw']})")
    if k in ("photo", "illust", "sign") and not q["img"]:
        problems.append(f"{q['no']}: {k} question without picture")
    if any(not o for o in q["opts"]) or len(q["opts"]) not in (4, 5):
        problems.append(f"{q['no']}: options {len(q['opts'])}")
    out.append({
        "id": f"q{q['no']:04d}",
        "no": q["no"],
        "kind": k,
        **({"img": q["img"]} if q["img"] else {}),
        "ko": {"q": q["q"], "opts": q["opts"], **({"notes": q["bullets"]} if q["bullets"] else {}), **({"exp": q["exp"]} if q["exp"] else {})},
        "ans": [n - 1 for n in nums],
        "src": {"page": q["page"]},
    })

(WORK / "questions.ko.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
(WORK / "check_ko.txt").write_text("\n".join(problems) + "\n")
from collections import Counter
print(Counter(q["kind"] for q in out), Counter(len(q["ans"]) for q in out))
print(f"{len(problems)} problems")
print("\n".join(problems[:40]))
