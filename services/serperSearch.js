const axios = require("axios");

async function serperSearch(query, limit = 5) {
  try {
    const response = await axios.post(
      "https://google.serper.dev/search",
      {
        q: query,
        num: limit
      },
      {
        headers: {
          "X-API-KEY": process.env.SERPER_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    if (!response.data?.organic) return [];

    return response.data.organic.map(item => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      source: "Google (Serper)"
    }));
  } catch (error) {
    console.error("Serper error:", error.message);
    return [];
  }
}

module.exports = serperSearch;