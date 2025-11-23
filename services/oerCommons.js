// services/oerCommons.js

export async function searchOERCommons(query, limit = 5) {
  try {
    const url = `https://www.oercommons.org/api/v2/search?q=${encodeURIComponent(query)}&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("OER Commons search failed");

    const data = await res.json();
    return (data.data || []).map(item => ({
      title: item.title || "Untitled",
      link: item.url || "",
      snippet: item.description ? item.description.replace(/<\/?[^>]+(>|$)/g, "") : "",
      source: "oercommons",
      type: item.type || "handout",
    }));
  } catch (err) {
    console.error("OER Commons Error:", err.message);
    return [];
  }
}