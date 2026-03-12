// services/qwenModel.js
/**
 * Wrapper for Qwen via OpenRouter.
 * Handles query rewriting + AI summaries.
 */

const axios = require("axios");

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = process.env.OPENROUTER_API_URL;

if (!OPENROUTER_API_KEY || !OPENROUTER_API_URL) {
  console.warn("⚠️ Warning: OPENROUTER_API_KEY or OPENROUTER_API_URL is missing.");
}

/* =================================================
   QUERY REWRITE
   Makes search queries better for academic sources
================================================= */

async function rewriteQuery(userQuery) {
  userQuery = userQuery?.trim() || "general search";

  if (!OPENROUTER_API_KEY || !OPENROUTER_API_URL) return userQuery;

  try {
    const payload = {
      model: "qwen/qwen-2.5-7b-instruct",
      messages: [
        {
          role: "system",
          content:
            "Rewrite the user query into a concise search query suitable for academic papers, textbooks, lecture notes and PDFs."
        },
        {
          role: "user",
          content: userQuery
        }
      ],
      max_tokens: 80,
      temperature: 0
    };

    const resp = await axios.post(OPENROUTER_API_URL, payload, {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    const output = resp?.data;

    return (
      output?.choices?.[0]?.message?.content?.trim() ||
      userQuery
    );

  } catch (err) {
    console.warn("⚠️ Qwen rewrite error:", err?.message);
    return userQuery;
  }
}


/* =================================================
   AI SUMMARY (based on search results)
================================================= */

async function summarizeTopic(topic, results = []) {

  if (!OPENROUTER_API_KEY || !OPENROUTER_API_URL) return "";

  try {

    const context = results
      .slice(0, 5)
      .map(r => `${r.title || ""}: ${r.snippet || r.description || ""}`)
      .join("\n");

    const payload = {
      model: "qwen/qwen-2.5-7b-instruct",
      messages: [
        {
          role: "system",
          content: `You are an academic teaching assistant.

Explain the topic using the search results.

You MUST format the response EXACTLY like this:

Introduction:
One short paragraph explaining the topic.

Key Concepts:
• Concept 1
• Concept 2
• Concept 3
• Concept 4

Rules:
- Always use bullet points (•)
- Do NOT write everything in one paragraph
- Use clear short explanations
- Keep it suitable for students`
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

module.exports = {
  rewriteQuery,
  summarizeTopic
};