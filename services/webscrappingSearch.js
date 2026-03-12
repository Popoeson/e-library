const axios = require("axios");

const API_KEY = process.env.WEBSCRAPINGAI_KEY;

async function searchWebscraping(query, limit = 10) {
  try {
    const res = await axios.get("https://api.webscraping.ai/search", {
      params: {
        api_key: API_KEY,
        query: query
      }
    });

    const results = res.data.results || [];

    return results.slice(0, limit).map(r => ({
      title: r.title,
      link: r.url,
      snippet: r.snippet || ""
    }));

  } catch (err) {
    console.warn("Webscraping.ai failed:", err.message);
    return [];
  }
}

module.exports = { searchWebscraping };