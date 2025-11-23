// services/braveSearch.js
/**
 * Wrapper for Brave Search API
 */

const axios = require("axios");

const BRAVE_API_KEY = process.env.BRAVE_API_KEY;
const BRAVE_SEARCH_URL = process.env.BRAVE_SEARCH_URL;

if (!BRAVE_API_KEY || !BRAVE_SEARCH_URL) {
  console.warn("⚠️ Warning: BRAVE_API_KEY or BRAVE_SEARCH_URL missing.");
}

async function searchWeb(q, opts = {}) {
  const limit = opts.limit || 10;
  if (!BRAVE_API_KEY || !BRAVE_SEARCH_URL) return [];

  try {
    const resp = await axios.get(BRAVE_SEARCH_URL, {
      params: { q, count: limit },
      headers: {
        "Accept": "application/json",
        "X-Subscription-Token": BRAVE_API_KEY
      },
      timeout: 15000
    });

    const data = resp?.data;
    const rawItems = data?.web?.results || data?.results || data?.items || [];

    return rawItems.slice(0, limit).map(item => {
      const title = item.title || item.name || item.headline || item.snippet || "";
      const link = item.url || item.link || item.canonical || item.canonicalUrl || "";
      const snippet = item.snippet || item.excerpt || item.description || item.summary || "";

      let domain = "";
      try { domain = link ? new URL(link).hostname : ""; } catch {}

      const source = item.domain || item.source || domain;

      return { title, link, snippet, source, type: "web" };
    });

  } catch (err) {
    console.error("❌ Brave search error:", err?.response?.data || err.message);
    return [];
  }
}

module.exports = { searchWeb };