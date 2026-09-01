import json
import re
import sys
from pathlib import Path

import pdfplumber


def extract_words(pdf_path: Path) -> list[str]:
    text = "\n".join(page.extract_text() or "" for page in pdfplumber.open(pdf_path).pages)
    seen: set[str] = set()
    words: list[str] = []

    for match in re.finditer(r"(?:^|\s)\d+\s+([가-힣^]+)", text):
        candidate = match.group(1).replace("^", "")
        if not re.fullmatch(r"[가-힣]+", candidate):
            continue
        if candidate in seen:
            continue
        seen.add(candidate)
        words.append(candidate)

    return words


def main() -> int:
    if len(sys.argv) < 3:
        print("Usage: extract-topik-i-candidates.py <pdf> <out.txt> [report.json]", file=sys.stderr)
        return 2

    pdf_path = Path(sys.argv[1])
    out_path = Path(sys.argv[2])
    report_path = Path(sys.argv[3]) if len(sys.argv) > 3 else None
    words = extract_words(pdf_path)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text("\n".join(words) + "\n", encoding="utf-8")

    if report_path:
      report_path.parent.mkdir(parents=True, exist_ok=True)
      report_path.write_text(json.dumps({
          "source": str(pdf_path),
          "totalCandidates": len(words),
          "first": words[:20],
          "last": words[-20:],
      }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(json.dumps({"totalCandidates": len(words), "out": str(out_path)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
