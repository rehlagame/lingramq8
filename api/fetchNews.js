// This is a Vercel Serverless Function.
// It will be accessible at your-site.vercel.app/api/fetchNews

export default async function handler(req, res) {
    // Get the secret API key from environment variables
    const API_KEY = process.env.NEWS_API_KEY;

    // Construct the query to get tech and gaming news in Arabic
    const query = encodeURIComponent('ابل أو مايكروسوفت أو جوجل أو انفيديا أو بلايستيشن أو اكسبوكس أو نينتندو أو ألعاب الفيديو أو تقنية');
    const url = `https://newsapi.org/v2/everything?q=${query}&language=ar&sortBy=publishedAt&pageSize=12`;

    try {
        const newsResponse = await fetch(url, {
            headers: {
                'X-Api-Key': API_KEY, // Use the API key in the header for security
            },
        });

        if (!newsResponse.ok) {
            // If NewsAPI returns an error, forward it
            throw new Error(`NewsAPI error: ${newsResponse.statusText}`);
        }

        const newsData = await newsResponse.json();

        // Send the articles back to the front-end
        res.status(200).json(newsData);

    } catch (error) {
        console.error("Error fetching news:", error);
        res.status(500).json({ message: "Failed to fetch news" });
    }
}