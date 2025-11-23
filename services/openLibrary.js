// services/openLibrary.js

export async function searchOpenLibrary(query, limit = 5) {
  try {
    const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${limit}`);
    if (!res.ok) throw new Error("Open Library search failed");

    const data = await res.json();
    return (data.docs || []).map(item => {
      const snippet = item.first_sentence
        ? Array.isArray(item.first_sentence) ? item.first_sentence[0] : item.first_sentence
        : item.subject?.join(", ") || "";

      return {
        title: item.title || "Untitled",
        link: item.key ? `https://openlibrary.org${item.key}` : "",
        snippet: snippet.length > 300 ? snippet.slice(0, 300) + "…" : snippet,
        source: "openlibrary",
        type: "book",
      };
    });
  } catch (err) {
    console.error("Open Library Error:", err.message);
    return [];
  }
}