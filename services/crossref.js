// services/crossref.js
import fetch from "node-fetch";

export async function searchCrossref(query, limit = 5) {
  try {
    const url = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=${limit}`;
    const res = await fetch(url, { headers: { "User-Agent": "E-Library AI (email@example.com)" } });
    if (!res.ok) throw new Error("Crossref search failed");

    const data = await res.json();
    return (data.message.items || []).map(item => ({
      title: item.title?.[0] || "Untitled",
      link: item.URL || "",
      snippet: item.abstract || "",
      source: "crossref",
      type: "journal",
    }));
  } catch (err) {
    console.error("Crossref Error:", err.message);
    return [];
  }
}