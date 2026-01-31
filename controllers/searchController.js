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
    const {
      query,
      subject = "general",
      limit = 15,
      preferPdf = true
    } = req.body;

    if (!query) {
      return res.status(400).json({ error: "query is required" });
    }

    /* =================================================
       1️⃣ AI QUERY REWRITE (STRICT SUBJECT LOCK)
    ================================================= */
    let rewrittenQuery = query;
    try {
      rewrittenQuery = await groq.rewriteQuery({ query, subject });
    } catch (err) {
      console.warn("⚠️ Groq rewrite failed:", err.message);
    }

    /* =================================================
       2️⃣ Optional PDF bias (web only)
    ================================================= */
    const finalSearch = preferPdf
      ? `${rewrittenQuery} filetype:pdf`
      : rewrittenQuery;

    /* =================================================
       3️⃣ Fetch Results (fault-tolerant)
    ================================================= */
    const safe = async (fn, label) => {
      try {
        return await fn();
      } catch (err) {
        console.warn(`⚠️ ${label} failed`);
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
      safe(() => serp.searchSerpstack(rewrittenQuery, limit), "serpstack"),
      safe(() => brave.searchWeb(finalSearch, { limit }), "brave"),
      safe(() => googleBooks.searchGoogleBooks(rewrittenQuery, limit), "googleBooks"),
      safe(() => openLibrary.searchOpenLibrary(rewrittenQuery, limit), "openLibrary"),
      safe(() => internetArchive.searchInternetArchive(rewrittenQuery, limit), "internetArchive"),
      safe(() => crossref.searchCrossref(rewrittenQuery, limit), "crossref"),
      safe(() => arxiv.searchArxiv(rewrittenQuery, limit), "arxiv"),
      safe(() => oer.searchOERCommons(rewrittenQuery, limit), "oer")
    ]);

    /* =================================================
       4️⃣ Merge + De-duplicate
    ================================================= */
    const seen = new Set();
    const mergedResults = [];

    const pushUnique = (items = []) => {
      for (const item of items) {
        const key = (item.link || item.id || "").toLowerCase();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        mergedResults.push(item);
      }
    };

    pushUnique(serpResults);
    pushUnique(braveResults);
    pushUnique(googleBooksResults);
    pushUnique(openLibResults);
    pushUnique(iaResults);
    pushUnique(crossrefResults);
    pushUnique(arxivResults);
    pushUnique(oerResults);

    /* =================================================
       5️⃣ AI RELEVANCE FILTERING (STRICT SUBJECT MATCH)
       🔥 THIS IS THE KEY ADDITION
    ================================================= */
    let filteredResults = mergedResults;

    try {
      filteredResults = await groq.filterResultsByRelevance({
        query: rewrittenQuery,
        subject,
        results: mergedResults
      });
    } catch (err) {
      console.warn("⚠️ AI relevance filtering failed — returning raw results");
    }

    /* =================================================
       6️⃣ AI SUMMARY (Homepage use)
    ================================================= */
    let summary = "";
    try {
      summary = await groq.summarizeTopic({
        query: rewrittenQuery,
        subject
      });
    } catch (err) {
      console.warn("⚠️ Summary generation failed");
    }

    /* =================================================
       7️⃣ Response
    ================================================= */
    return res.json({
      status: "success",
      originalQuery: query,
      rewrittenQuery,
      subject,
      finalSearch,
      summary,
      resultsCount: filteredResults.length,
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
      results: filteredResults
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