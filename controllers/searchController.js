// controllers/searchController.js
const express = require("express");
const router = express.Router();

const qwen = require("../services/qwenModel");
const brave = require("../services/braveSearch");
const serp = require("../services/serpstackModel");

router.post("/", async (req, res) => {
  try {
    const { query, limit = 15, preferPdf = true } = req.body;

    if (!query) {
      return res.status(400).json({ error: "query is required" });
    }

    // 1. Rewrite query
    let rewritten = query;
    try {
      const s = await qwen.rewriteQuery(query);
      if (s) rewritten = s;
    } catch {}

    // 2. Add pdf filter (optional)
    const finalSearch = preferPdf ? `${rewritten} filetype:pdf` : rewritten;

    // 3. Fetch Serpstack (top priority)
    const serpResults = await serp.searchSerpstack(rewritten, 5);

    // 4. Fetch Brave results
    const braveResults = await brave.searchWeb(finalSearch, { limit });

    // 5. Merge & remove duplicates (by URL)
    const seen = new Set();
    const clean = [];

    const pushUnique = (items) => {
      items.forEach(item => {
        const url = item.link?.toLowerCase();
        if (!url) return;
        if (!seen.has(url)) {
          seen.add(url);
          clean.push(item);
        }
      });
    };

    // Serpstack first
    pushUnique(serpResults);

    // Then Brave
    pushUnique(braveResults);

    // 6. Send to frontend
    return res.json({
      status: "success",
      originalQuery: query,
      rewrittenQuery: rewritten,
      finalSearch,
      resultsCount: clean.length,
      serpCount: serpResults.length,
      braveCount: braveResults.length,
      results: clean
    });

  } catch (err) {
    console.error("Search error:", err);
    return res.status(500).json({
      status: "error",
      message: "Server error",
      details: err.message
    });
  }
});

module.exports = router;