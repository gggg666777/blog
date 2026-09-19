/**
 * Eleventy 配置
 *
 * 设计原则：这个生成器「只接管博客」，你现有的静态页面原样放进 src/ 即可，
 * 不需要重写、不需要迁移框架。
 */

const SHOW_DRAFTS = process.env.SHOW_DRAFTS === "1";

export default function (eleventyConfig) {
  /* ---------- 静态资源原样拷贝 ---------- */
  // 注意：Eleventy 的 passthrough 路径是相对于「项目根目录」的
  eleventyConfig.addPassthroughCopy({ "src/css": "css" });
  eleventyConfig.addPassthroughCopy({ "src/images": "images" });
  eleventyConfig.addPassthroughCopy({ "admin": "admin" });   // CMS 后台（刻意放在 src/ 之外）
  eleventyConfig.addPassthroughCopy({ "src/static": "/" });

  /* ---------- 监听：改 CSS / 后台配置也触发重建 ---------- */
  eleventyConfig.addWatchTarget("./src/css/");
  eleventyConfig.addWatchTarget("./admin/");

  /* ---------- 文章集合 ---------- */
  // 用自定义集合而不是 tags，避免和用户在 front matter 里写的 tags 撞车
  eleventyConfig.addCollection("posts", (api) =>
    api
      .getFilteredByGlob("src/posts/*.md")
      .filter((post) => SHOW_DRAFTS || post.data.draft !== true)
      .sort((a, b) => b.date - a.date)
  );

  /* ---------- 过滤器 ---------- */
  // 2025-01-08 -> 2025年1月8日
  eleventyConfig.addFilter("readableDate", (value) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  });

  // RSS 的 pubDate 需要 RFC-822 格式
  eleventyConfig.addFilter("rfc822", (value) => new Date(value).toUTCString());

  eleventyConfig.addFilter("isoDate", (value) => new Date(value).toISOString());

  // 取数组前 n 项
  eleventyConfig.addFilter("head", (arr, n) => (Array.isArray(arr) ? arr.slice(0, n) : []));

  eleventyConfig.addFilter("year", () => new Date().getFullYear());

  /* ---------- 目录结构 ---------- */
  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html", "11ty.js"],
  };
}
