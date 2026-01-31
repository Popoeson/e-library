// services/braveSearch.js
const axios = require("axios");

const BRAVE_API_KEY = process.env.BRAVE_API_KEY;
const BRAVE_SEARCH_URL = process.env.BRAVE_SEARCH_URL;

if (!BRAVE_API_KEY || !BRAVE_SEARCH_URL) {
  console.warn("⚠️ Warning: BRAVE_API_KEY or BRAVE_SEARCH_URL missing.");
}

/**
 * Search the web via Brave Search API
 * @param {string} query - Search query
 * @param {object} opts - Options { limit: number }
 */
async function searchWeb(query, opts = {}) {
  const limit = opts.limit || 10;
  if (!BRAVE_API_KEY || !BRAVE_SEARCH_URL) return [];

  try {
    const resp = await axios.get(BRAVE_SEARCH_URL, {
      params: {
        q: query,
        num: limit,           // ✅ Correct param
        offset: 0             // optional pagination
      },
      headers: {
        "Accept": "application/json",
        "X-Subscription-Token": BRAVE_API_KEY
      },
      timeout: 15000
    });

    const data = resp.data;
    const rawItems = data?.results || []; // Brave returns results here

    return rawItems.slice(0, limit).map(item => {
      const title = item.title || item.headline || "";
      const link = item.url || "";
      const snippet = item.snippet || item.excerpt || "";

      let domain = "";
      try { domain = link ? new URL(link).hostname : ""; } catch {}

      return {
        title,
        link,
        snippet,
        source: item.domain || item.source || domain || "brave",
        type: "web"
      };
    });

  } catch (err) {
    console.error("❌ Brave search error:", err?.response?.data || err.message);
    return [];
  }
}

module.exports = { searchWeb };