/**
 * Cloudflare Pages Function —— 处理 /callback
 *
 * GitHub 授权完成后会带着 ?code=... 跳回这里，
 * 我们用 code + client_secret 换取 access token，再把 token 交回后台页面。
 *
 * 注意：token 只通过 window.postMessage 交给同源的 /admin/ 页面，
 * 不会出现在 URL、日志或任何持久存储里。
 */

function successPage(payload) {
  const message = `authorization:github:success:${JSON.stringify(payload)}`;
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><title>登录成功</title></head>
<body style="font:16px/1.7 system-ui;padding:2rem;text-align:center">
<script>
(function () {
  var message = ${JSON.stringify(message)};
  function receiveMessage(e) {
    window.opener.postMessage(message, e.origin);
    window.removeEventListener("message", receiveMessage, false);
  }
  window.addEventListener("message", receiveMessage, false);
  window.opener.postMessage("authorizing:github", "*");
})();
</script>
<p>登录成功，正在返回后台…如果没有自动跳转，请手动关闭此窗口。</p>
</body></html>`;
}

function errorPage(text, detail) {
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><title>登录失败</title></head>
<body style="font:16px/1.7 system-ui;padding:2rem;max-width:40rem;margin:auto">
<h1>登录失败</h1>
<p>${text}</p>
<pre style="background:#f3f4f6;padding:1rem;border-radius:8px;overflow:auto">${detail || ""}</pre>
</body></html>`;
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response(errorPage("GitHub 没有返回授权码。可能是你在授权页点了取消。"), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return new Response(
      errorPage("Cloudflare Pages 项目缺少环境变量。", "请设置 GITHUB_CLIENT_ID 和 GITHUB_CLIENT_SECRET，然后重新部署。"),
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const data = await tokenResponse.json();

  if (!data.access_token) {
    return new Response(
      errorPage("换取 access token 失败。", JSON.stringify(data, null, 2)),
      { status: 401, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  return new Response(successPage({ token: data.access_token, provider: "github" }), {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
