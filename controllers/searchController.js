// controllers/searchController.js
const express = require("express");
const router = express.Router();

/* ---------------- AI Layer (Groq) ---------------- */
const groq = require("../services/groqModel");

/* ---------------- Search Services ---------------- */
const brave = require("../services/braveSearch");
const serp = require("../services/serpstackModel");
const serperSearch = require("../services/serperSearch"); // ✅ FUNCTION import

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
       1️⃣ AI QUERY REWRITE (journals bias only)
    ================================================= */
    let rewrittenQuery = query;
    try {
      rewrittenQuery = await groq.rewriteQuery({ query, subject });
    } catch {
      console.warn("⚠️ Groq rewrite failed, using original query");
    }

    /* =================================================
       2️⃣ Web query (optional PDF bias)
    ================================================= */
    const webQuery = preferPdf ? `${query} filetype:pdf` : query;

    /* =================================================
       3️⃣ Safe wrapper (isolated failure)
    ================================================= */
    const safe = async (fn, label) => {
      try {
        return await fn();
      } catch (err) {
        console.warn(`⚠️ ${label} failed:`, err.message || err);
        return [];
      }
    };

    /* =================================================
       4️⃣ Fetch results (parallel, multi-source)
    ================================================= */
    const [
      serpResults,
      braveResults,
      serperResults,

      googleBooksResults,
      openLibResults,

      iaResults,

      crossrefResults,
      arxivResults,

      oerResults
    ] = await Promise.all([
      // 🌐 WEB (multi-engine)
      safe(() => serp.searchSerpstack(webQuery, limit * 2), "serpstack"),
      safe(() => brave.searchWeb(webQuery, { limit: limit * 2 }), "brave"),
      safe(() => serperSearch(webQuery, limit * 2), "serper"),

      // 📚 BOOKS
      safe(() => googleBooks.searchGoogleBooks(query, limit), "googleBooks"),
      safe(() => openLibrary.searchOpenLibrary(query, limit), "openLibrary"),

      // 🏛 ARCHIVES
      safe(() => internetArchive.searchInternetArchive(query, limit), "internetArchive"),

      // 📑 JOURNALS
      safe(() => crossref.searchCrossref(rewrittenQuery, limit * 2), "crossref"),
      safe(() => arxiv.searchArxiv(rewrittenQuery, limit), "arxiv"),

      // 🎓 OER
      safe(() => oer.searchOERCommons(query, limit), "oer")
    ]);

    /* =================================================
       5️⃣ Merge + De-duplicate + Category tagging
    ================================================= */
    const seen = new Set();
    const mergedResults = [];

    const pushUnique = (items = [], category) => {
      for (const item of items) {
        const key = (item.link || item.id || item.title || "").toLowerCase().trim();
        if (!key || seen.has(key)) continue;
        seen.add(key);

        mergedResults.push({
          ...item,
          category
        });
      }
    };

    // 🌐 WEB
    pushUnique(serpResults, "Web");
    pushUnique(braveResults, "Web");
    pushUnique(serperResults, "Web");

    // 📚 BOOKS
    pushUnique(googleBooksResults, "Books");
    pushUnique(openLibResults, "Books");

    // 🏛 ARCHIVES
    pushUnique(iaResults, "Archives");

    // 📑 JOURNALS
    pushUnique(crossrefResults, "Journals");
    pushUnique(arxivResults, "Journals");

    // 🎓 OTHERS
    pushUnique(oerResults, "Others");

    /* =================================================
       6️⃣ AI RELEVANCE RANKING (no filtering)
    ================================================= */
    try {
      const ranked = await groq.rankResultsByRelevance({
        query,
        subject,
        results: mergedResults
      });

      mergedResults.length = 0;
      mergedResults.push(
        ...ranked.sort((a, b) => (b.score || 0) - (a.score || 0))
      );
    } catch {
      console.warn("⚠️ AI ranking failed — keeping original order");
    }

    /* =================================================
       7️⃣ AI SUMMARY
    ================================================= */
    let summary = "";
    try {
      summary = await groq.summarizeTopic({ query, subject });
    } catch {
      console.warn("⚠️ Summary generation failed");
    }

    /* =================================================
       8️⃣ Group for frontend breadcrumbs
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
        serper: serperResults.length,
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