"""Assembles the app's data from the checked pieces.

  work/questions.ko.json          Korean, verbatim (extract.py + check_ko.py)
  work/agents/q-ru-NN.json        Russian translations (translator agents)
  work/agents/q-check-NN.json     independent review (verifier agents): fixes and flags
  work/vocab.candidates.json      vocabulary from the texts (vocab.py)
  work/agents/vocab-out-N.json    glosses (translator agents)
  work/agents/vocab-check-out.json  independent review of the glosses

Writes apps/web/src/data/{questions,vocab,meta}.json and work/report.md.
Usage: python3 -I content/scripts/build.py content/work
"""

import json
import re
import sys
from datetime import date
from pathlib import Path

from korean_romanizer.romanizer import Romanizer

WORK = Path(sys.argv[1])
AG = WORK / "agents"
ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "apps/web/src/data"

ko = json.loads((WORK / "questions.ko.json").read_text())
report = []

# ---- Russian, then the reviewers' fixes on top ----
ru = {}
for f in sorted(AG.glob("q-ru-[0-9]*.json")):
    for item in json.loads(f.read_text()):
        ru[item["id"]] = item
checks = {}
for f in sorted(AG.glob("q-check-[0-9]*.json")):
    for item in json.loads(f.read_text()):
        checks.setdefault(item["id"], []).append(item)

numfix = {}
if (AG / "num-check-out.json").exists():
    for c in json.loads((AG / "num-check-out.json").read_text()):
        numfix.setdefault(c["id"], []).append(c)

SOURCE_NOTES = {
    # The question doesn't say "2가지", but the official key has two answers.
    n: "В официальном ключе два правильных ответа, хотя в вопросе не написано «2가지»."
    for n in (738, 835, 1025, 1034)
}

questions = []
stats = {"critical": 0, "minor": 0, "source": 0, "missing": 0}
for q in ko:
    if q["kind"] == "video":
        continue
    r = ru.get(q["id"])
    if not r:
        stats["missing"] += 1
        report.append(f"- {q['id']}: no translation, left out")
        continue
    r = {k: r[k] for k in ("q", "opts", "notes", "exp") if k in r}
    flag = None
    for c in checks.get(q["id"], []):
        stats[c["severity"]] = stats.get(c["severity"], 0) + 1
        if c.get("fix"):
            for k, v in c["fix"].items():
                if k in ("q", "opts", "notes", "exp"):
                    r[k] = v
        if c["severity"] == "source":
            flag = f"Проверяющий: {c['why']}"
        report.append(f"- {q['id']} [{c['severity']}] {c['why']}")
    # Number check: a separate pass over every field whose digits differ between ko and ru.
    for c in numfix.get(q["id"], []):
        f = c["field"]
        if f == "q":
            r["q"] = c["fix"]
        else:
            k, i = re.match(r"(opts|notes)\[(\d+)\]", f).groups()
            r[k] = list(r[k])
            r[k][int(i)] = c["fix"]
        stats["numbers"] = stats.get("numbers", 0) + 1
        report.append(f"- {q['id']} [numbers] {c['why']}")
    # Structural guards: a translation must have the same shape as the original.
    if len(r.get("opts", [])) != len(q["ko"]["opts"]) or len(r.get("notes", [])) != len(q["ko"].get("notes", [])):
        report.append(f"- {q['id']}: shape mismatch, left out")
        stats["missing"] += 1
        continue
    nums_ko = re.findall(r"\d+(?:[.,]\d+)?", q["ko"]["q"] + " ".join(q["ko"]["opts"]))
    nums_ru = re.findall(r"\d+(?:[.,]\d+)?", r["q"] + " ".join(r["opts"]))
    if sorted(n.replace(",", ".") for n in nums_ko) != sorted(n.replace(",", ".") for n in nums_ru):
        stats["digits_differ"] = stats.get("digits_differ", 0) + 1  # all read by the number reviewer
    out = {**q, "ru": r}
    if flag and q["no"] not in SOURCE_NOTES:  # those already carry the note on the source
        out["flag"] = flag
    if q["no"] in SOURCE_NOTES:
        out["srcNote"] = SOURCE_NOTES[q["no"]]
    questions.append(out)

# ---- Vocabulary ----
cands = {c["ko"]: c for c in json.loads((WORK / "vocab.candidates.json").read_text())}
gloss = {}
for f in sorted(AG.glob("vocab-out-*.json")):
    for g in json.loads(f.read_text()):
        gloss[g["ko"]] = g
vfix = {}
if (AG / "vocab-check-out.json").exists():
    for c in json.loads((AG / "vocab-check-out.json").read_text()):
        vfix[c["ko"]] = c

kept_ids = {q["id"] for q in questions}
words = []
for lemma, c in cands.items():
    g = gloss.get(lemma)
    if not g or g.get("skip"):
        continue
    fix = vfix.get(lemma)
    if fix and fix.get("problem") == "fragment":
        continue
    w = {"ko": lemma, "ru": g["ru"]}
    if g.get("hanja"):
        w["hanja"] = g["hanja"]
    if g.get("note"):
        w["note"] = g["note"]
    if fix:
        for k in ("ru", "hanja", "note"):
            if k in fix:
                if fix[k]:
                    w[k] = fix[k]
                else:
                    w.pop(k, None)
    qs = [i for i in c["qs"] if i in kept_ids]
    if not qs:
        continue
    words.append({
        "id": f"w{len(words) + 1:04d}",
        **w,
        "rr": Romanizer(lemma).romanize(),
        "pos": c["pos"],
        "forms": c["forms"],
        "n": c["nq"],
        "qs": qs,
    })

meta = {
    "version": f"{date.today().isoformat()} · {len(questions)} вопросов · {len(words)} слов",
    "source": {
        "title": "[2026년 11월 30일 시행] 1·2종보통, 대형·특수 학과시험 문제은행 (한국어)",
        "short": "문제은행 도로교통공단, ред. 30.11.2026",
        "publisher": "도로교통공단 (Korea Road Traffic Authority, KoROAD)",
        "effective": "Действует с 30 ноября 2026 г.",
        "url": "https://www.safedriving.or.kr/subExamBoard/selectSubExamBoardKorList.do",
        "method": "\n".join([
            "1. Корейский текст, ключи ответов и картинки извлечены из официального PDF программой, без ИИ, и сверены вторым независимым извлечением текста.",
            "2. Перевод на русский делали отдельные агенты, которым не показывали ключи ответов.",
            "3. Другие, независимые агенты сверили каждый перевод с корейским оригиналом и ключом: смысл, числа, отрицания, согласованность с правильным ответом. Найденные ошибки исправлены.",
            "   Отдельно проверены все поля, где цифры в переводе отличаются от корейских (суммы, сроки, скорости, границы «не более/менее»).",
            "4. Словарь — леммы из текстов вопросов (морфологический анализатор Kiwi), переводы проверены отдельным агентом.",
            "Корейский текст — первоисточник. Перевод — подсказка; при сомнении опирайся на корейский.",
        ]),
        "flagged": sum(1 for q in questions if q.get("flag")),
        "skipped": "35 видео-вопросов (№ 966–1000) не включены: для них нужен ролик с сайта KoROAD.",
    },
    "exam": {
        "count": 39,
        "minutes": 40,
        "pass": 60,
        "mix": {"text": 21, "sign": 5, "photo": 6, "illust": 7},
        "points": {"text": 2, "text2": 3, "sign": 2, "photo": 3, "illust": 3},
        "note": "Настоящий экзамен: 40 вопросов (21 текстовый, 5 знаков, 6 фото, 7 иллюстраций, 1 видео), 40 минут, для 2종 보통 проходной балл 60, для 1종 — 70. Видео-вопрос (5 баллов) здесь не моделируется, поэтому максимум 95. Баллы за тип вопроса — по данным подготовительных материалов, официально они не публикуются.",
    },
    "kinds": {"text": "Текст", "sign": "Знак", "photo": "Фото", "illust": "Иллюстрация", "video": "Видео"},
}

DATA.mkdir(parents=True, exist_ok=True)
(DATA / "questions.json").write_text(json.dumps(questions, ensure_ascii=False, separators=(",", ":")))
(DATA / "vocab.json").write_text(json.dumps(words, ensure_ascii=False, separators=(",", ":")))
(DATA / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1))
(WORK / "report.md").write_text(
    f"# Content build report\n\n{len(questions)} questions, {len(words)} words. Review: {stats}\n\n" + "\n".join(report) + "\n"
)
print(len(questions), "questions,", len(words), "words,", stats)
