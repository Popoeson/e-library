// services/qwenModel.js
/**
 * Wrapper for Qwen via OpenRouter (or compatible API).
 * Supports query rewriting and topic summarization.
 */

const axios = require("axios");

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = process.env.OPENROUTER_API_URL;

if (!OPENROUTER_API_KEY || !OPENROUTER_API_URL) {
  console.warn("⚠️ Warning: OPENROUTER_API_KEY or OPENROUTER_API_URL is missing.");
}

/**
 * rewriteQuery
 * Rewrites user query into a concise, search-optimized form.
 */
async function rewriteQuery(userQuery) {
  userQuery = userQuery?.trim() || "general search";
  if (!OPENROUTER_API_KEY || !OPENROUTER_API_URL) return userQuery;

  try {
    const payload = {
      model: process.env.QWEN_MODEL || "qwen/qwen-2.5-7b-instruct",
      messages: [
        { role: "system", content: "Rewrite the user query into a concise, search-optimized query for PDFs, textbooks, lecture notes, and academic resources." },
        { role: "user", content: userQuery }
      ],
      max_tokens: 120,
      temperature: 0
    };

    const resp = await axios.post(OPENROUTER_API_URL, payload, {
      headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
      timeout: 10000
    });

    const output = resp?.data;
    return (
      output?.choices?.[0]?.message?.content?.trim() ||
      output?.choices?.[0]?.text?.trim() ||
      output?.output?.[0]?.content?.text ||
      output?.output?.[0]?.text ||
      output?.result ||
      userQuery
    );
  } catch (err) {
    console.warn("⚠️ Qwen rewrite error:", err?.response?.data || err.message);
    return userQuery;
  }
}
/**
 * summarizeTopic
 * Generates a concise AI summary for a given topic/query.
 */
async function summarizeTopic(topic) {
  if (!OPENROUTER_API_KEY || !OPENROUTER_API_URL) return "";

  try {
    const payload = {
      model: "qwen/qwen-2.5-7b-instruct",  // <- Updated model ID
      messages: [
        {
          role: "system",
          content:
            "You are an AI academic assistant. Summarize the following topic in 2–3 concise sentences suitable for students."
        },
        {
          role: "user",
          content: topic
        }
      ],
      max_tokens: 200,
      temperature: 0.3
    };

    const resp = await axios.post(OPENROUTER_API_URL, payload, {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    const output = resp?.data;
    const text =
      output?.choices?.[0]?.message?.content?.trim?.() ||
      output?.choices?.[0]?.text?.trim?.() ||
      output?.output?.[0]?.content?.text ||
      output?.output?.[0]?.text ||
      output?.result;

    return text?.trim() || "";
  } catch (err) {
    console.warn("⚠️ Qwen summary error:", err?.response?.data || err.message);
    return "";
  }
}

module.exports = { rewriteQuery, summarizeTopic };