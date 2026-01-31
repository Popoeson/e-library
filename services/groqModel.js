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

  // Grab assistant's last content
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

STRICT RULES:
- Rewrite the query to target ONLY the specified subject.
- Use academic and educational keywords.
- Do NOT introduce adjacent or loosely related topics.
- Output ONE rewritten query only.
`
    },
    {
      role: "user",
      content: `Original query: "${query}"\nSubject: "${subject}"\nRewrite the query strictly.`
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
You are an academic tutor generating short summaries for students.

STRICT RULES:
- Stay strictly within the given subject.
- Do NOT introduce unrelated topics.
- Use clear academic language suitable for students.
- Be concise (2–4 sentences).
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
   4️⃣ AI Search Relevance Filtering
========================================================= */
export async function filterResultsByRelevance({ query, subject, results }) {
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
You are an academic relevance filtering engine.

TASK:
- Determine which results are STRICTLY relevant to the subject.
- Accept only academic, educational, research, or instructional material.
- Reject general web content, blogs, news, or opinions.
- Return ONLY a JSON array of accepted IDs.
`
    },
    {
      role: "user",
      content: `Subject: "${subject}"\nQuery: "${query}"\nResults:\n${JSON.stringify(compactResults, null, 2)}\nReturn ONLY array of IDs.`
    }
  ];

  try {
    const raw = await groqChat(messages, { max_tokens: 200 });
    return JSON.parse(raw).map(id => results[id]).filter(Boolean);
  } catch (err) {
    console.warn("⚠️ Groq relevance filter failed, returning unfiltered results.", err.message);
    return results;
  }
}