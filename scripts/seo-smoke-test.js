const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

/**
 * Smoke test to verify SEO meta tags in built SSR artifacts
 * Validates that each prerendered page has unique titles and meta descriptions
 */

class SeoSmokeTest {
  constructor(distPath) {
    this.distPath = path.join(__dirname, "..", distPath || "dist/wheeloflife/browser");
    this.results = [];
    this.errors = [];
  }

  async runTests() {
    console.log("🔍 Running SEO Smoke Tests...");
    console.log(`📁 Testing artifacts in: ${this.distPath}`);

    const testRoutes = [
      { path: "index.html", route: "/", expectedTitle: "Free Customizable Online Tool | Wheel of Life" },
      { path: "about/index.html", route: "/about", expectedTitle: "About Me | Wheel of Life" },
      { path: "for-coaches/index.html", route: "/for-coaches", expectedTitle: "For Coaches | Wheel of Life" },
      { path: "blog/index.html", route: "/blog", expectedTitle: "Blog | Wheel of Life" },
      {
        path: "blog/what-is-the-wheel-of-life/index.html",
        route: "/blog/what-is-the-wheel-of-life",
        expectedTitle: "What Is the Wheel of Life? | Wheel of Life",
      },
    ];

    for (const testRoute of testRoutes) {
      await this.testRoute(testRoute);
    }

    this.printResults();
    return this.errors.length === 0;
  }

  async testRoute({ path, route, expectedTitle }) {
    const filePath = path.join(this.distPath, path);

    try {
      if (!fs.existsSync(filePath)) {
        this.errors.push(`❌ File not found: ${filePath}`);
        return;
      }

      const html = fs.readFileSync(filePath, "utf8");
      const dom = new JSDOM(html);
      const document = dom.window.document;

      // Test title
      const title = document.querySelector("title");
      const titleText = title?.textContent?.trim();

      if (!title || !titleText) {
        this.errors.push(`❌ ${route}: No title found`);
      } else if (titleText !== expectedTitle) {
        this.errors.push(`❌ ${route}: Expected title "${expectedTitle}", got "${titleText}"`);
      } else {
        this.results.push(`✅ ${route}: Title correct - "${titleText}"`);
      }

      // Test meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        this.errors.push(`❌ ${route}: No meta description found`);
      } else {
        const content = metaDescription.getAttribute("content");
        if (!content || content.length < 50) {
          this.errors.push(`❌ ${route}: Meta description too short or empty`);
        } else {
          this.results.push(`✅ ${route}: Meta description present (${content.length} chars)`);
        }
      }

      // Test canonical link
      const canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        this.errors.push(`❌ ${route}: No canonical link found`);
      } else {
        const href = canonical.getAttribute("href");
        if (!href || !href.includes("test.com")) {
          this.errors.push(`❌ ${route}: Invalid canonical URL: ${href}`);
        } else {
          this.results.push(`✅ ${route}: Canonical link present - "${href}"`);
        }
      }

      // Test Open Graph tags
      const ogTitle = document.querySelector('meta[property="og:title"]');
      const ogDescription = document.querySelector('meta[property="og:description"]');
      const ogImage = document.querySelector('meta[property="og:image"]');

      if (!ogTitle) {
        this.errors.push(`❌ ${route}: No og:title found`);
      }
      if (!ogDescription) {
        this.errors.push(`❌ ${route}: No og:description found`);
      }
      if (!ogImage) {
        this.errors.push(`❌ ${route}: No og:image found`);
      }

      if (ogTitle && ogDescription && ogImage) {
        this.results.push(`✅ ${route}: Open Graph tags present`);
      }

      // Test Twitter tags
      const twitterTitle = document.querySelector('meta[property="twitter:title"]');
      const twitterDescription = document.querySelector('meta[property="twitter:description"]');

      if (twitterTitle && twitterDescription) {
        this.results.push(`✅ ${route}: Twitter tags present`);
      }
    } catch (error) {
      this.errors.push(`❌ ${route}: Error reading file - ${error.message}`);
    }
  }

  printResults() {
    console.log("\n📊 Test Results:");
    console.log("================");

    this.results.forEach((result) => console.log(result));

    if (this.errors.length > 0) {
      console.log("\n❌ Errors found:");
      this.errors.forEach((error) => console.log(error));
    }

    console.log(`\n📈 Summary: ${this.results.length} passed, ${this.errors.length} failed`);

    if (this.errors.length === 0) {
      console.log("🎉 All SEO smoke tests passed!");
    } else {
      console.log("💥 Some tests failed. Please check the build output.");
    }
  }

  static async validateUniqueContent() {
    console.log("\n🔍 Validating unique content across pages...");

    const distPath = path.join(__dirname, "..", "dist/wheeloflife/browser");
    const pages = ["index.html", "about/index.html", "for-coaches/index.html", "blog/what-is-the-wheel-of-life/index.html"];

    const titles = new Set();
    const descriptions = new Set();
    let duplicates = 0;

    for (const page of pages) {
      const filePath = path.join(distPath, page);

      if (fs.existsSync(filePath)) {
        const html = fs.readFileSync(filePath, "utf8");
        const dom = new JSDOM(html);
        const document = dom.window.document;

        const title = document.querySelector("title")?.textContent?.trim();
        const description = document.querySelector('meta[name="description"]')?.getAttribute("content");

        if (title) {
          if (titles.has(title)) {
            console.log(`❌ Duplicate title found: "${title}" in ${page}`);
            duplicates++;
          } else {
            titles.add(title);
            console.log(`✅ Unique title: "${title}"`);
          }
        }

        if (description) {
          if (descriptions.has(description)) {
            console.log(`❌ Duplicate description found in ${page}`);
            duplicates++;
          } else {
            descriptions.add(description);
            console.log(`✅ Unique description (${description.length} chars)`);
          }
        }
      }
    }

    console.log(`\n📊 Uniqueness check: ${duplicates === 0 ? "✅ PASSED" : "❌ FAILED"}`);
    return duplicates === 0;
  }
}

// Run tests if this script is called directly
if (require.main === module) {
  const testRunner = new SeoSmokeTest();

  testRunner
    .runTests()
    .then(() => SeoSmokeTest.validateUniqueContent())
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Test runner failed:", error);
      process.exit(1);
    });
}

module.exports = SeoSmokeTest;
