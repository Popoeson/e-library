const axios = require("axios");

const SERPSTACK_API_KEY = process.env.SERPSTACK_API_KEY;

async function searchSerpstack(query, limit = 5) {
  try {
    const url = `http://api.serpstack.com/search?access_key=${SERPSTACK_API_KEY}&query=${encodeURIComponent(query)}&num=${limit}`;
    
    const resp = await axios.get(url);
    const data = resp.data;

    if (!data || !data.organic_results) return [];

    return data.organic_results.map(item => ({
      title: item.title,
      snippet: item.snippet,
      link: item.url,
      source: "Serpstack"
    }));
  } catch (err) {
    console.error("Serpstack error:", err?.response?.data || err.message);
    return [];
  }
}

module.exports = { searchSerpstack };