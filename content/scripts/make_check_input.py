"""Joins Korean, answer key and Russian for one chunk, as input for a reviewer agent."""
import json, sys
from pathlib import Path
W = Path(sys.argv[1]); n = sys.argv[2]
ko = {q["id"]: q for q in json.loads((W / "questions.ko.json").read_text())}
ru = json.loads((W / f"agents/q-ru-{n}.json").read_text())
items = [{"id": r["id"], "no": ko[r["id"]]["no"], "kind": ko[r["id"]]["kind"], "ko": ko[r["id"]]["ko"], "ans": ko[r["id"]]["ans"],
          "ru": {k: r[k] for k in ("q", "opts", "notes", "exp") if k in r}} for r in ru]
assert len(items) == len(json.loads((W / f"agents/q-in-{n}.json").read_text()))
(W / f"agents/q-check-in-{n}.json").write_text(json.dumps(items, ensure_ascii=False, indent=1))
print(n, len(items))
