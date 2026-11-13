import { LEXICON } from "../lib/data";
import { segment } from "../lib/korean";
import { openWord } from "./overlay";

/** Korean text where every known word is underlined and opens its translation on tap. */
export function KoText({ text, active }: { text: string; active?: string }) {
  return (
    <>
      {segment(LEXICON, text).map((p, i) =>
        p.word ? (
          <span
            key={i}
            className={`w${p.word === active ? " on" : ""}`}
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              openWord(p.word!);
            }}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openWord(p.word!)}
          >
            {p.text}
          </span>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}
