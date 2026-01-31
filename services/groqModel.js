// services/groqModel.js

const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  throw new Error("❌ GROQ_API_KEY is missing in environment variables");
}

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-70b-versatile";

/* =========================================================
   Shared request helper
========================================================= */
async function groqRequest(messages, options = {}) {
  const response = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: options.temperature ?? 0,
      max_tokens: options.max_tokens ?? 300,
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
   3️⃣ AI Search Relevance Filtering (BATCH MODE)
   ⭐ THIS IS THE IMPORTANT PART ⭐
========================================================= */
async function filterResultsByRelevance({ query, subject, results }) {
  if (!results || results.length === 0) return [];

  // Reduce payload size
  const compactResults = results.map((r, i) => ({
    id: i,
    title: r.title,
    snippet: r.snippet?.slice(0, 200) || ""
  }));

  const messages = [
    {
      role: "system",
      content: `
You are an academic relevance filtering engine.

TASK:
- Determine which results are STRICTLY relevant to the subject.
- Reject anything loosely related, general web content, blogs, news, or opinions.
- Accept ONLY academic, educational, research, or instructional material.

STRICT RULES:
- Be extremely strict.
- If unsure, reject.
- Do NOT explain.
- Return ONLY a JSON array of accepted IDs.

Example output:
[0, 2, 5]
`
    },
    {
      role: "user",
      content: `
Subject: "${subject}"
Search Query: "${query}"

Results:
${JSON.stringify(compactResults, null, 2)}

Return ONLY the array of IDs that are strictly relevant.
`
    }
  ];

  let raw;
  try {
    raw = await groqRequest(messages, {
      temperature: 0,
      max_tokens: 200
    });
  } catch (err) {
    console.warn("⚠️ Groq relevance filter failed. Returning unfiltered results.");
    return results;
  }

  let acceptedIds = [];
  try {
    acceptedIds = JSON.parse(raw);
  } catch {
    console.warn("⚠️ Invalid Groq relevance output:", raw);
    return results;
  }

  return acceptedIds
    .map(id => results[id])
    .filter(Boolean);
}

/* =========================================================
   Exports
========================================================= */
module.exports = {
  rewriteQuery,
  summarizeTopic,
  filterResultsByRelevance
};