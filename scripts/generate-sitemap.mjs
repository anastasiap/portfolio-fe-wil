import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const siteUrl = "https://test.com";

const routes = [
  "/",
  "/about",
  "/blog",
  "/blog/adhd-in-5-minutes",
  "/blog/why-do-i-feel-stuck",
  "/blog/what-is-the-wheel-of-life",
  "/blog/wheel-of-life-categories-for-teamleads",
  "/for-coaches",
  "/plans",
  "/how-personal-plan-works",
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map((route) => {
    const loc = `${siteUrl}${route === "/" ? "" : route}`;
    return `  <url>
    <loc>${loc}</loc>
  </url>`;
  })
  .join("\n")}
</urlset>
`;

const outputPath = "src/assets/seo/sitemap.xml";
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, xml, "utf8");

console.log(`Generated ${outputPath}`);
