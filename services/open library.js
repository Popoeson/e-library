// services/openLibrary.js
import fetch from "node-fetch";

export async function searchOpenLibrary(query, limit = 5) {
  try {
    const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${limit}`);
    if (!res.ok) throw new Error("Open Library search failed");

    const data = await res.json();
    return data.docs.map(item => ({
      title: item.title,
      link: item.key ? `https://openlibrary.org${item.key}` : "",
      snippet: item.first_sentence?.[0] || item.subject?.join(", ") || "",
      source: "openlibrary",
      type: "book",
    }));
  } catch (err) {
    console.error("Open Library Error:", err.message);
    return [];
  }
}