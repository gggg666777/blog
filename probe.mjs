const r = await fetch('https://jqlnb666.xyz', { redirect: 'follow' });
const t = await r.text();
for (const pat of [/title\s*:\s*['"]([^'"]+)['"]/g, /name\s*:\s*['"]([^'"]+)['"]/g, /id\s*:\s*['"]([^'"]+)['"]/g]) {
  const found = [...t.matchAll(pat)].map((m) => m[1]);
  if (found.length) console.log(pat.source, '=>', [...new Set(found)].slice(0, 40).join(' | '));
}
console.log('\n---- script srcs ----');
console.log([...t.matchAll(/<script[^>]*src=["']([^"']+)["']/gi)].map((m) => m[1]).join('\n'));
console.log('\n---- scripts inline count ----');
console.log([...t.matchAll(/<script(?![^>]*src)/gi)].length);
