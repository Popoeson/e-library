// services/googleBooks.js
// No import needed — fetch is global in Node 18+

const GOOGLE_API_KEY = process.env.GOOGLE_BOOKS_KEY || "";

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

    return (data.items || []).map(item => ({
      title: item.volumeInfo.title,
      link: item.volumeInfo.previewLink || item.volumeInfo.infoLink,
      snippet: item.volumeInfo.description || item.volumeInfo.subtitle || "",
      source: "googlebooks",
      type: "book",
    }));

  } catch (err) {
    console.error("Google Books Error:", err.message);
    return [];
  }
}

module.exports = { searchGoogleBooks };