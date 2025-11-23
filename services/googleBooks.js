// services/googleBooks.js
import fetch from "node-fetch";

const GOOGLE_API_KEY = process.env.GOOGLE_BOOKS_KEY || "";

export async function searchGoogleBooks(query, limit = 5) {
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${limit}${GOOGLE_API_KEY ? `&key=${GOOGLE_API_KEY}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Google Books search failed");

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