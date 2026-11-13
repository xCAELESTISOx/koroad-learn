"""Builds the vocabulary candidates from the Korean question texts, with no language model.

Kiwi (a Korean morphological analyzer) splits every question, option and side note into
morphemes. Content words are kept as dictionary forms:
  nouns (NNG, NNP), verbs and adjectives (VV, VA → stem + 다), noun + 하다/되다 verbs
  (좌회전하다), adverbs (MAG).
For each lemma we record how often it occurs, in which questions, and the exact spellings it
has in the text (the lemma's own characters as written, e.g. 허용하 for 허용하다), so the app can find
the word inside a question.

Usage: python3 -I content/scripts/vocab.py content/work [min_count]
Writes work/vocab.candidates.json.
"""

import json
import re
import sys
from collections import defaultdict
from pathlib import Path

from kiwipiepy import Kiwi

WORK = Path(sys.argv[1])
MIN = int(sys.argv[2]) if len(sys.argv) > 2 else 3
questions = [q for q in json.loads((WORK / "questions.ko.json").read_text()) if q["kind"] != "video"]
kiwi = Kiwi()

# Grammar-ish words that are not worth a flashcard.
STOP = {"것", "수", "등", "때", "중", "경우", "다음", "및", "또는", "그", "이", "저", "하다", "되다", "있다", "없다", "않다", "같다", "위하다", "대하다", "관하다", "따르다", "의하다", "통하다", "의", "내", "후", "전", "시", "바", "점", "번", "개", "명", "곳", "더", "안", "못", "잘", "가지", "제", "조", "항", "호"}

lemmas = defaultdict(lambda: {"count": 0, "qs": [], "forms": defaultdict(int), "pos": None, "ctx": None})


def add(lemma, pos, form, qid, sentence):
    if lemma in STOP or len(lemma) < 2 and pos != "verb":
        return
    if re.search(r"[0-9A-Za-z]", lemma):
        return
    e = lemmas[lemma]
    e["count"] += 1
    e["pos"] = e["pos"] or pos
    if qid not in e["qs"]:
        e["qs"].append(qid)
    if form:
        e["forms"][form] += 1
    if e["ctx"] is None:
        e["ctx"] = sentence


def analyse(text, qid):
    for sent in kiwi.split_into_sents(text):
        s = sent.text
        toks = kiwi.tokenize(s)
        # Start of the 어절 (space-separated chunk) each character belongs to.
        chunk_start = [0] * (len(s) + 1)
        start = 0
        for i, ch in enumerate(s):
            if ch.isspace():
                start = i + 1
            chunk_start[i] = start
        i = 0
        while i < len(toks):
            t = toks[i]
            nxt = toks[i + 1] if i + 1 < len(toks) else None
            form_end = t.start + t.len
            if t.tag in ("NNG", "NNP"):
                # Noun + 하다/되다 makes a verb: 좌회전 + 하 → 좌회전하다.
                if nxt and nxt.tag in ("XSV", "XSA") and nxt.form in ("하", "되") and nxt.start == form_end:
                    lemma = t.form + nxt.form + "다"
                    end = nxt.start + nxt.len
                    add(lemma, "verb", s[t.start:end].strip(), qid, s)
                    add(t.form, "noun", s[t.start:form_end].strip(), qid, s)
                    i += 2
                    continue
                add(t.form, "noun", s[t.start:form_end].strip(), qid, s)
            elif t.tag in ("VV", "VA", "VV-I", "VA-I", "VV-R", "VA-R"):
                lemma = t.form + "다"
                add(lemma, "verb" if t.tag.startswith("VV") else "adj", s[t.start:min(form_end, len(s))].strip(), qid, s)
            elif t.tag == "MAG":
                add(t.form, "adv", s[t.start:form_end].strip(), qid, s)
            i += 1


for q in questions:
    texts = [q["ko"]["q"], *q["ko"]["opts"], *q["ko"].get("notes", [])]
    for text in texts:
        analyse(text, q["id"])

out = []
for lemma, e in lemmas.items():
    if e["count"] < MIN:
        continue
    # Forms must be literal substrings of the texts; keep those of 2+ characters.
    forms = sorted({f for f in e["forms"] if len(f) >= 2 or f == lemma}, key=lambda f: -e["forms"][f])
    out.append({"ko": lemma, "pos": e["pos"], "count": e["count"], "nq": len(e["qs"]), "qs": e["qs"][:40], "forms": forms[:12], "ctx": e["ctx"]})
out.sort(key=lambda w: (-w["nq"], w["ko"]))
(WORK / "vocab.candidates.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
print(len(out), "lemmas with count >=", MIN)
print(" ".join(w["ko"] for w in out[:150]))
