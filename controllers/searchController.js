// controllers/searchController.js
const express = require("express");
const router = express.Router();

const qwen = require("../services/qwenModel");
const brave = require("../services/braveSearch");

/**
 * POST /api/search
 * Body: { query: string, limit?: number, preferPdf?: boolean }
 */
router.post("/", async (req, res) => {
  try {
    const { query, limit = 10, preferPdf = true } = req.body || {};

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "query (string) is required" });
    }

    // STEP 1 — Rewrite query using Qwen for better search accuracy
    let rewritten = query;

    try {
      const suggestion = await qwen.rewriteQuery(query);
      if (suggestion && typeof suggestion === "string" && suggestion.trim().length > 0) {
        rewritten = suggestion.trim();
      }
    } catch (rewriteError) {
      console.warn("Qwen rewrite failed:", rewriteError.message || rewriteError);
    }

    // STEP 2 — Enhance search with PDF preference
    let searchString = rewritten;
    if (preferPdf) {
      searchString = `${rewritten} filetype:pdf`;
    }

    // STEP 3 — Perform Brave Search
    const results = await brave.searchWeb(searchString, { limit });

    // STEP 4 — Return everything to frontend
    return res.json({
      status: "success",
      originalQuery: query,
      rewrittenQuery: rewritten,
      finalSearch: searchString,
      resultsCount: results.length,
      results
    });

  } catch (err) {
    console.error("SEARCH ERROR:", err);

    return res.status(500).json({
      status: "error",
      message: "An error occurred while searching",
      details: err.message || err
    });
  }
});

module.exports = router;