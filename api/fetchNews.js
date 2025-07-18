export default async function handler(req, res) {
    const API_KEY = process.env.NEWS_API_KEY;

    // --- NEW AND IMPROVED QUERY ---
    // This query is simpler and more effective for finding Arabic tech/gaming news.
    // It searches for specific keywords and sorts by the most recent.
    // We are also specifying the language to be Arabic.
    const keywords = 'تقنية OR ألعاب OR بلايستيشن OR اكسبوكس OR ابل OR جوجل';
    const query = encodeURIComponent(keywords);
    const url = `https://newsapi.org/v2/everything?q=${query}&language=ar&sortBy=publishedAt&pageSize=20`;

    try {
        const newsResponse = await fetch(url, {
            headers: {
                'X-Api-Key': API_KEY,
            },
        });

        if (!newsResponse.ok) {
            const errorBody = await newsResponse.json();
            console.error('NewsAPI Error:', errorBody);
            throw new Error(`NewsAPI error: ${newsResponse.statusText}`);
        }

        const newsData = await newsResponse.json();

        // Important: Filter out articles that might not have a title or image
        const filteredArticles = newsData.articles.filter(article => article.title && article.title !== "[Removed]" && article.urlToImage);

        console.log(`Fetched ${newsData.articles.length} articles, returning ${filteredArticles.length} after filtering.`);

        // Return the filtered articles
        res.status(200).json({ ...newsData, articles: filteredArticles });

    } catch (error) {
        console.error("Error inside fetchNews function:", error);
        res.status(500).json({ message: "Failed to fetch news", error: error.message });
    }
}