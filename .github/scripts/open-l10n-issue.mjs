// 打开或刷新一个 tracking issue，列出待人工润色的中文键。
// 用 GitHub REST API（GITHUB_TOKEN 注入），已存在同名 open issue 则更新而非新建。
import fs from "node:fs";

const body = process.env.ISSUE_BODY || "";
if (!body.trim()) {
  console.log("无待译键，跳过");
  process.exit(0);
}

const repo = process.env.GITHUB_REPOSITORY;
const [owner, name] = repo.split("/");
const api = "https://api.github.com";
const headers = {
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  Accept: "application/vnd.github+json",
  "User-Agent": "zh-l10n-bot",
  "X-GitHub-Api-Version": "2022-11-28",
};

const TITLE = "[zh-CN] 待人工润色：上游新增未译中文界面键";

async function listOpen() {
  const res = await fetch(`${api}/repos/${owner}/${name}/issues?state=open&per_page=100`, { headers });
  const arr = await res.json();
  return Array.isArray(arr) ? arr : [];
}

const existing = (await listOpen()).find((i) => i.title === TITLE);
const full = body + `\n\n---\n_本 issue 由 rebase-zh-CN 工作流自动维护，无需手动关闭；润色完成后会自动更新或关闭。_`;

if (existing) {
  await fetch(`${api}/repos/${owner}/${name}/issues/${existing.number}`, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ body: full }),
  });
  console.log(`已更新 issue #${existing.number}`);
} else {
  const res = await fetch(`${api}/repos/${owner}/${name}/issues`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ title: TITLE, body: full }),
  });
  const j = await res.json();
  console.log(`已新建 issue #${j.number}`);
}
