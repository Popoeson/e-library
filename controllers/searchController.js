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

    // STEP 2 — Optionally enhance search for PDFs
    const searchString = preferPdf ? `${rewritten} filetype:pdf` : rewritten;

    // STEP 3 — Perform Brave Search
    const results = await brave.searchWeb(searchString, { limit });

    // STEP 4 — Fetch AI topic summary
    let summary = "";
    try {
      const summaryResponse = await qwen.summarizeTopic(rewritten); // make sure your qwenModel has this method
      if (summaryResponse && typeof summaryResponse === "string") {
        summary = summaryResponse.trim();
      }
    } catch (summaryError) {
      console.warn("Qwen summary failed:", summaryError.message || summaryError);
    }

    // STEP 5 — Return everything to frontend
    return res.json({
      status: "success",
      originalQuery: query,
      rewrittenQuery: rewritten,
      finalSearch: searchString,
      summary,           // <-- send AI overview to frontend
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