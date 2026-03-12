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

async function summarizeTopic(topic, results = []) {
  if (!OPENROUTER_API_KEY || !OPENROUTER_API_URL) return "";

  try {

    // Extract useful info from search results
    const context = results
      .slice(0, 5)
      .map(r => `${r.title || ""}: ${r.snippet || r.description || ""}`)
      .join("\n");

    const payload = {
      model: "qwen/qwen-2.5-7b-instruct",
      messages: [
        {
          role: "system",
          content: `You are an academic assistant.

Use the provided search results to explain the topic clearly.

Structure the response like this:

Introduction:
Short explanation of the topic.

Key Concepts:
• 3–5 bullet points summarizing important ideas.

Use simple language suitable for students.`
        },
        {
          role: "user",
          content: `Topic: ${topic}

Search Results:
${context}`
        }
      ],
      max_tokens: 300,
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