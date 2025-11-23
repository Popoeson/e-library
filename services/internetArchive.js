// services/internetArchive.js

export async function searchInternetArchive(query, limit = 5) {
  try {
    const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&fl[]=title&fl[]=identifier&fl[]=description&fl[]=mediatype&sort[]=downloads desc&rows=${limit}&output=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Internet Archive search failed");

    const data = await res.json();
    return (data.response.docs || []).map(item => ({
      title: item.title || item.identifier || "Untitled",
      link: item.identifier ? `https://archive.org/details/${item.identifier}` : "",
      snippet: item.description ? item.description.replace(/<\/?[^>]+(>|$)/g, "").slice(0, 300) : "",
      source: "internetarchive",
      type: item.mediatype || "pdf",
    }));
  } catch (err) {
    console.error("Internet Archive Error:", err.message);
    return [];
  }
}