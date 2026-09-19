# 部署清单

照着从上到下做。全程只需要做一次，之后写文章就只在浏览器里操作了。

---

## ☐ 第 1 步：装 git（约 5 分钟）

你这台机器上**没有 git**，而整套方案的核心就是「文章 = 仓库提交」，所以这步跳不过。

1. 打开 <https://git-scm.com/download/win>，下载 64-bit 安装包
2. 一路默认下一步，装完**关掉所有终端窗口**，重新打开
3. 验证：

   ```bash
   git --version
   ```

   能打印出版本号（比如 `git version 2.47.0`）就成了。

---

## ☐ 第 2 步：把项目推到 GitHub（约 10 分钟）

1. 在 <https://github.com/new> 建一个仓库
   - 名字随便，比如 `blog`
   - 可见性选 **Public**（Cloudflare Pages 免费版连公开仓库更省事）
   - **不要**勾选 "Add a README file"，否则会有冲突

2. 在本项目目录里执行（把 `你的用户名` 换成你的 GitHub 用户名）：

   ```bash
   cd "D:\新建文件夹 (4)"
   git init
   git add .
   git commit -m "初始化博客"
   git branch -M main
   git remote add origin https://github.com/你的用户名/blog.git
   git push -u origin main
   ```

   第一次推送会要求登录，用浏览器弹出的窗口授权即可。

3. **把仓库地址记下来**，形如 `你的用户名/blog`，第 5 步要用。

> 如果你想把项目放到 `D:\projects\blog` 这类干净路径下，现在是最后的机会——
> 之后再挪就要重新配 Cloudflare 了。

---

## ☐ 第 3 步：Cloudflare Pages 连接仓库（约 10 分钟）

你现在是手动上传的，这步之后就不用了——以后 push 代码自动部署。

1. Cloudflare Dashboard → 左侧 **Workers 和 Pages**（你截图里那一栏，现在是空的）
2. 点 **创建** → 选 **Pages** → **连接到 Git**
3. 授权 GitHub，选中第 2 步建的仓库
4. 构建配置**逐字**照填：

   | 字段 | 填什么 |
   |---|---|
   | 框架预设 / Framework preset | `None` |
   | 构建命令 / Build command | `npm run build` |
   | 构建输出目录 / Build output directory | `_site` |

5. 点 **保存并部署**，等 1～2 分钟

部署成功后，Cloudflare 会给你一个 `xxx.pages.dev` 的临时地址。
**先打开这个地址确认博客能正常显示**，再往下做。

---

## ☐ 第 4 步：配上登录（约 10 分钟）

不配的话 `/admin/` 后台能打开、能编辑，但**点保存会失败**。

### 4.1 建 GitHub OAuth App

<https://github.com/settings/developers> → **OAuth Apps** → **New OAuth App**

| 字段 | 填什么 |
|---|---|
| Application name | 博客后台 |
| Homepage URL | `https://ysnb.store` |
| Authorization callback URL | `https://ysnb.store/callback` |

点注册，然后记下 **Client ID**，再点 **Generate a new client secret** 记下 **Client Secret**（只显示一次，刷新就没了）。

### 4.2 填进 Cloudflare

Workers 和 Pages → 你的 Pages 项目 → **Settings** → **Variables and Secrets**，
加三条（前两条类型选 **Secret**）：

| 变量名 | 值 | 类型 |
|---|---|---|
| `GITHUB_CLIENT_ID` | 刚记的 Client ID | Secret |
| `GITHUB_CLIENT_SECRET` | 刚记的 Client Secret | Secret |
| `NODE_VERSION` | `20` | Plaintext |

加完回 **Deployments** 点 **Retry deployment** 重新部署一次，否则不生效。

---

## ☐ 第 5 步：绑定域名（约 5 分钟）

1. Pages 项目 → **Custom domains** → **Set up a custom domain**
2. 输入 `ysnb.store`
3. Cloudflare 会提示要修改 DNS 记录——**按提示点确认**。
   你现在的页面就是靠旧记录在服务的，接管之后旧页面会被新的博客覆盖。
4. 等证书签发（通常几分钟，最慢 24 小时）

### 5.2 填仓库名

改 `admin/config.yml` 里唯一剩下的 TODO：

```yaml
backend:
  repo: 你的用户名/blog      # ← 换成第 2 步的仓库地址
```

改完 commit + push，等自动部署完成。

---

## ✓ 验收

打开 `https://ysnb.store`，逐条确认：

- [ ] 首页显示「最新文章」，能看到「你好，世界」这篇
- [ ] 点进文章，标题、日期、代码块都正常显示
- [ ] `https://ysnb.store/feed.xml` 能打开
- [ ] `https://ysnb.store/admin/` 能打开后台
- [ ] 在后台点登录 → 跳 GitHub 授权 → 能回到后台并看到「文章」集合

五条全过，就彻底完成了。之后写文章只要打开 `/admin/`，写完点 Publish，
一两分钟后线上自动更新。

---

## 卡住了怎么办

| 症状 | 原因 | 怎么办 |
|---|---|---|
| Pages 构建失败 | 构建命令或输出目录填错 | 必须是 `npm run build` 和 `_site`，逐字照抄 |
| 页面打开是白的 | CSS/JS 路径 404 | 确认绑的是 `ysnb.store` 根域名，不是二级路径 |
| 后台保存报错 | 没配 OAuth 或 `repo` 没填 | 回头做第 4 步和第 5 步的 4.3 |
| 登录后报 callback 错误 | 回调地址不匹配 | OAuth App 里必须**完全等于** `https://ysnb.store/callback` |
| 环境变量改了没反应 | 没重新部署 | Deployments → Retry deployment |
| `git push` 报错 | 远程仓库有 README | 用 `git pull --rebase origin main` 合并后再推 |

---

## 附：关于旧页面

线上原来的「wzl66 游戏合集」页面已经被完整备份在 `backup/` 目录里，
绑域名时被覆盖了也能随时找回。
