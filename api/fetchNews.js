export default async function handler(req, res) {
    const API_KEY = process.env.NEWS_API_KEY;

    // 1. Check if the API key is set
    if (!API_KEY) {
        console.error("CRITICAL: Missing NEWS_API_KEY environment variable.");
        return res.status(500).json({ message: "Server configuration error." });
    }

    // 2. Improved search query with parentheses for better grouping
    const keywords = '(تقنية OR ألعاب) OR (بلايستيشن OR اكسبوكس) OR (ابل OR جوجل OR انفيديا)';
    const query = encodeURIComponent(keywords);
    const url = `https://newsapi.org/v2/everything?q=${query}&language=ar&sortBy=publishedAt&pageSize=20`;

    try {
        const newsResponse = await fetch(url, {
            headers: { 'X-Api-Key': API_KEY },
        });

        if (!newsResponse.ok) {
            throw new Error(`NewsAPI responded with status: ${newsResponse.status}`);
        }

        const newsData = await newsResponse.json();

        // 3. Enhanced filtering to ensure essential data exists
        const filteredArticles = newsData.articles.filter(article =>
            article.title &&
            article.title !== "[Removed]" &&
            article.urlToImage &&
            article.description
        );

        res.status(200).json({ ...newsData, articles: filteredArticles });

    } catch (error) {
        console.error("Error in /api/fetchNews:", error.message);
        res.status(500).json({ message: "Failed to fetch news." });
    }
}
