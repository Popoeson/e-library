// controllers/searchController.js
const express = require("express");
const router = express.Router();

const qwen = require("../services/qwenModel");
const brave = require("../services/braveSearch");
const serp = require("../services/serpstackModel");

const googleBooks = require("../services/googleBooks");
const openLibrary = require("../services/openLibrary");
const internetArchive = require("../services/internetArchive");
// const core = require("../services/coreModel"); // optional
const crossref = require("../services/crossref");
const arxiv = require("../services/arxiv");
const oer = require("../services/oerCommons");

router.post("/", async (req, res) => {
  try {
    const { query, limit = 15, preferPdf = true } = req.body;
    if (!query) {
      return res.status(400).json({ error: "query is required" });
    }

    // 1. Rewrite query using Qwen
    let rewritten = query;
    try {
      const s = await qwen.rewriteQuery(query);
      if (s) rewritten = s;
    } catch (e) {
      console.warn("Qwen rewrite failed:", e.message);
    }

    // 2. Optional PDF filter
    const finalSearch = preferPdf ? `${rewritten} filetype:pdf` : rewritten;

    // 3. Fetch main web results
    const serpResults = await serp.searchSerpstack(rewritten, 5);
    const braveResults = await brave.searchWeb(finalSearch, { limit });

    // 4. Fetch educational sources
    const [
      googleBooksResults,
      openLibResults,
      iaResults,
      // coreResults,
      crossrefResults,
      arxivResults,
      oerResults
    ] = await Promise.all([
      googleBooks.searchGoogleBooks(rewritten, limit),   // FIXED
      openLibrary.searchBooks(rewritten, limit),
      internetArchive.search(rewritten, limit),
      // core.search(rewritten, limit),
      crossref.search(rewritten, limit),
      arxiv.search(rewritten, limit),
      oer.search(rewritten, limit)
    ]);

    // 5. Merge all results with duplication prevention
    const seen = new Set();
    const clean = [];

    const pushUnique = (items) => {
      items?.forEach(item => {
        const url = item.link?.toLowerCase() || item.id?.toLowerCase();
        if (!url) return;
        if (!seen.has(url)) {
          seen.add(url);
          clean.push(item);
        }
      });
    };

    pushUnique(serpResults);
    pushUnique(braveResults);
    pushUnique(googleBooksResults);
    pushUnique(openLibResults);
    pushUnique(iaResults);
    // pushUnique(coreResults);
    pushUnique(crossrefResults);
    pushUnique(arxivResults);
    pushUnique(oerResults);

    // 6. Count results per source
    const sourcesCount = {
      serpstack: serpResults.length,
      brave: braveResults.length,
      googleBooks: googleBooksResults.length,
      openLibrary: openLibResults.length,
      internetArchive: iaResults.length,
      // core: coreResults.length,
      crossref: crossrefResults.length,
      arxiv: arxivResults.length,
      oer: oerResults.length
    };

    // 7. Send final output
    return res.json({
      status: "success",
      originalQuery: query,
      rewrittenQuery: rewritten,
      finalSearch,
      resultsCount: clean.length,
      sourcesCount,
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