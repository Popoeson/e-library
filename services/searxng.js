const axios = require("axios");

const SEARXNG_URL = process.env.SEARXNG_URL;
// example: https://elibrary-searxng.onrender.com

if (!SEARXNG_URL) {
  console.warn("⚠️ SEARXNG_URL is not set in environment variables");
}

/* =====================================================
   Search via SearxNG (Meta Web Search)
===================================================== */
async function searchSearxNG(query, options = {}) {
  const {
    limit = 20,
    language = "en",
    safesearch = 0
  } = options;

  try {
    const response = await axios.get(`${SEARXNG_URL}/search`, {
      params: {
        q: query,
        format: "json",
        language,
        safesearch,
        categories: "general"
      },
      timeout: 12000
    });

    const results = response.data?.results || [];

    return results.slice(0, limit).map(item => ({
      title: item.title || "Untitled",
      snippet: item.content || item.snippet || "",
      link: item.url,
      source: item.engine || "searxng",
      engine: item.engine,
      category: "Web",
      type: "web"
    }));

  } catch (err) {
    console.error(
      "❌ SearxNG search failed:",
      err.response?.data || err.message
    );
    return [];
  }
}

module.exports = {
  searchSearxNG
};