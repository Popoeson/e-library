const axios = require("axios");
const cheerio = require("cheerio");

async function searchDuckDuckGo(query, limit = 10) {
  try {
    const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

    const res = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });

    const $ = cheerio.load(res.data);
    const results = [];

    $(".result").each((i, el) => {
      if (results.length >= limit) return;

      const title = $(el).find(".result__title a").text().trim();
      let link = $(el).find(".result__title a").attr("href");
      const snippet = $(el).find(".result__snippet").text().trim();

      if (!title || !link) return;

      // Clean redirect links
      if (link.startsWith("//")) {
        link = "https:" + link;
      }

      results.push({
        title,
        link,
        snippet
      });
    });

    return results;

  } catch (err) {
    console.warn("⚠️ DuckDuckGo search failed:", err.message || err);
    return [];
  }
}

module.exports = { searchDuckDuckGo };