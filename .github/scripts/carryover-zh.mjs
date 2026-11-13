// 自动结转中文翻译：把 zh-CN 分支上的中文值保留，对上游新增的键用其 pl 值预填，
// 保证 TypeScript 编译通过（zh 缺键会 tsc 失败）。预填的键收集进 issue，提醒人工润色。
//
// 解析策略：translations.ts 中形如
//   const pl = { "k": "v", ... }
//   const zh = { "k": "v", ... }
// 我们用正则抽取每个 const <LANG> = { ... } 对象，逐行解析 "key": "value" 对。
// 占位符 {name} 在结转时一并保留（pl 与 zh 的占位符应一致，由 t() 约束）。

import fs from "node:fs";
import { execSync } from "node:child_process";

const FILE = "EasyPDM.Web/src/i18n/translations.ts";
const text = fs.readFileSync(FILE, "utf8");

function parseDict(lang) {
  // 允许可选类型注解： const zh: Record<TranslationKey, string> = { ... }
  const re = new RegExp("const\\s+" + lang + "(?:\\s*:[^=]*)?\\s*=\\s*\\{", "g");
  const m = re.exec(text);
  if (!m) throw new Error("找不到 const " + lang);
  let i = m.index + m[0].length;
  let depth = 1;
  let buf = "";
  while (i < text.length && depth > 0) {
    const ch = text[i];
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
    if (depth > 0) buf += ch;
    i++;
  }
  const dict = {};
  const lineRe = /"((?:[^"\\]|\\.)*)"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
  let lm;
  while ((lm = lineRe.exec(buf))) {
    dict[lm[1]] = JSON.parse('"' + lm[2] + '"');
  }
  return dict;
}

const pl = parseDict("pl");
const en = parseDict("en");
const de = parseDict("de");
let zh = parseDict("zh");

const plKeys = Object.keys(pl);
const zhKeys = Object.keys(zh);

const added = [];      // 上游新增、zh 还没有的键 -> 用 pl 预填
let kept = 0;          // 已译、保留
let preFilled = 0;

// 找出 zh 有但 pl 没有的（上游可能删键）——这些 t() 不会再引用，留着也无害，但清理更干净
const orphan = zhKeys.filter((k) => !(k in pl));

// 对 pl 的每个键，zh 没有就用 pl 值预填
for (const k of plKeys) {
  if (!(k in zh)) {
    // 优先用英文（en 已对齐 pl 键），没有英文才用 pl
    zh[k] = k in en ? en[k] : pl[k];
    added.push(k);
    preFilled++;
  } else {
    kept++;
  }
}

// 重新生成 zh 字典块，按 pl 的键顺序输出（保持可读性一致），并保留已译值
function renderDict(lang, dict, sourceOrder) {
  const lines = sourceOrder.map((k) => {
    const v = dict[k];
    const jv = JSON.stringify(v); // 转义引号/换行
    return `  ${JSON.stringify(k)}: ${jv},`;
  });
  return `const ${lang}: Record<TranslationKey, string> = {\n${lines.join("\n")}\n}`;
}

const newZhBlock = renderDict("zh", zh, plKeys);
// 替换原 zh 块（含可选类型注解）
const zhRe = /const\s+zh(?:\s*:[^=]*)?\s*=\s*\{[\s\S]*?\n\}/;
const newText = text.replace(zhRe, newZhBlock);
fs.writeFileSync(FILE, newText);

// 输出 issue 正文（供下一步开 issue）
let issueBody = "";
if (added.length > 0) {
  issueBody = "上游新增了以下界面文案键，尚未翻译为中文。已用原文（pl/en）预填以保证编译通过，请人工润色为简体中文：\n\n";
  issueBody += added.map((k) => `- \`${k}\` —— 原文：${JSON.stringify(zh[k])}`).join("\n");
  issueBody += `\n\n（自动预填于 rebase-zh-CN 工作流，共 ${added.length} 个键）`;
}

// 通过 $GITHUB_OUTPUT 传递（本地无该变量时丢弃，不影响逻辑）
const out = added.length > 0 ? issueBody : "";
const ghOut = process.env.GITHUB_OUTPUT;
if (ghOut) fs.appendFileSync(ghOut, `issue_body<<EOF\n${out}\nEOF\n`);

console.log(`保留已译键: ${kept}`);
console.log(`预填新增键: ${preFilled} -> ${added.slice(0, 20).join(", ")}${added.length > 20 ? " ..." : ""}`);
console.log(`孤儿键(上游已删): ${orphan.length}`);
console.log(`已写入 ${FILE}`);
