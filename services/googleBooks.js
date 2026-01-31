// services/googleBooks.js
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "";

async function searchGoogleBooks(query, limit = 5) {
  try {
    // 🔐 Google Books hard limits
    const safeLimit = Math.min(Math.max(Number(limit) || 5, 1), 40);

    const url =
      `https://www.googleapis.com/books/v1/volumes` +
      `?q=${encodeURIComponent(query)}` +
      `&maxResults=${safeLimit}` +
      `&printType=books` +
      `&orderBy=relevance` +
      (GOOGLE_API_KEY ? `&key=${GOOGLE_API_KEY}` : "");

    const res = await fetch(url);

    if (!res.ok) {
      const err = await res.text();
      console.error("📕 Google Books Fetch Error:", err);
      return [];
    }

    const data = await res.json();

    if (!Array.isArray(data.items)) return [];

    return data.items.map(item => {
      const volumeInfo = item.volumeInfo || {};

      const rawSnippet =
        volumeInfo.description ||
        volumeInfo.subtitle ||
        "";

      const snippet = rawSnippet
        .replace(/<\/?[^>]+(>|$)/g, "")
        .slice(0, 300) + (rawSnippet.length > 300 ? "…" : "");

      // ISBN-13
      let isbn13 = null;
      if (Array.isArray(volumeInfo.industryIdentifiers)) {
        const isbn = volumeInfo.industryIdentifiers.find(i => i.type === "ISBN_13");
        if (isbn) isbn13 = isbn.identifier;
      }

      return {
        title: volumeInfo.title || "Untitled",
        link: volumeInfo.previewLink || volumeInfo.infoLink || "",
        snippet,
        source: "googlebooks",
        type: "book",
        category: "Books",
        authors: volumeInfo.authors || [],
        published: volumeInfo.publishedDate || null,
        isbn13
      };
    });

  } catch (err) {
    console.error("📕 Google Books Error:", err.message);
    return [];
  }
}

module.exports = { searchGoogleBooks };