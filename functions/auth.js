/**
 * Cloudflare Pages Function —— 处理 /auth
 *
 * 作用：把访客跳转到 GitHub 的授权页面。
 *
 * 为什么需要这个：后台是纯静态页面，没有后端。
 * 而 GitHub OAuth 必须用 client_secret 去换 token，
 * secret 绝对不能放在浏览器里，所以需要这段服务端代码当中转。
 *
 * 环境变量（在 Cloudflare Pages 项目设置里配置，不要写进代码）：
 *   GITHUB_CLIENT_ID
 *   GITHUB_CLIENT_SECRET
 */

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);

  if (!env.GITHUB_CLIENT_ID) {
    return new Response("缺少环境变量 GITHUB_CLIENT_ID，请在 Cloudflare Pages 项目设置里添加。", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  authorizeUrl.searchParams.set("redirect_uri", `${url.origin}/callback`);
  authorizeUrl.searchParams.set("scope", "repo,user");
  authorizeUrl.searchParams.set("state", crypto.randomUUID());

  return Response.redirect(authorizeUrl.toString(), 302);
}
