// services/internetArchive.js

export async function searchInternetArchive(query, limit = 5) {
  try {
    const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&fl[]=title&fl[]=creator&fl[]=description&fl[]=mediatype&fl[]=date&sort[]=downloads desc&rows=${limit}&output=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Internet Archive search failed");

    const data = await res.json();
    const docs = data.response.docs || [];

    // Optional: filter results to match query keywords in title or description
    const keywords = query.toLowerCase().split(/\s+/);

    const filteredDocs = docs.filter(item => {
      const text = ((item.title || "") + " " + (item.description || "")).toLowerCase();
      return keywords.every(kw => text.includes(kw));
    });

    return (filteredDocs || []).map(item => {
      // Clean snippet
      const snippetRaw = item.description || "";
      const snippet = snippetRaw.replace(/<\/?[^>]+(>|$)/g, "").slice(0, 300) + (snippetRaw.length > 300 ? "…" : "");

      return {
        title: item.title || item.identifier || "Untitled",
        link: item.identifier ? `https://archive.org/details/${item.identifier}` : "",
        snippet,
        source: "internetarchive",
        type: item.mediatype || "pdf",
        category: "Archives",
        authors: item.creator ? (Array.isArray(item.creator) ? item.creator : [item.creator]) : [],
        published: item.date || null
      };
    });

  } catch (err) {
    console.error("Internet Archive Error:", err.message);
    return [];
  }
}