export default async function handler(req, res) {
    const API_KEY = process.env.NEWS_API_KEY;

    // The final, robust query for Arabic tech and gaming news
    const keywords = 'تقنية OR ألعاب OR بلايستيشن OR اكسبوكس OR ابل OR جوجل OR انفيديا';
    const query = encodeURIComponent(keywords);
    const url = `https://newsapi.org/v2/everything?q=${query}&language=ar&sortBy=publishedAt&pageSize=20`;

    try {
        const newsResponse = await fetch(url, {
            headers: {
                'X-Api-Key': API_KEY,
            },
        });

        if (!newsResponse.ok) {
            throw new Error(`NewsAPI responded with status: ${newsResponse.status}`);
        }

        const newsData = await newsResponse.json();

        // Filter out articles without a title or image to keep the UI clean
        const filteredArticles = newsData.articles.filter(article => article.title && article.title !== "[Removed]" && article.urlToImage);

        // Return the filtered articles
        res.status(200).json({ ...newsData, articles: filteredArticles });

    } catch (error) {
        console.error("Error fetching news:", error.message);
        res.status(500).json({ message: "Failed to fetch news" });
    }
}
