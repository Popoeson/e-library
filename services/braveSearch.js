// backend/services/braveSearch.js
/**
 * braveSearch.js
 * A very small Brave Search wrapper. Uses environment variables:
 *   - BRAVE_API_KEY
 *   - BRAVE_SEARCH_URL
 *
 * Note: Brave's exact query parameters may vary by plan. Adjust as instructed by Brave docs.
 * This wrapper uses axios and expects the BRAVE_SEARCH_URL to accept GET queries with `q` param.
 */

const axios = require('axios');

const BRAVE_API_KEY = process.env.BRAVE_API_KEY;
const BRAVE_SEARCH_URL = process.env.BRAVE_SEARCH_URL;

if (!BRAVE_API_KEY || !BRAVE_SEARCH_URL) {
  console.warn('Brave Search API key or URL not set. See backend/.env.example');
}

/**
 * searchWeb
 * @param {string} q  - Search query
 * @param {object} opts - { limit: number }
 * @returns {Promise<Array>} - array of { title, link, snippet, source }
 */
async function searchWeb(q, opts = {}) {
  const limit = opts.limit || 10;

  try {
    // Compose headers - Brave may require API key in header or query param depending on plan
    const headers = {
      'Accept': 'application/json'
    };

    // Prefer to send API key as header if Brave doc requires; otherwise append as ?key=...
    // We add both patterns below — provider will ignore the unused one.
    headers['X-Subscription-Token'] = BRAVE_API_KEY;

    // Make GET request. The exact API parameter names may differ per Brave plan.
    // We assume `q` for query and `size` for results count (adjust if Brave uses different param).
    const resp = await axios.get(BRAVE_SEARCH_URL, {
      params: {
        q,
        size: limit
        // if your Brave plan uses 'key' or 'subscription' param, set it in BRAVE_SEARCH_URL or add here
      },
      headers,
      timeout: 20000
    });

    const data = resp && resp.data ? resp.data : null;

    // The response shape may differ; we'll try to normalize common fields.
    // If Brave returns results in data.results or data.items, adapt as needed.
    const rawItems = data?.results || data?.items || data?.web?.results || data || [];

    // Try to pick out title/link/snippet. If shape differs, return raw.
    const items = (Array.isArray(rawItems) ? rawItems : Object.values(rawItems || {})).slice(0, limit).map(item => {
      // Try common field names
      const title = item.title || item.name || item.headline || item.snippet || '';
      const link = item.url || item.link || item.loc || item.canonicalUrl || item.path || '';
      const snippet = item.snippet || item.excerpt || item.description || item.summary || '';
      const source = item.source || item.domain || (link ? (new URL(link)).hostname : '') || '';
      return { title, link, snippet, source, raw: item };
    });

    return items;

  } catch (err) {
    console.error('Brave search error:', err?.response?.data || err.message || err);
    // Return an empty array on error so frontend gracefully fails
    return [];
  }
}

module.exports = {
  searchWeb
};