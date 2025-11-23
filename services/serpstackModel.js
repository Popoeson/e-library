const axios = require("axios");

const SERPSTACK_API_KEY = process.env.SERPSTACK_API_KEY;

async function searchSerpstack(query, limit = 5) {
  if (!SERPSTACK_API_KEY) {
    console.warn("⚠️ SERPSTACK_API_KEY missing. Returning empty results.");
    return [];
  }

  try {
    const url = `http://api.serpstack.com/search?access_key=${SERPSTACK_API_KEY}&query=${encodeURIComponent(query)}&num=${limit}`;
    const resp = await axios.get(url);
    const data = resp.data;

    if (!data || !data.organic_results) return [];

    return data.organic_results.map(item => ({
      title: item.title || "Untitled",
      snippet: item.snippet || "",
      link: item.url || "",
      source: "serpstack",
      type: "web"
    }));

  } catch (err) {
    console.error("Serpstack error:", err?.response?.data || err.message);
    return [];
  }
}

module.exports = { searchSerpstack };