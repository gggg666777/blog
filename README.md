# ysnb.store —— 带可视化后台的个人博客

一个纯静态博客，没有数据库，也没有后端服务器。核心是 **Git-based CMS**：
后台本身也是个静态页面，登录用 GitHub 账号，你点「保存」时它通过 GitHub API
把文章以 Markdown 提交到仓库，Cloudflare Pages 再自动重新构建上线。

```
你在 /admin/ 写文章
        │  点保存
        ▼
GitHub API  ←── OAuth 登录（需要一个中转 Worker，见第五节）
        │  提交 Markdown 到 src/posts/
        ▼
Cloudflare Pages 自动构建（Eleventy）并部署
        │
        ▼
https://ysnb.store
```

---

## 一、先看这份「选型对照表」

我选的是 **Eleventy + Sveltia CMS + GitHub OAuth**。其他选项的真实代价：

| 方案 | 后台登录方式 | 代价 |
|---|---|---|
| **本方案**<br>Eleventy + Sveltia/Decap | GitHub 账号 | 要自己建一个 OAuth Worker（约 30 分钟一次性工作） |
| Decap + Netlify Identity | Netlify 账号 | 零代码，但**只能部署在 Netlify**；且 Netlify Identity 已被官方标记为弃用中，新项目不建议再依赖，请以 Netlify 官方公告为准 |
| TinaCMS | Tina Cloud 账号 | 可视化编辑体验最好（所见即所得点选编辑），对整站改造要求更高 |
| WordPress | 自建账号 | 需要一个 PHP 服务器 + 数据库，你的「纯静态」前提就没了 |
| 掘金 / Medium 等平台 | 平台账号 | 最省事，但内容不在你手里，SEO 权重也归平台 |

**为什么用 Eleventy 而不是 Next.js / Astro**：博客的需求就是把 Markdown 渲染成 HTML，
Eleventy 几乎零配置就能做到，构建一次 0.2 秒，产出的就是纯静态文件。
Next.js / Astro 能做的事更多，但对「只想写文章」来说是负担。

---

## 二、三个前置条件（缺一不可）

1. **装 git** —— 你这台机器上目前**没有 git**。
   这套方案的核心就是「文章 = 仓库里的提交」，没有 git 一切免谈。
   去 <https://git-scm.com/download/win> 下载安装，装完重开终端，`git --version` 能出版本号即可。

2. **一个 GitHub 仓库** —— 放代码和文章。后台保存文章就是往这里提交。

3. **Cloudflare 账号** —— 你已经有了（`ysnb.store` 的 DNS 就在 Cloudflare 上），
   用来跑 OAuth 中转 Worker，并托管网站。见第五、六节。

> 顺带一提：当前目录名是 `D:\新建文件夹 (4)`，带空格、括号和中文。
> 大部分工具能处理，但偶尔会咬人。建议把项目放到 `D:\projects\my-blog` 这类干净路径下再继续。

---

## 三、目录结构

```
├── admin/                    ← CMS 后台（刻意放在 src/ 之外，避免被构建器渲染）
│   ├── index.html            ← 后台入口，部署后访问 /admin/
│   ├── config.yml            ← 后台的表单字段配置（标题、标签、封面、草稿…）
│   └── sveltia-cms.js        ← CMS 本体（本地副本，不依赖 CDN）
├── cms-oauth-worker/         ← 登录中转服务
│   ├── worker.js
│   └── wrangler.toml
├── src/                      ← 网站源文件
│   ├── _data/site.json       ← 站名、副标题、域名、作者（改这里换站名）
│   ├── _includes/
│   │   ├── base.njk          ← 全站外壳（页头 / 页脚）
│   │   └── post.njk          ← 文章页布局
│   ├── posts/
│   │   ├── posts.11tydata.js ← 文章目录的统一规则
│   │   └── hello-world.md    ← 示例文章，删掉它
│   ├── index.njk             ← 首页 = 文章列表
│   ├── feed.njk              ← /feed.xml RSS
│   ├── sitemap.njk           ← /sitemap.xml
│   ├── css/style.css         ← 全部配色集中在文件顶部的 :root
│   └── static/               ← 这里的东西原样复制到网站根目录
└── backup/                   ← 线上旧版 wzl66 页面的备份
```

---

## 四、本地跑起来

```bash
npm install
npm run dev          # http://localhost:8080
npm run dev:drafts   # 同上，但连草稿一起预览
npm run build        # 只构建到 _site/
```

已实测通过的路由：

| 路由 | 说明 |
|---|---|
| `/` | 首页 = 文章列表 |
| `/blog/<文件名>/` | 文章详情 |
| `/feed.xml` | RSS 订阅 |
| `/sitemap.xml` | 站点地图 |
| `/admin/` | 可视化后台 |
| `/robots.txt` | 已自动 Disallow `/admin/` |

### 改站名 / 换配色

- **站名**：改 `src/_data/site.json` 里的 `title` 和 `tagline`。
- **配色**：改 `src/css/style.css` 顶部 `:root` 里的变量，整站颜色跟着变。
- **想要浅色主题**：把 `:root` 里的 `--bg` 改成 `#ffffff`、`--text` 改成 `#1f2328` 即可。

---

## 五、把后台登录配起来（一次性，约 15 分钟）

登录接口由 `functions/auth.js` 和 `functions/callback.js` 提供，**跟着网站一起部署**，
不需要单独再建一个 Worker。

### 1. 建 GitHub OAuth App

GitHub → Settings → Developer settings → OAuth Apps → **New OAuth App**

| 字段 | 填什么 |
|---|---|
| Application name | 博客后台（随便写） |
| Homepage URL | `https://ysnb.store` |
| Authorization callback URL | `https://ysnb.store/callback` |

点 **Register application**，然后：

- 记下 **Client ID**
- 点 **Generate a new client secret**，记下 **Client Secret**（只显示一次）

### 2. 把这两个值填进 Cloudflare Pages

Cloudflare Dashboard → Workers & Pages → 你的 Pages 项目 → **Settings** → **Variables and Secrets**，
添加两条（类型选 **Secret**，不要选 Plaintext）：

| 变量名 | 值 |
|---|---|
| `GITHUB_CLIENT_ID` | 上一步记下的 Client ID |
| `GITHUB_CLIENT_SECRET` | 上一步记下的 Client Secret |

同时再加一条普通变量，避免 Cloudflare 用错 Node 版本：

| 变量名 | 值 | 类型 |
|---|---|---|
| `NODE_VERSION` | `20` | Plaintext |

改完环境变量要**重新部署一次**才会生效（Deployments → Retry deployment）。

### 3. 改 `admin/config.yml`

只剩一个 `TODO`——填你的仓库名：

```yaml
backend:
  repo: 你的用户名/你的仓库名    # ← 只改这一行
```

`base_url` 已经是 `https://ysnb.store`，不用动。

> ⚠️ `client_secret` 绝不能写进这个文件再提交到仓库。它只存在于 Cloudflare 的环境变量里。

### 4. 验证

打开 `https://ysnb.store/admin/`，点登录 → 跳转 GitHub 授权 → 自动回到后台。
左侧能看到「文章」这个集合，就说明整条链路通了。

如果卡在登录，按顺序排查：

1. OAuth App 的 callback 是不是**完全等于** `https://ysnb.store/callback`（多一个斜杠都会失败）。
2. Cloudflare 环境变量名字有没有拼错，是不是加完之后忘记重新部署。
3. 打开浏览器控制台看 `https://ysnb.store/auth` 的返回内容，函数里写了具体的错误提示。

---

## 六、部署到 Cloudflare Pages（ysnb.store）

你的域名 `ysnb.store` 已经托管在 Cloudflare 上了，所以用 Cloudflare Pages 最顺。

### 方案 A：手动上传（5 分钟，但后台不可用）

```bash
npm run build
```

然后打开 Cloudflare Dashboard → **Workers & Pages** → 你的 Pages 项目 → **Create deployment**，
把 **`_site` 文件夹里面的内容**拖进去。

> ⚠️ 是拖文件夹**里面的内容**，不是拖 `_site` 这个文件夹本身。
> 拖错了网站会变成 `ysnb.store/_site/`。

**这条路博客能正常访问，但 `/admin/` 后台保存不了**——因为手动上传没有 Git 仓库，
后台没有地方可以提交文章。你会看到后台能打开、能登录、能编辑，但点保存报错。

### 方案 B：连接 Git 仓库（推荐，后台可用）

这是唯一能让可视化后台真正工作的方式。

1. 先装 git（见第二节），把项目推到 GitHub。
2. Cloudflare Dashboard → Workers & Pages → **Create** → **Pages** → **Connect to Git**，选你的仓库。
3. 构建配置：

   | 字段 | 填什么 |
   |---|---|
   | Framework preset | None |
   | Build command | `npm run build` |
   | Build output directory | `_site` |

4. 加一个环境变量，否则 Cloudflare 可能用错 Node 版本：

   | 变量名 | 值 |
   |---|---|
   | `NODE_VERSION` | `20` |

5. 部署完成后，在 **Custom domains** 里绑定 `ysnb.store`。

之后的工作流就闭环了：在 `/admin/` 写文章 → 提交到仓库 → Cloudflare 自动重新构建 → 上线。

### 从手动上传迁移到方案 B

你现在是手动上传的，迁移很干净，不会丢东西：

1. 把项目推到 GitHub（这时候线上还是旧的 wzl66 页面，不受影响）。
2. 在同一个 Pages 项目里点 **Connect to Git**，接上仓库。
3. 首次自动构建部署完成后，`ysnb.store` 就变成你的博客了。
4. 线上旧的 wzl66 页面会被覆盖。备份已经放在 `backup/` 目录里了。

### 顺带提醒

- `admin/sveltia-cms.js` 有 2 MB，Cloudflare Pages 单文件上限 25 MB、总文件数上限 20000，都没问题。

---

## 七、日常写作流程

打开 `/admin/` → 新建文章 → 填标题、日期、标签、正文 → **Publish**。

它会自动往 `src/posts/` 提交一个 Markdown 文件，Cloudflare Pages 随即重新构建上线。
通常 1～2 分钟后线上就能看到。

**草稿**：`config.yml` 里的「草稿」开关对应 front matter 的 `draft: true`。
打开后本地 `npm run dev:drafts` 能预览，但**正式构建根本不生成这个页面**，
所以它不会出现在列表里，也不会被人猜到 URL 访问到。

**不想要后台**？直接在 `src/posts/` 新建 `.md` 也一样，后台只是个便利层。

---

## 八、已知的坑

- **改完 `config.yml` 要重新构建**：它通过 `admin/` 目录被复制到 `_site/`，
  本地改完不会自动生效，重跑 `npm run build` 或 `npm run dev`。
- **`admin/` 目录不要挪进 `src/`**：会被 Eleventy 当成模板渲染，
  而且目录数据文件会被一起拷进产物。（我一开始就是这么写的，已经修掉。）
- **草稿过滤必须在 `permalink` 上做**：只在集合里过滤，
  草稿页面照样会被写进 `_site` 并能被直接访问。（这个 bug 也踩过并修掉了。）
- **`node_modules/` 和 `.npm-cache/` 已在 `.gitignore` 里**，别提交。
- **OAuth Worker 的 `client_secret` 绝不能进仓库**，只用 `wrangler secret` 注入。
- **CMS 脚本是本地副本**：`admin/sveltia-cms.js`（约 2 MB）直接从 `node_modules` 拷来，
  刻意不走 unpkg / jsdelivr。国内这两个 CDN 经常加载不出来，后台会白屏。
  代价是仓库里多一个 2 MB 的文件，换来的是后台一定能打开。
  升级：`npm install --save-dev @sveltia/cms@latest` 后重新拷贝该文件。
- **Sveltia CMS 想换回 Decap CMS**：`npm install --save-dev decap-cms`，
  把 `node_modules/decap-cms/dist/decap-cms.js` 拷进 `admin/`，
  改 `admin/index.html` 那一行 `src` 即可，`config.yml` 两份通用。

---

## 九、下一步可以加的

按性价比排序：

1. **标签归档页** —— `/tags/标签名/`，front matter 里的 `labels` 已经存好了，只差一个模板。
2. **代码高亮** —— 引入 `@11ty/eleventy-plugin-syntaxhighlight`。
3. **图片自动压缩** —— `@11ty/eleventy-img`。
4. **评论** —— 静态站用 Giscus（基于 GitHub Discussions），免费且无需后端。
5. **站内搜索** —— 文章量超过 ~50 篇再考虑，可用 Pagefind（构建时生成索引）。
