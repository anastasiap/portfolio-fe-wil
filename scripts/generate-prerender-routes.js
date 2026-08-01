const fs = require("fs");
const path = require("path");

/**
 * Script to generate routes for Angular prerendering
 * Reads blog post files and generates route list for angular.json
 */

function generatePrerenderRoutes() {
  const routes = [
    "/",
    "/home",
    "/about",
    "/for-coaches",
    "/plans",
    "/blog",
    "/client-link-not-found",
    // "/personal-plan-premium-offer",
    "/how-personal-plan-works",
  ];

  // Read blog directory and add blog post routes
  const blogDir = path.join(__dirname, "../src/assets/blog");

  try {
    const blogFiles = fs.readdirSync(blogDir).filter((file) => file.endsWith(".md"));

    blogFiles.forEach((file) => {
      const postId = file.replace(".md", "");
      routes.push(`/blog/${postId}`);
    });

    console.log("Generated prerender routes:");
    console.log(JSON.stringify(routes, null, 2));

    return routes;
  } catch (error) {
    console.error("Error reading blog directory:", error);
    return routes; // Return static routes as fallback
  }
}

function updateAngularJson() {
  const angularJsonPath = path.join(__dirname, "../angular.json");

  try {
    const angularJson = JSON.parse(fs.readFileSync(angularJsonPath, "utf8"));
    const routes = generatePrerenderRoutes();

    // Update the prerender routes
    angularJson.projects.wheeloflife.architect.prerender.options.routes = routes;

    // Write back to angular.json
    fs.writeFileSync(angularJsonPath, JSON.stringify(angularJson, null, 2));

    console.log("✅ Updated angular.json with prerender routes");
  } catch (error) {
    console.error("❌ Error updating angular.json:", error);
  }
}

// If this script is run directly
if (require.main === module) {
  updateAngularJson();
}

module.exports = { generatePrerenderRoutes, updateAngularJson };
