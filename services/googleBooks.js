// services/googleBooks.js
// No import needed — fetch is global in Node 18+

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "";

async function searchGoogleBooks(query, limit = 5) {
  try {
    const url =
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}` +
      `&maxResults=${limit}` +
      (GOOGLE_API_KEY ? `&key=${GOOGLE_API_KEY}` : "");

    const res = await fetch(url);
    if (!res.ok) {
      console.error("Google Books Fetch Error:", res.status, res.statusText);
      throw new Error("Google Books search failed");
    }

    const data = await res.json();

    return (data.items || []).map(item => {
      const volumeInfo = item.volumeInfo || {};

      // Clean snippet / description
      const snippetRaw = volumeInfo.description || volumeInfo.subtitle || "";
      const snippet = snippetRaw.replace(/<\/?[^>]+(>|$)/g, "").slice(0, 300) + (snippetRaw.length > 300 ? "…" : "");

      // Extract ISBN-13 if available
      let isbn13 = null;
      if (volumeInfo.industryIdentifiers) {
        const isbnObj = volumeInfo.industryIdentifiers.find(i => i.type === "ISBN_13");
        if (isbnObj) isbn13 = isbnObj.identifier;
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
    console.error("Google Books Error:", err.message);
    return [];
  }
}

module.exports = { searchGoogleBooks };