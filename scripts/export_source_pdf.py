from pathlib import Path
from datetime import date
import re


ROOT = Path(".")
OUTPUT = ROOT / "ACES_full_source_code.pdf"

EXTENSIONS = {
    ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".yaml", ".yml",
    ".css", ".html", ".md", ".toml", ".xml", ".sh", ".sql", ".env.example",
}
ROOT_FILES = {
    "package.json", "pnpm-workspace.yaml", "tsconfig.json", "tsconfig.base.json",
    "babel.config.js", "App.js", "app.json", "eas.json", "replit.md",
}
EXCLUDED_PARTS = {
    "node_modules", ".git", ".expo", "dist", "build", ".cache", ".local",
}
EXCLUDED_NAMES = {
    "pnpm-lock.yaml",
}
SECRET_SUFFIXES = {".p8", ".pem", ".key", ".p12", ".jks"}
SECRET_WORDS = ("secret", "credential", "private_key", "authkey")


def is_source_file(path: Path) -> bool:
    if any(part in EXCLUDED_PARTS for part in path.parts):
        return False
    if path.name in EXCLUDED_NAMES:
        return False
    if path.suffix.lower() in SECRET_SUFFIXES:
        return False
    if any(word in path.name.lower() for word in SECRET_WORDS):
        return False
    if path.parts and path.parts[0] in {"artifacts", "lib"}:
        return path.suffix.lower() in EXTENSIONS
    return path.name in ROOT_FILES or path.suffix.lower() in {".ts", ".tsx", ".js", ".jsx"}


def source_files():
    paths = [p for p in ROOT.rglob("*") if p.is_file() and is_source_file(p)]
    return sorted(paths, key=lambda p: str(p).lower())


def safe_text(value: str) -> str:
    # Standard PDF Courier uses WinAnsi; preserve all common source characters,
    # replacing uncommon Unicode glyphs rather than failing the whole export.
    return value.replace("\t", "    ").replace("\r", "").encode("cp1252", "replace").decode("cp1252")


def pdf_escape(value: str) -> bytes:
    return safe_text(value).replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)").encode("cp1252")


def wrap_source_line(line: str, width: int = 112):
    if len(line) <= width:
        return [line]
    chunks = [line[i:i + width] for i in range(0, len(line), width)]
    return [chunks[0]] + ["  " + chunk for chunk in chunks[1:]]


def make_pages(paths):
    pages = []
    title_lines = [
        "ACES Managed Services",
        "Complete Source Code Export",
        "",
        f"Generated {date.today().isoformat()}",
        "",
        "Included:",
        "  - ACES Technician App (Expo / React Native)",
        "  - ACES Web Portal (React / Vite)",
        "  - API Server (Express / TypeScript)",
        "  - Shared API contracts, generated clients, and database schema",
        "",
        "This PDF contains editable text source. Dependencies, build output,",
        "binary assets, private keys, and credential files are intentionally omitted.",
        "",
        "Use the file inventory after this page to locate each source file.",
    ]
    pages.append(("README", title_lines))

    inventory = [
        "FILE INVENTORY",
        "",
        "The following source files are included in this export:",
        "",
    ]
    inventory.extend(f"{index:03d}  {path}" for index, path in enumerate(paths, 1))
    for start in range(0, len(inventory), 52):
        pages.append(("INVENTORY", inventory[start:start + 52]))

    for path in paths:
        relative = path.relative_to(ROOT).as_posix()
        try:
            content = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            content = path.read_text(encoding="utf-8", errors="replace")
        lines = [
            f"FILE: {relative}",
            f"SIZE: {path.stat().st_size:,} bytes",
            "",
        ]
        for original in content.splitlines():
            lines.extend(wrap_source_line(original))
        if not lines or lines[-1] != "":
            lines.append("")
        for start in range(0, len(lines), 52):
            pages.append((relative, lines[start:start + 52]))
    return pages


def build_pdf(pages):
    objects = []

    def add_object(data: bytes):
        objects.append(data)
        return len(objects)

    catalog_id = add_object(b"<< /Type /Catalog /Pages 2 0 R >>")
    pages_id = add_object(b"<< /Type /Pages /Kids [] /Count 0 >>")
    font_id = add_object(b"<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>")

    page_ids = []
    for page_number, (label, lines) in enumerate(pages, 1):
        content_lines = [
            "BT",
            "/F1 7.4 Tf",
            "0.12 0.18 0.25 rg",
            "48 768 Td",
        ]
        for line_index, line in enumerate(lines):
            if line_index:
                content_lines.append("0 -13 Td")
            content_lines.append(f"({pdf_escape(line).decode('cp1252')}) Tj")
        content_lines.extend([
            "0 1 0 rg",
            "BT /F1 7 Tf 48 24 Td",
            f"({pdf_escape(f'ACES source export  |  {page_number} / {len(pages)}  |  {label}').decode('cp1252')}) Tj",
            "ET",
            "ET",
        ])
        stream = "\n".join(content_lines).encode("cp1252")
        stream_id = add_object(
            b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream"
        )
        page_id = add_object(
            b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
            b"/Resources << /Font << /F1 " + str(font_id).encode() + b" 0 R >> >> "
            b"/Contents " + str(stream_id).encode() + b" 0 R >>"
        )
        page_ids.append(page_id)

    kids = b"[" + b" ".join(f"{page_id} 0 R".encode() for page_id in page_ids) + b"]"
    objects[pages_id - 1] = (
        b"<< /Type /Pages /Kids " + kids + b" /Count " + str(len(page_ids)).encode() + b" >>"
    )

    output = bytearray(b"%PDF-1.4\n%\xE2\xE3\xCF\xD3\n")
    offsets = [0]
    for object_number, data in enumerate(objects, 1):
        offsets.append(len(output))
        output.extend(f"{object_number} 0 obj\n".encode())
        output.extend(data)
        output.extend(b"\nendobj\n")
    xref_offset = len(output)
    output.extend(f"xref\n0 {len(objects) + 1}\n".encode())
    output.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        output.extend(f"{offset:010d} 00000 n \n".encode())
    output.extend(
        b"trailer\n<< /Size " + str(len(objects) + 1).encode()
        + b" /Root " + str(catalog_id).encode() + b" 0 R >>\n"
        + b"startxref\n" + str(xref_offset).encode() + b"\n%%EOF\n"
    )
    OUTPUT.write_bytes(output)


if __name__ == "__main__":
    files = source_files()
    pages = make_pages(files)
    build_pdf(pages)
    print(f"Created {OUTPUT} with {len(files)} files and {len(pages)} pages")