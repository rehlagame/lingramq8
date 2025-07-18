// This is a Vercel Serverless Function.
// It will be accessible at your-site.vercel.app/api/fetchNews

export default async function handler(req, res) {
    const API_KEY = process.env.NEWS_API_KEY;

    // --- NEW, MORE RELIABLE URL ---
    // Instead of searching, we get Top Headlines from specific tech sources.
    // This is more likely to work on the free NewsAPI plan from a server.
    const sources = 'the-verge,techcrunch,ars-technica,ign,polygon';
    const url = `https://newsapi.org/v2/top-headlines?country=sa&category=technology&pageSize=20`;
    try {
        const newsResponse = await fetch(url, {
            headers: {
                'X-Api-Key': API_KEY, // Use the API key in the header for security
            },
        });

        if (!newsResponse.ok) {
            const errorBody = await newsResponse.json();
            console.error('NewsAPI Error:', errorBody);
            throw new Error(`NewsAPI error: ${newsResponse.statusText}`);
        }

        const newsData = await newsResponse.json();

        // --- IMPORTANT CHECK ---
        // Log how many articles we received.
        console.log(`Successfully fetched ${newsData.articles.length} articles.`);

        // Send the articles back to the front-end
        res.status(200).json(newsData);

    } catch (error) {
        console.error("Error inside fetchNews function:", error);
        res.status(500).json({ message: "Failed to fetch news", error: error.message });
    }
}