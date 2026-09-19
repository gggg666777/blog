/**
 * src/posts/ 目录的数据文件（Eleventy Directory Data File）
 *
 * 作用：
 *  1. 统一给所有文章套上 post.njk 布局
 *  2. 把文章 URL 从 /posts/xxx/ 改写成 /blog/xxx/
 *  3. 让 draft: true 的文章在正式构建中「根本不生成页面」——
 *     这一点必须在 permalink 上做，只在集合里过滤是不够的，
 *     否则草稿页照样会被写进 _site 并可以被直接访问。
 */

const SHOW_DRAFTS = process.env.SHOW_DRAFTS === "1";

export default {
  layout: "post.njk",
  labels: [],
  eleventyComputed: {
    permalink: (data) => {
      if (data.draft === true && !SHOW_DRAFTS) return false; // false = 不生成这个文件
      return `/blog/${data.page.fileSlug}/`;
    },
  },
};
