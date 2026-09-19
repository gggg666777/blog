/**
 * 本地预览时也显示草稿（draft: true 的文章）。
 *
 * 为什么要单独一个脚本：直接写 `SHOW_DRAFTS=1 eleventy --serve` 只在
 * macOS / Linux 的 shell 里有效，Windows 的 cmd 和 PowerShell 不认。用 Node 启动就跨平台了。
 */
import { spawn } from "node:child_process";

const child = spawn("eleventy", ["--serve", "--port=8080"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, SHOW_DRAFTS: "1" },
});

child.on("exit", (code) => process.exit(code ?? 0));
