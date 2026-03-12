const axios = require("axios");

const API_KEY = process.env.APILAYER_KEY;

async function searchApilayer(query, limit = 10) {
  try {
    const res = await axios.get("https://api.apilayer.com/google_search", {
      params: { q: query },
      headers: {
        apikey: API_KEY
      }
    });

    const results = res.data.organic_results || [];

    return results.slice(0, limit).map(r => ({
      title: r.title,
      link: r.link,
      snippet: r.snippet || ""
    }));

  } catch (err) {
    console.warn("ApiLayer search failed:", err.message);
    return [];
  }
}

module.exports = { searchApilayer };