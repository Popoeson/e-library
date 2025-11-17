// backend/services/qwenModel.js
/**
 * qwenModel.js
 * Minimal wrapper to call your OpenRouter (or other) endpoint for Qwen 2.2
 *
 * Requires:
 *   - OPENROUTER_API_KEY
 *   - OPENROUTER_API_URL  (set this to your OpenRouter URL; example shown in .env.example)
 *
 * This wrapper sends a short prompt to rewrite/clarify the user's query for better web searching.
 */

const axios = require('axios');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = process.env.OPENROUTER_API_URL;

if (!OPENROUTER_API_KEY || !OPENROUTER_API_URL) {
  console.warn('OpenRouter API key or URL not set. See backend/.env.example');
}

/**
 * rewriteQuery
 * Asks Qwen to rewrite the user's search into a concise search query
 * @param {string} userQuery
 * @returns {Promise<string>}
 */
async function rewriteQuery(userQuery) {
  if (!OPENROUTER_API_KEY || !OPENROUTER_API_URL) {
    return userQuery;
  }

  try {
    // Example payload for OpenRouter-like chat completions endpoint.
    // If your endpoint requires a different shape, update accordingly.
    const payload = {
      model: "qwen-2.2", // confirm exact model name with OpenRouter dashboard if needed
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that rewrites user queries into concise web search queries. Prefer filetype:pdf when appropriate for academic material."
        },
        {
          role: "user",
          content: `Rewrite the following search request into a concise web search query optimized to find PDFs, textbooks, or lecture notes:\n\n"${userQuery}"`
        }
      ],
      max_tokens: 150,
      temperature: 0.0
    };

    const resp = await axios.post(OPENROUTER_API_URL, payload, {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    // Different APIs return completions in different shapes. Try common patterns:
    const data = resp?.data;
    // attempt to extract text from common completions shapes
    let text = null;
    if (data?.choices && Array.isArray(data.choices) && data.choices[0]) {
      // OpenAI-like
      const ch = data.choices[0];
      text = ch.message?.content?.trim?.() || ch.text?.trim?.();
    } else if (data?.output && Array.isArray(data.output) && data.output[0]) {
      // some routers use output[]
      text = data.output[0].content?.text || data.output[0]?.text;
    } else if (typeof data === 'string') {
      text = data;
    } else if (data?.result) {
      text = data.result;
    }

    if (text && text.length > 0) return text;

    // final fallback - join any string-like fields
    const possible = JSON.stringify(data).slice(0, 500);
    return possible || userQuery;

  } catch (err) {
    console.warn('Qwen rewrite error:', err?.response?.data || err.message || err);
    return userQuery; // fallback to original
  }
}

module.exports = {
  rewriteQuery
};