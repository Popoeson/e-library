const axios = require("axios");
const cheerio = require("cheerio");
const { URLSearchParams } = require("url");

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

      // Fix protocol-relative links
      if (link.startsWith("//")) {
        link = "https:" + link;
      }

      // Extract real link if DuckDuckGo redirect
      if (link.includes("/l/?uddg=")) {
        try {
          const params = new URLSearchParams(link.split("/l/?")[1]);
          const realUrl = params.get("uddg");
          if (realUrl) link = decodeURIComponent(realUrl);
        } catch {}
      }

      results.push({
        title,
        link,
        snippet,
        source: "duckduckgo"
      });
    });

    return results;

  } catch (err) {
    console.warn("⚠️ DuckDuckGo search failed:", err.message || err);
    return [];
  }
}

module.exports = { searchDuckDuckGo };