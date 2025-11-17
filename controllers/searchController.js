// backend/controllers/searchController.js
const express = require('express');
const router = express.Router();
const qwen = require('../services/qwenModel');
const brave = require('../services/braveSearch');

/**
 * POST /api/search
 * body: { query: string, limit?: number, preferPdf?: boolean }
 */
router.post('/', async (req, res) => {
  try {
    const { query, limit = 10, preferPdf = true } = req.body || {};
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'query (string) is required in request body' });
    }

    // 1) Let Qwen rewrite/clarify the user's query to improve search
    let rewritten = query;
    try {
      const suggestion = await qwen.rewriteQuery(query);
      if (suggestion && typeof suggestion === 'string' && suggestion.trim().length > 0) {
        rewritten = suggestion;
      }
    } catch (e) {
      // fail silently — we'll fallback to original query
      console.warn('Qwen rewrite failed:', e.message || e);
    }

    // 2) Compose search string; if preferPdf, add filetype hint
    let searchString = rewritten;
    if (preferPdf) {
      // add filetype hint to favor PDFs
      searchString = `${rewritten} filetype:pdf`;
    }

    // 3) Query Brave Search
    const results = await brave.searchWeb(searchString, { limit });

    // 4) Optionally, for each result, we could call Qwen to produce a short summary.
    // For performance and cost, summarization is optional (not automatic here).
    // In this initial version we return Brave results directly.

    res.json({
      query,
      rewritten,
      searchString,
      count: results.length,
      results
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Server error', details: err.message || err });
  }
});

module.exports = router;
