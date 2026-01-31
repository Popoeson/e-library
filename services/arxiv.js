// services/arxiv.js
import xml2js from "xml2js";

/**
 * Searches arXiv for academic papers matching the query.
 * @param {string} query - Search query
 * @param {number} limit - Number of results to fetch
 * @returns {Array} Array of results with metadata
 */
export async function searchArxiv(query, limit = 5) {
  try {
    const url = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=${limit}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("arXiv search failed");

    const xml = await res.text();
    const result = await xml2js.parseStringPromise(xml, { explicitArray: false });
    const entries = result.feed.entry || [];

    return (Array.isArray(entries) ? entries : [entries]).map(item => {
      // Clean abstract / summary
      const snippet = item.summary ? item.summary.replace(/[\n\r]+/g, " ").trim().slice(0, 300) + "…" : "";

      // Extract DOI if available
      const doiLink = item["arxiv:doi"] ? `https://doi.org/${item["arxiv:doi"]}` : null;

      return {
        title: item.title?.replace(/[\n\r]+/g, " ").trim() || "Untitled",
        link: doiLink || item.id, // Prefer DOI link if available
        snippet,
        source: "arxiv",
        type: "research",
        doi: item["arxiv:doi"] || null,
        published: item.published || null,
        authors: item.author
          ? Array.isArray(item.author)
            ? item.author.map(a => a.name)
            : [item.author.name]
          : [],
      };
    });
  } catch (err) {
    console.error("arXiv Error:", err.message);
    return [];
  }
}