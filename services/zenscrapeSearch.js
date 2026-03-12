const axios = require("axios");

const API_KEY = process.env.ZENSCRAPE_KEY;

async function searchZenscrape(query, limit = 10) {
  try {
    const res = await axios.get("https://app.zenscrape.com/api/v1/search", {
      params: {
        apikey: API_KEY,
        q: query
      }
    });

    const results = res.data.results || [];

    return results.slice(0, limit).map(r => ({
      title: r.title,
      link: r.url,
      snippet: r.description || ""
    }));

  } catch (err) {
    console.warn("Zenscrape failed:", err.message);
    return [];
  }
}

module.exports = { searchZenscrape };