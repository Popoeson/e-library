// services/arxiv.js
import xml2js from "xml2js";

export async function searchArxiv(query, limit = 5) {
  try {
    const url = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=${limit}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("arXiv search failed");

    const xml = await res.text();
    const result = await xml2js.parseStringPromise(xml, { explicitArray: false });
    const entries = result.feed.entry || [];

    return (Array.isArray(entries) ? entries : [entries]).map(item => ({
      title: item.title,
      link: item.id,
      snippet: item.summary,
      source: "arxiv",
      type: "research",
    }));
  } catch (err) {
    console.error("arXiv Error:", err.message);
    return [];
  }
}