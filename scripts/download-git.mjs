import { writeFileSync } from "node:fs";

// GitHub 直连在这台机器上会卡住，改用 npmmirror 镜像（文件完全相同）
const MIRROR =
  "https://registry.npmmirror.com/-/binary/git-for-windows/v2.55.0.windows.5/MinGit-2.55.0.5-64-bit.zip";
const OFFICIAL =
  "https://github.com/git-for-windows/git/releases/download/v2.55.0.windows.5/MinGit-2.55.0.5-64-bit.zip";

async function tryDownload(label, url) {
  console.log(`尝试 ${label} ...`);
  const c = new AbortController();
  const timer = setTimeout(() => c.abort(), 180000); // 3 分钟超时
  try {
    const r = await fetch(url, { headers: { "User-Agent": "node" }, redirect: "follow", signal: c.signal });
    if (!r.ok) { console.log(`  HTTP ${r.status}`); return null; }
    const buf = Buffer.from(await r.arrayBuffer());
    clearTimeout(timer);
    if (buf.length < 10 * 1024 * 1024) { console.log(`  只有 ${(buf.length / 1024 / 1024).toFixed(1)} MB，不完整`); return null; }
    console.log(`  成功: ${(buf.length / 1024 / 1024).toFixed(1)} MB`);
    return buf;
  } catch (e) {
    clearTimeout(timer);
    console.log(`  失败: ${e.message}`);
    return null;
  }
}

let buf = await tryDownload("国内镜像 npmmirror", MIRROR);
if (!buf) buf = await tryDownload("GitHub 官方源", OFFICIAL);
if (!buf) { console.log("两个源都失败了"); process.exit(1); }

writeFileSync(".tools/MinGit.zip", buf);
console.log("已保存到 .tools/MinGit.zip");
