// services/groqModel.js
import { Groq } from "groq-sdk";

const groq = new Groq();
const MODEL = "llama-3.3-70b-versatile";

/* =========================================================
   INTERNAL: Safe Chat Completion
========================================================= */
async function groqChat(messages, options = {}) {
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages,
    temperature: options.temperature ?? 0.1,
    max_completion_tokens: options.max_tokens ?? 400,
    top_p: options.top_p ?? 1
  });

  return completion.choices?.[0]?.message?.content?.trim() || "";
}

/* =========================================================
   INTERNAL: Ultra-safe JSON extraction
========================================================= */
function safeJSONParse(raw) {
  if (!raw) return null;

  try {
    // Remove markdown fences and junk
    const cleaned = raw
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .replace(/^[^\{]*/, "")     // strip leading text
      .replace(/[^\}]*$/, "")     // strip trailing text
      .trim();

    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

/* =========================================================
   1️⃣ Query Rewriting (LOOSE & DISCOVERY-FRIENDLY)
========================================================= */
export async function rewriteQuery({ query, subject }) {
  const messages = [
    {
      role: "system",
      content: `
You improve search queries for an academic search engine.

RULES:
- Do NOT narrow the topic aggressively
- Preserve the user's intent
- Use clear academic or educational phrasing
- Output ONE rewritten query only
`
    },
    {
      role: "user",
      content: `Query: "${query}"\nSubject: "${subject}"`
    }
  ];

  try {
    return await groqChat(messages, { max_tokens: 50 });
  } catch {
    return query;
  }
}

/* =========================================================
   2️⃣ Topic Summary (Structured, student-friendly)
========================================================= */
export async function summarizeTopic({ query, subject }) {
  const messages = [
    {
      role: "system",
      content: `
You are an AI academic assistant.

RULES:
- Provide a short educational summary of the topic.
- Use simple language suitable for students.
- Structure the output EXACTLY like this:

Introduction:
Short explanation of the topic (2-3 sentences).

Key Concepts:
• 3-5 bullet points summarizing the most important ideas.

Do NOT add extra commentary or paragraphs outside this structure.
`
    },
    {
      role: "user",
      content: `Topic: "${query}"\nSubject: "${subject}"`
    }
  ];

  try {
    return await groqChat(messages, {
      max_tokens: 300,
      temperature: 0.3
    });
  } catch {
    return "";
  }
}

/* =========================================================
   3️⃣ AI Relevance Scoring (ROBUST & NON-DESTRUCTIVE)
========================================================= */
export async function rankResultsByRelevance({ query, subject, results }) {
  if (!Array.isArray(results) || results.length === 0) {
    return results || [];
  }

  const compactResults = results.map((r, i) => ({
    id: i,
    title: r.title || "",
    snippet: r.snippet?.slice(0, 180) || "",
    category: r.category || ""
  }));

  const messages = [
    {
      role: "system",
      content: `
You score search results by relevance.

SCORING GUIDELINES:
- Score EVERY result from 0 to 100
- Consider relevance for:
  • academic study
  • learning
  • general knowledge
  • practical or instructional value
- Books, archives, tutorials, overviews are VALID
- Journals are NOT automatically superior
- Do NOT exclude or reject anything

STRICT OUTPUT:
Return ONLY valid JSON array
No markdown
No explanations

Format:
[
  { "id": 0, "score": 78 },
  { "id": 1, "score": 42 }
]
`
    },
    {
      role: "user",
      content: `Query: "${query}"\nSubject: "${subject}"\nResults:\n${JSON.stringify(compactResults)}`
    }
  ];

  let scored = null;

  try {
    const raw = await groqChat(messages, { max_tokens: 500 });
    scored = safeJSONParse(raw);
  } catch {
    scored = null;
  }

  // 🛟 HARD FALLBACK: heuristic relevance
  if (!Array.isArray(scored)) {
    return results.map(r => ({
      ...r,
      score: 50 // neutral score keeps ordering fair
    }));
  }

  return results.map((r, i) => {
    const found = scored.find(s => s.id === i);
    return {
      ...r,
      score: typeof found?.score === "number" ? found.score : 50
    };
  });
}