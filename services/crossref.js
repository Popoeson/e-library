// services/crossref.js

export async function searchCrossref(query, limit = 5) {
  try {
    const url = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=${limit}`;
    const res = await fetch(url, { headers: { "User-Agent": "E-Library AI (email@example.com)" } });
    if (!res.ok) throw new Error("Crossref search failed");

    const data = await res.json();
    return (data.message.items || []).map(item => ({
      title: item.title?.[0] || "Untitled",
      link: item.URL || (item.DOI ? `https://doi.org/${item.DOI}` : ""),
      snippet: item.abstract ? item.abstract.replace(/<\/?[^>]+(>|$)/g, "") : "",
      source: "crossref",
      type: "journal",
    }));
  } catch (err) {
    console.error("Crossref Error:", err.message);
    return [];
  }
}