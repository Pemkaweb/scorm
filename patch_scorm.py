from __future__ import annotations

import shutil
from pathlib import Path

TARGET_FILES = [
    "data/index-nCtK8YOT.fix_20260319003054.js",
    "data/index-nCtK8YOT.js",
]

OUTER_WRAPPER_OLD = (
    'return N.jsxs("div",{className:xr("flex gap-3 max-w-[90%] md:max-w-[80%]",'
    'pe.role==="user"?"self-end flex-row-reverse":"self-start",'
    'pe.role==="system"?"max-w-full self-center w-full":""),children:['
)
OUTER_WRAPPER_NEW = (
    'return N.jsxs("div",{style:pe.fileBlobUrl&&pe.fileMime==="application/pdf"&&'
    '/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)?{maxWidth:"100%",width:"100%"}:void 0,'
    'className:xr("flex gap-3 max-w-[90%] md:max-w-[80%]",'
    'pe.role==="user"?"self-end flex-row-reverse":"self-start",'
    'pe.role==="system"?"max-w-full self-center w-full":""),children:['
)

BUBBLE_OLD = (
    'N.jsxs("div",{className:xr("shadow-sm",'
    'pe.role==="user"?"bg-primary text-white rounded-2xl rounded-tr-none p-4":'
    'pe.role==="assistant"?"bg-white border border-border text-foreground rounded-2xl rounded-tl-none p-4":"w-full"),children:['
)
BUBBLE_NEW = (
    'N.jsxs("div",{style:pe.fileBlobUrl&&pe.fileMime==="application/pdf"&&'
    '/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)&&pe.role==="assistant"?'
    '{width:"100%",maxWidth:"100%"}:void 0,className:xr("shadow-sm",'
    'pe.role==="user"?"bg-primary text-white rounded-2xl rounded-tr-none p-4":'
    'pe.role==="assistant"?"bg-white border border-border text-foreground rounded-2xl rounded-tl-none p-4":"w-full"),children:['
)

PDF_BLOCK_OLD = (
    'pe.fileBlobUrl&&N.jsxs("div",{className:"mb-2 flex flex-col gap-2 w-[min(90vw,600px)]",children:['
    'pe.fileMime==="application/pdf"&&!/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)&&'
    'N.jsx("embed",{src:pe.fileBlobUrl,type:"application/pdf",className:"w-full h-[600px] rounded-lg border border-gray-200"}),'
    'pe.fileMime==="application/pdf"?N.jsxs("div",{className:"flex flex-wrap gap-2",children:['
    'N.jsxs("a",{href:pe.fileBlobUrl,target:"_blank",rel:"noopener noreferrer",className:"inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg text-sm transition-colors self-start",children:[N.jsx(Am,{size:16}),"Открыть PDF"]}),'
    'N.jsxs("a",{href:pe.fileBlobUrl,download:pe.fileName||"file",target:"_blank",rel:"noopener noreferrer",className:"inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg text-sm transition-colors self-start",children:[N.jsx(Am,{size:16}),pe.fileName||"Скачать PDF"]})]}):'
    'N.jsxs("a",{href:pe.fileBlobUrl,download:pe.fileName||"file",target:"_blank",rel:"noopener noreferrer",className:"inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg text-sm transition-colors self-start",children:[N.jsx(Am,{size:16}),pe.fileName||"Скачать файл"]}),'
    'pe.fileCaption&&N.jsx("p",{className:"text-xs text-gray-500",children:pe.fileCaption})]}),'
)

PDF_BLOCK_NEW = (
    'pe.fileBlobUrl&&N.jsxs("div",{className:"mb-2 flex flex-col gap-2 w-[min(90vw,600px)]",'
    'style:/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)&&pe.fileMime==="application/pdf"?'
    '{width:"100%",maxWidth:"100%",overflow:"hidden"}:void 0,children:['
    'pe.fileMime==="application/pdf"?'
    '/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)?'
    'N.jsx("iframe",{src:pe.fileBlobUrl+"#view=FitH",title:pe.fileName||"PDF preview",className:"w-full rounded-lg border border-gray-200",style:{height:"70vh",background:"#fff"}}):'
    'N.jsx("embed",{src:pe.fileBlobUrl,type:"application/pdf",className:"w-full h-[600px] rounded-lg border border-gray-200"}):null,'
    'pe.fileMime==="application/pdf"?N.jsxs("div",{className:"flex flex-wrap gap-2",children:['
    'N.jsxs("a",{href:pe.fileBlobUrl,target:"_blank",rel:"noopener noreferrer",className:"inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg text-sm transition-colors self-start",style:{maxWidth:"100%",whiteSpace:"normal",wordBreak:"break-word",overflowWrap:"anywhere"},children:[N.jsx(Am,{size:16}),"Открыть PDF"]}),'
    'N.jsxs("a",{href:pe.fileBlobUrl,download:pe.fileName||"file",target:"_blank",rel:"noopener noreferrer",className:"inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg text-sm transition-colors self-start",style:{maxWidth:"100%",whiteSpace:"normal",wordBreak:"break-word",overflowWrap:"anywhere"},children:[N.jsx(Am,{size:16}),pe.fileName||"Скачать PDF"]})]}):'
    'N.jsxs("a",{href:pe.fileBlobUrl,download:pe.fileName||"file",target:"_blank",rel:"noopener noreferrer",className:"inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg text-sm transition-colors self-start",style:{maxWidth:"100%",whiteSpace:"normal",wordBreak:"break-word",overflowWrap:"anywhere"},children:[N.jsx(Am,{size:16}),pe.fileName||"Скачать файл"]}),'
    'pe.fileCaption&&N.jsx("p",{className:"text-xs text-gray-500",children:pe.fileCaption})]}),'
)


def patch_file(path: Path) -> bool:
    original = path.read_text(encoding="utf-8")
    updated = original

    replacements = [
        (OUTER_WRAPPER_OLD, OUTER_WRAPPER_NEW, "outer PDF message wrapper"),
        (BUBBLE_OLD, BUBBLE_NEW, "assistant bubble width on mobile"),
        (PDF_BLOCK_OLD, PDF_BLOCK_NEW, "PDF preview block"),
    ]

    for old, new, label in replacements:
        if old not in updated:
            raise RuntimeError(f"Не найден фрагмент для замены: {label} -> {path}")
        updated = updated.replace(old, new, 1)

    if updated == original:
        return False

    backup_path = path.with_suffix(path.suffix + ".bak_pdf_mobile_preview")
    shutil.copy2(path, backup_path)
    path.write_text(updated, encoding="utf-8")
    return True


if __name__ == "__main__":
    root = Path.cwd()
    changed = []

    for rel_path in TARGET_FILES:
        path = root / rel_path
        if not path.exists():
            continue
        if patch_file(path):
            changed.append(str(path))

    if not changed:
        print("Ни один файл не был изменён.")
    else:
        print("Готово. Обновлены файлы:")
        for item in changed:
            print(f" - {item}")