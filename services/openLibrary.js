// services/openLibrary.js

export async function searchOpenLibrary(query, limit = 5) {
  try {
    const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${limit}`);
    if (!res.ok) throw new Error("Open Library search failed");

    const data = await res.json();

    return (data.docs || []).map(item => {
      // Clean snippet from first_sentence or subjects
      let snippet = "";
      if (item.first_sentence) {
        snippet = Array.isArray(item.first_sentence) ? item.first_sentence[0] : item.first_sentence;
      } else if (item.subject) {
        snippet = item.subject.join(", ");
      }
      snippet = snippet.replace(/<\/?[^>]+(>|$)/g, "").slice(0, 300) + (snippet.length > 300 ? "…" : "");

      // Extract ISBN-13 if available
      let isbn13 = null;
      if (item.isbn) {
        const isbnObj = item.isbn.find(i => i.length === 13);
        if (isbnObj) isbn13 = isbnObj;
      }

      return {
        title: item.title || "Untitled",
        link: item.key ? `https://openlibrary.org${item.key}` : "",
        snippet,
        source: "openlibrary",
        type: "book",
        category: "Books",
        authors: item.author_name || [],
        published: item.first_publish_year || null,
        isbn13
      };
    });
  } catch (err) {
    console.error("Open Library Error:", err.message);
    return [];
  }
}