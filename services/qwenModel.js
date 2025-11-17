// services/qwenModel.js
/**
 * Wrapper for Qwen 2.2 via OpenRouter or compatible API.
 */

const axios = require("axios");

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = process.env.OPENROUTER_API_URL;

if (!OPENROUTER_API_KEY || !OPENROUTER_API_URL) {
  console.warn("⚠️ Warning: OPENROUTER_API_KEY or OPENROUTER_API_URL is missing.");
}

/**
 * rewriteQuery
 * Rewrites user query into a concise search-optimized form.
 */
async function rewriteQuery(userQuery) {
  if (!OPENROUTER_API_KEY || !OPENROUTER_API_URL) return userQuery;

  try {
    const payload = {
      model: "qwen-2.2-instruct", // safer and more stable
      messages: [
        {
          role: "system",
          content:
            "Rewrite the user query into a very concise search query optimized for PDFs, textbooks, lecture notes, and academic resources."
        },
        {
          role: "user",
          content: userQuery
        }
      ],
      max_tokens: 120,
      temperature: 0
    };

    const resp = await axios.post(OPENROUTER_API_URL, payload, {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    const output = resp?.data;

    // ---- Extract content in common response patterns ----
    let text =
      output?.choices?.[0]?.message?.content?.trim?.() ||
      output?.choices?.[0]?.text?.trim?.() ||
      output?.output?.[0]?.content?.text ||
      output?.output?.[0]?.text ||
      output?.result;

    if (text) return text.trim();

    return userQuery;
  } catch (err) {
    console.warn("⚠️ Qwen rewrite error:", err?.response?.data || err.message);
    return userQuery;
  }
}

module.exports = { rewriteQuery };