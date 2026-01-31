// services/groqModel.js

const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  throw new Error("❌ GROQ_API_KEY is missing in environment variables");
}

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instruct";

/* ------------------------------
   Shared request helper
--------------------------------*/
async function groqRequest(messages, options = {}) {
  const response = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: options.temperature ?? 0,
      max_tokens: options.max_tokens ?? 180,
      top_p: options.top_p ?? 1,
      stream: false
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error: ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

/* =========================================================
   1️⃣ Query Rewriting (STRICT subject enforcement)
========================================================= */

async function rewriteQuery({ query, subject }) {
  const messages = [
    {
      role: "system",
      content: `
You are an academic search assistant.

STRICT RULES:
- Rewrite the query to target ONLY the specified subject.
- Use academic and educational keywords.
- Do NOT introduce adjacent or loosely related topics.
- Do NOT explain anything.
- Output ONE rewritten query only.
`
    },
    {
      role: "user",
      content: `
Original query: "${query}"
Subject: "${subject}"

Rewrite the query to strictly match the subject.
`
    }
  ];

  return groqRequest(messages, {
    temperature: 0,
    max_tokens: 60
  });
}

/* =========================================================
   2️⃣ Topic Summary (Homepage AI summary)
========================================================= */

async function summarizeTopic({ query, subject }) {
  const messages = [
    {
      role: "system",
      content: `
You are an academic tutor generating short summaries for students.

STRICT RULES:
- Stay strictly within the given subject.
- Do NOT introduce unrelated or adjacent topics.
- Use clear academic language suitable for students.
- Be concise (2–4 sentences).
- If the topic is unclear or insufficient, say so briefly.
`
    },
    {
      role: "user",
      content: `
Topic: "${query}"
Subject: "${subject}"

Provide a concise academic summary.
`
    }
  ];

  return groqRequest(messages, {
    temperature: 0.2,
    max_tokens: 120
  });
}

/* =========================================================
   3️⃣ (Optional) Relevance Check for Search Results
   Light AI gate — use ONLY if needed
========================================================= */

async function isRelevantResult({ title, snippet, subject }) {
  const messages = [
    {
      role: "system",
      content: `
You are a relevance checker.

STRICT RULES:
- Answer ONLY "YES" or "NO".
- Determine if the result belongs strictly to the subject.
`
    },
    {
      role: "user",
      content: `
Subject: "${subject}"

Title: "${title}"
Snippet: "${snippet}"

Is this result strictly relevant?
`
    }
  ];

  const result = await groqRequest(messages, {
    temperature: 0,
    max_tokens: 3
  });

  return result === "YES";
}

/* =========================================================
   Exports
========================================================= */

module.exports = {
  rewriteQuery,
  summarizeTopic,
  isRelevantResult
};