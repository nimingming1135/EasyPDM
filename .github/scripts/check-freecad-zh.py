#!/usr/bin/env python3
# 检查 FreeCAD 宏（.FCMacro）里 zh 翻译段是否缺失上游已有键。
# 这些宏用 Python dict：TRANSLATIONS = {"pl": {...}, "en": {...}, "de": {...}, "zh": {...}}
# 缺键时 t() 静默回退英文（不报错），所以需要主动检测。
import ast
import io
import os

FILES = [
    "EasyPDM.FreeCad/EasyPDMUpload.FCMacro",
    "EasyPDM.FreeCad/EasyPDMDownload.FCMacro",
]

report = ""
for f in FILES:
    if not os.path.exists(f):
        continue
    src = io.open(f, encoding="utf-8").read()
    try:
        tree = ast.parse(src)
    except SyntaxError as e:
        report += f"\n## {f}\n语法错误: {e}\n"
        continue
    tr = None
    for node in tree.body:
        if isinstance(node, ast.Assign) and getattr(node.targets[0], "id", "") == "TRANSLATIONS":
            tr = ast.literal_eval(node.value)
    if not tr:
        report += f"\n## {f}\n未找到 TRANSLATIONS\n"
        continue
    pl = tr.get("pl", {})
    en = tr.get("en", {})
    zh = tr.get("zh", {})
    base = list(pl.keys())
    missing = [k for k in base if k not in zh]
    if missing:
        report += f"\n## {f}\n"
        report += f"缺失 {len(missing)} 个中文键（将回退英文）：\n"
        for k in missing:
            report += f"- `{k}` —— 英文：{en.get(k, pl.get(k))}\n"

body = ""
if report.strip():
    body = "FreeCAD 宏检测到以下中文键缺失（会静默回退英文，请补译）：\n" + report + \
           "\n\n_由 zh-l10n-check 工作流检测。_"

gh_out = os.environ.get("GITHUB_OUTPUT")
if gh_out:
    with io.open(gh_out, "a", encoding="utf-8") as fh:
        fh.write("issue_body<<EOF\n" + body + "\nEOF\n")

print(report.strip() or "FreeCAD 宏中文键完整")
