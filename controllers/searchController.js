// controllers/searchController.js
const express = require("express");
const router = express.Router();

/* ---------------- AI Layer (Groq) ---------------- */
const groq = require("../services/groqModel");

/* ---------------- Search Services ---------------- */
const brave = require("../services/braveSearch");
const serp = require("../services/serpstackModel");

const googleBooks = require("../services/googleBooks");
const openLibrary = require("../services/openLibrary");
const internetArchive = require("../services/internetArchive");
const crossref = require("../services/crossref");
const arxiv = require("../services/arxiv");
const oer = require("../services/oerCommons");

/* =================================================
   POST /api/search
================================================= */
router.post("/", async (req, res) => {
  try {
    const { query, subject = "general", limit = 15, preferPdf = false } = req.body;

    if (!query) {
      return res.status(400).json({ error: "query is required" });
    }

    /* =================================================
       1️⃣ AI QUERY REWRITE (NON-BLOCKING)
    ================================================= */
    let rewrittenQuery = query;
    try {
      rewrittenQuery = await groq.rewriteQuery({ query, subject });
    } catch (err) {
      console.warn("⚠️ Groq rewrite failed:", err.message);
    }

    /* =================================================
       2️⃣ SEARCH QUERY (NO HARD PDF BIAS)
       🔓 Discovery-first approach
    ================================================= */
    const webQuery = rewrittenQuery; // no filetype forcing

    /* =================================================
       3️⃣ Fetch Results (fault-tolerant)
    ================================================= */
    const safe = async (fn, label) => {
      try {
        return await fn();
      } catch (err) {
        console.warn(`⚠️ ${label} failed:`, err.message || err);
        return [];
      }
    };

    const [
      serpResults,
      braveResults,
      googleBooksResults,
      openLibResults,
      iaResults,
      crossrefResults,
      arxivResults,
      oerResults
    ] = await Promise.all([
      safe(() => serp.searchSerpstack(webQuery, limit), "serpstack"),
      safe(() => brave.searchWeb(webQuery, { limit }), "brave"),
      safe(() => googleBooks.searchGoogleBooks(rewrittenQuery, limit), "googleBooks"),
      safe(() => openLibrary.searchOpenLibrary(rewrittenQuery, limit), "openLibrary"),
      safe(() => internetArchive.searchInternetArchive(rewrittenQuery, limit), "internetArchive"),
      safe(() => crossref.searchCrossref(rewrittenQuery, limit), "crossref"),
      safe(() => arxiv.searchArxiv(rewrittenQuery, limit), "arxiv"),
      safe(() => oer.searchOERCommons(rewrittenQuery, limit), "oer")
    ]);

    /* =================================================
       4️⃣ Merge + De-duplicate + Category tagging
       🔓 No exclusion, no score filtering
    ================================================= */
    const seen = new Set();
    let mergedResults = [];

    const pushUnique = (items = [], category = "Others") => {
      for (const item of items) {
        const key = (item.link || item.id || "").toLowerCase();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        mergedResults.push({
          ...item,
          category
        });
      }
    };

    pushUnique(serpResults, "Web");
    pushUnique(braveResults, "Web");
    pushUnique(googleBooksResults, "Books");
    pushUnique(openLibResults, "Books");
    pushUnique(iaResults, "Archives");
    pushUnique(crossrefResults, "Journals");
    pushUnique(arxivResults, "Journals");
    pushUnique(oerResults, "Others");

    /* =================================================
       5️⃣ Shuffle BEFORE AI ranking
       (prevents service-order bias)
    ================================================= */
    mergedResults = mergedResults.sort(() => Math.random() - 0.5);

    /* =================================================
       6️⃣ AI RELEVANCE SCORING (RANK ONLY)
       ❗ No filtering, no exclusions
    ================================================= */
    try {
      await groq.rankResultsByRelevance({
        query: rewrittenQuery,
        subject,
        results: mergedResults
      });

      mergedResults.sort((a, b) => (b.score || 0) - (a.score || 0));
    } catch (err) {
      console.warn("⚠️ AI ranking failed — keeping discovery order");
    }

    /* =================================================
       7️⃣ AI SUMMARY (Homepage-safe)
    ================================================= */
    let summary = "";
    try {
      summary = await groq.summarizeTopic({ query: rewrittenQuery, subject });
    } catch (err) {
      console.warn("⚠️ Summary generation failed:", err.message || err);
    }

    /* =================================================
       8️⃣ Group by Category (Frontend-friendly)
    ================================================= */
    const categories = ["Web", "Books", "Journals", "Archives", "Others"];
    const resultsByCategory = categories.map(cat => ({
      category: cat,
      results: mergedResults.filter(r => r.category === cat)
    }));

    return res.json({
      status: "success",
      originalQuery: query,
      rewrittenQuery,
      subject,
      summary,
      resultsCount: mergedResults.length,
      sourcesCount: {
        serpstack: serpResults.length,
        brave: braveResults.length,
        googleBooks: googleBooksResults.length,
        openLibrary: openLibResults.length,
        internetArchive: iaResults.length,
        crossref: crossrefResults.length,
        arxiv: arxivResults.length,
        oer: oerResults.length
      },
      results: resultsByCategory
    });

  } catch (err) {
    console.error("❌ Search controller error:", err);
    return res.status(500).json({
      status: "error",
      message: "Search failed",
      details: err.message
    });
  }
});

module.exports = router;