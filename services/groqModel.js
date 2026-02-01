// services/groqModel.js
import { Groq } from 'groq-sdk';

const groq = new Groq();
const MODEL = "llama-3.3-70b-versatile";

/* =========================================================
   1️⃣ Generic Chat Completion Helper
========================================================= */
async function groqChat(messages, options = {}) {
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages,
    temperature: options.temperature ?? 0,
    max_completion_tokens: options.max_tokens ?? 300,
    top_p: options.top_p ?? 1
  });

  const lastMessage = completion.choices?.[0]?.message?.content;
  return lastMessage?.trim() || "";
}

/* =========================================================
   2️⃣ Query Rewriting
========================================================= */
export async function rewriteQuery({ query, subject }) {
  const messages = [
    {
      role: "system",
      content: `
You are an academic search assistant.

TASK:
- Rewrite the query to focus on the specified subject.
- Use academic and educational keywords.
- Output ONE concise rewritten query.
`
    },
    {
      role: "user",
      content: `Original query: "${query}"\nSubject: "${subject}"\nRewrite the query.`
    }
  ];

  return await groqChat(messages, { max_tokens: 60 });
}

/* =========================================================
   3️⃣ Topic Summary
========================================================= */
export async function summarizeTopic({ query, subject }) {
  const messages = [
    {
      role: "system",
      content: `
You are an academic tutor generating concise summaries for students.

TASK:
- Stay within the given subject.
- Use clear academic language.
- Keep it short (2–4 sentences).
`
    },
    {
      role: "user",
      content: `Topic: "${query}"\nSubject: "${subject}"\nProvide a concise academic summary.`
    }
  ];

  return await groqChat(messages, { max_tokens: 120, temperature: 0.2 });
}

/* =========================================================
   4️⃣ AI Search Relevance Scoring (robust JSON-safe)
========================================================= */
export async function rankResultsByRelevance({ query, subject, results }) {
  if (!results?.length) return [];

  const compactResults = results.map((r, i) => ({
    id: i,
    title: r.title,
    snippet: r.snippet?.slice(0, 200) || ""
  }));

  const messages = [
    {
      role: "system",
      content: `
You are an academic relevance scoring engine.

RULES:
- Score EVERY result from 0 to 100
- 100 = highly relevant academic material
- 0 = weak or irrelevant
- DO NOT reject results
- OUTPUT JSON ONLY (no markdown, no commentary)

Return format:
[
  { "id": 0, "score": 85 },
  { "id": 1, "score": 62 }
]
`
    },
    {
      role: "user",
      content: `Subject: "${subject}"\nQuery: "${query}"\nResults:\n${JSON.stringify(compactResults, null, 2)}`
    }
  ];

  try {
    let raw = await groqChat(messages, { max_tokens: 300 });

    // 🧹 STRIP MARKDOWN CODE FENCES (```json ... ```)
    raw = raw
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const scored = JSON.parse(raw);

    return results.map((r, i) => {
      const found = scored.find(s => s.id === i);
      return {
        ...r,
        score: typeof found?.score === "number" ? found.score : 0
      };
    });

  } catch (err) {
    console.warn(
      "⚠️ Groq scoring failed, returning unscored results.",
      err.message
    );
    return results.map(r => ({ ...r, score: 0 }));
  }
}