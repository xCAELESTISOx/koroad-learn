"""Extracts the official question bank PDF into structured Korean JSON, verbatim.

No language model touches the Korean text here: it is parsed straight from the PDF's text layer
(pdftotext -layout), and pictures are cropped from rendered pages at the positions of the PDF's
own images. An independent check against page images is done afterwards (docs/CONTENT.md).

Usage: python3 -I content/scripts/extract.py content/source/bank-2026-11-30.pdf content/work
Writes work/ko.json and pictures to apps/web/public/img/.
"""

import json
import re
import subprocess
import sys
from pathlib import Path

import pdfplumber
from PIL import Image

PDF = Path(sys.argv[1])
OUT = Path(sys.argv[2])
ROOT = Path(__file__).resolve().parents[2]
IMG_DIR = ROOT / "apps/web/public/img"
DPI = 150

CIRCLED = "①②③④⑤"
NUM_RE = re.compile(r"^\s*(\d{1,4})\s*[.．]\s*(.*)$")
ANS_RE = re.compile(r"^\s*■\s*정답\s*[：:]\s*(.+)$")
EXP_RE = re.compile(r"^\s*■\s*해설\s*[：:]\s*(.*)$")
BULLET_RE = re.compile(r"^\s*■\s*(.+)$")


def page_text(n: int) -> str:
    return subprocess.run(
        ["pdftotext", "-layout", "-f", str(n), "-l", str(n), str(PDF), "-"],
        capture_output=True, text=True, check=True,
    ).stdout


def norm(s: str) -> str:
    """Collapse the layout's runs of spaces; keep the characters themselves untouched."""
    return re.sub(r"\s+", " ", s).strip()


BR = "\u23ce"  # marks where the PDF wrapped a line
_kiwi = None


def unwrap(text: str) -> str:
    """Rejoins lines the PDF wrapped. Korean typesetting breaks lines anywhere, even inside a
    word (우회⏎전하여야), and drops the space when it breaks at one, so the text can't tell.
    Each break is decided by a Korean morphological analyzer (Kiwi): the break is closed up
    only when the joined word analyses clearly better than two words."""
    global _kiwi
    if BR not in text:
        return norm(text)
    if _kiwi is None:
        from kiwipiepy import Kiwi
        _kiwi = Kiwi()
    parts = [norm(p) for p in text.split(BR)]
    out = parts[0]
    for nxt in parts[1:]:
        if not out or not nxt:
            out = (out + " " + nxt).strip()
            continue
        left = out.rsplit(" ", 1)[-1]
        right = nxt.split(" ", 1)[0]
        hangul = re.match(r"[\uac00-\ud7a3]", right) and re.search(r"[\uac00-\ud7a3)]$", left)
        if hangul:
            spaced = _kiwi.analyze(f"{left} {right}")[0][1]
            joined = _kiwi.analyze(f"{left}{right}")[0][1]
            out = out + nxt if joined > spaced + 1.0 else out + " " + nxt
        else:
            out = out + " " + nxt
    return out


def split_options(line: str) -> list[tuple[int, str]]:
    """'① a   ② b' → [(0, 'a'), (1, 'b')]."""
    parts = re.split(f"([{CIRCLED}])", line)
    out = []
    for i in range(1, len(parts), 2):
        out.append((CIRCLED.index(parts[i]), norm(parts[i + 1])))
    return out


def join_wrapped(a: str, b: str) -> str:
    """Joins a line wrapped by the layout. Hangul wrapped mid-word has no space at the break
    in the source, but the PDF can't tell us; keep a space unless the break splits a word,
    which we detect as: previous line ends with a Hangul syllable and the next starts with one,
    and the previous line ran to the right margin (long line)."""
    if not a:
        return b
    if not b:
        return a
    return f"{a} {b}"


def parse():
    with pdfplumber.open(PDF) as pdf:
        npages = len(pdf.pages)
        questions = []
        cur = None
        mode = None  # "q", "opt", "bullet", "ans", "exp"
        expected = 1
        for pno in range(1, npages + 1):
            for raw in page_text(pno).splitlines():
                # The source sometimes types ⓛ (circled small L) for ①.
                raw = raw.replace("ⓛ", "①")
                line = raw.rstrip()
                if not line.strip():
                    continue
                m = NUM_RE.match(line)
                if m and int(m.group(1)) == expected and (cur is None or mode in ("ans", "exp")):
                    cur = {"no": expected, "page": pno, "q": [m.group(2)], "opts": {}, "bullets": [], "ans": None, "exp": [], "raw": [line]}
                    questions.append(cur)
                    expected += 1
                    mode = "q"
                    continue
                if cur is None:
                    continue
                cur["raw"].append(line)
                if (a := ANS_RE.match(line)) and mode not in ("exp",):
                    cur["ans"] = a.group(1).strip()
                    mode = "ans"
                    continue
                if (e := EXP_RE.match(line)) and mode == "ans":
                    cur["exp"].append(e.group(1))
                    mode = "exp"
                    continue
                if mode == "exp" or mode == "ans":
                    cur["exp"].append(line.strip())
                    mode = "exp"
                    continue
                # Situation notes printed beside a picture ("■ 편도 2차로의 교차로") sit in a right-hand
                # column; with -layout they share lines with options. Split that column off first.
                right = None
                if (m2 := re.search(r"\s{3,}(■.*)$", line)) and line.strip()[0] != "■":
                    line, right = line[: m2.start()], m2.group(1)
                elif cur["bullets"] and (m3 := re.match(r"^(.*?\S)?\s{6,}(\S.*)$", line)) and len(re.findall(f"[{CIRCLED}]", line)) < 2 and not re.search(f"[{CIRCLED}]", m3.group(2)):
                    line, right = (m3.group(1) or ""), m3.group(2)
                    if right.startswith("■"):
                        cur["bullets"].append(norm(right[1:]))
                        right = None
                    else:
                        cur["bullets"][-1] = cur["bullets"][-1] + BR + right.strip()
                        right = None
                if right:
                    cur["bullets"].append(norm(right.lstrip("■")))
                if not line.strip():
                    continue
                if re.search(f"[{CIRCLED}]", line):
                    for k, text in split_options(line):
                        cur["opts"][k] = text
                        cur["_last"] = k
                    mode = "opt"
                    continue
                if (b := BULLET_RE.match(line)):
                    cur["bullets"].append(norm(b.group(1)))
                    # An indented note sits in the right-hand column; a left-column line after it
                    # still continues the option being read, not the note.
                    if not (mode == "opt" and len(line) - len(line.lstrip()) >= 10):
                        mode = "bullet"
                    continue
                if mode == "bullet":
                    cur["bullets"][-1] = cur["bullets"][-1] + BR + line.strip()
                elif mode == "q":
                    cur["q"].append(line.strip())
                elif mode == "opt":
                    k = cur["_last"]
                    cur["opts"][k] = cur["opts"][k] + BR + line.strip()
        # Picture positions: the PDF's own images between a question's first line and its answer.
        for q in questions:
            q["images"] = []
        by_no = {q["no"]: q for q in questions}
        for pno, page in enumerate(pdf.pages, start=1):
            if not page.images:
                continue
            lines = page.extract_text_lines(layout=False, strip=True)
            anchors = []  # (top, no) for question starts, (top, None) for answer lines
            for ln in lines:
                t = ln["text"]
                m = NUM_RE.match(t)
                if m and int(m.group(1)) in by_no and by_no[int(m.group(1))]["page"] == pno:
                    anchors.append((ln["top"], int(m.group(1)), "start"))
                elif t.startswith("■") and "정답" in t[:6]:
                    anchors.append((ln["top"], None, "ans"))
            anchors.sort()
            for img in page.images:
                top = (img["top"] + img["bottom"]) / 2  # pictures start a little above their question's first line
                owner = None
                # The question whose start is the last one above the image, unless its answer line came first.
                for a_top, no, kind in anchors:
                    if a_top > top:
                        break
                    owner = no if kind == "start" else None
                if owner is None:
                    # A picture at the top of a page belongs to the question continued from the previous page.
                    prev = [q for q in questions if q["page"] < pno]
                    if prev and not any(k == "start" and t < top for t, _, k in anchors) and not any(k == "ans" and t < top for t, _, k in anchors):
                        owner = prev[-1]["no"]
                if owner is not None:
                    by_no[owner]["images"].append({"page": pno, "bbox": [img["x0"], img["top"], img["x1"], img["bottom"]], "size": [page.width, page.height]})
    return questions


def crop_images(questions):
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    rendered = {}
    for q in questions:
        if not q["images"]:
            continue
        pages = {i["page"] for i in q["images"]}
        p = min(pages)
        boxes = [i for i in q["images"] if i["page"] == p]
        if p not in rendered:
            stem = OUT / "tmp" / f"p{p:03d}"
            stem.parent.mkdir(parents=True, exist_ok=True)
            subprocess.run(["pdftoppm", "-r", str(DPI), "-f", str(p), "-l", str(p), "-png", "-singlefile", str(PDF), str(stem)], check=True)
            rendered[p] = Image.open(f"{stem}.png").convert("RGB")
        im = rendered[p]
        scale = DPI / 72
        x0 = min(b["bbox"][0] for b in boxes) * scale - 4
        y0 = min(b["bbox"][1] for b in boxes) * scale - 4
        x1 = max(b["bbox"][2] for b in boxes) * scale + 4
        y1 = max(b["bbox"][3] for b in boxes) * scale + 4
        crop = im.crop((max(0, int(x0)), max(0, int(y0)), min(im.width, int(x1)), min(im.height, int(y1))))
        if crop.width > 900:
            crop = crop.resize((900, round(crop.height * 900 / crop.width)), Image.LANCZOS)
        name = f"q{q['no']:04d}.webp"
        crop.save(IMG_DIR / name, "WEBP", quality=78, method=6)
        q["img"] = f"img/{name}"


def main():
    questions = parse()
    crop_images(questions)
    out = []
    for q in questions:
        n = max(q["opts"]) + 1 if q["opts"] else 0
        out.append({
            "no": q["no"],
            "page": q["page"],
            "q": unwrap(BR.join(q["q"])),
            "opts": [unwrap(q["opts"].get(k, "")) for k in range(n)],
            "bullets": [unwrap(b) for b in q["bullets"]],
            "ans_raw": q["ans"],
            "exp": unwrap(BR.join(q["exp"])),
            "img": q.get("img"),
            "n_images": len(q["images"]),
            "raw": "\n".join(q["raw"]),
        })
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "ko.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
    print(f"{len(out)} questions, {sum(1 for q in out if q['img'])} with pictures")


main()
