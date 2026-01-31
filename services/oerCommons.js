// services/oerCommons.js

export async function searchOERCommons(query, limit = 5) {
  try {
    const url = `https://www.oercommons.org/api/v2/search?q=${encodeURIComponent(query)}&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("OER Commons search failed");

    const data = await res.json();
    const items = data.data || [];

    return (items || []).map(item => {
      // Clean snippet
      const snippetRaw = item.description || "";
      const snippet = snippetRaw.replace(/<\/?[^>]+(>|$)/g, "").slice(0, 300) + (snippetRaw.length > 300 ? "…" : "");

      // Authors
      const authors = item.authors ? (Array.isArray(item.authors) ? item.authors : [item.authors]) : [];

      // Published date
      const published = item.date_created || null;

      return {
        title: item.title || "Untitled",
        link: item.url || "",
        snippet,
        source: "oercommons",
        type: item.type || "handout",
        category: "Others",
        authors,
        published
      };
    });

  } catch (err) {
    console.error("OER Commons Error:", err.message);
    return [];
  }
}