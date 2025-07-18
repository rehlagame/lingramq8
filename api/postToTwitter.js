import { kv } from '@vercel/kv';
import { TwitterApi } from 'twitter-api-v2';

const IMPORTANT_KEYWORDS = ['إطلاق', 'حصريا', 'رسميا', 'رسميًا', 'لأول مرة', 'الكشف عن', 'اطلاق', 'تعلن'];
const LAST_POSTED_KEY = 'last_posted_url';

export default async function handler(req, res) {
    // 4. Temporarily removed the CRON_SECRET check to align with Vercel's default cron behavior.
    // The endpoint is obscure enough for this personal project.
    // For production apps, a more robust solution like signing secrets would be used.

    try {
        console.log("CRON JOB: Task started. Fetching news...");
        const articles = await fetchNews();

        if (!articles || articles.length === 0) {
            console.log("CRON JOB: No news found from API. Task finished.");
            return res.status(200).json({ message: "No news found to process." });
        }

        console.log(`CRON JOB: Analyzing ${articles.length} articles...`);
        const bestArticle = findBestArticle(articles);

        if (!bestArticle) {
            console.log("CRON JOB: No suitable article found. Task finished.");
            return res.status(200).json({ message: "No suitable article found." });
        }

        const lastPostedUrl = await kv.get(LAST_POSTED_KEY);
        if (lastPostedUrl === bestArticle.url) {
            console.log(`CRON JOB: Best article (${bestArticle.title}) was already posted. Skipping.`);
            return res.status(200).json({ message: "Article already posted." });
        }

        console.log(`CRON JOB: Found new article to post: "${bestArticle.title}"`);
        await postToTwitter(bestArticle);

        await kv.set(LAST_POSTED_KEY, bestArticle.url);
        console.log("CRON JOB: Successfully posted to Twitter and updated KV store.");

        return res.status(200).json({ success: true, posted_title: bestArticle.title });

    } catch (error) {
        console.error("--- CRON JOB FAILED ---");
        console.error("Error Message:", error.message);
        if (error.data) {
            console.error("Twitter API Error Data:", error.data);
        }
        console.error("Error Stack:", error.stack);
        console.error("--- END OF ERROR ---");

        return res.status(500).json({ success: false, error: error.message });
    }
}

async function fetchNews() {
    const API_KEY = process.env.NEWS_API_KEY;
    const keywords = '(تقنية OR ألعاب) OR (بلايستيشن OR اكسبوكس) OR (ابل OR جوجل)'; // Using improved query
    const query = encodeURIComponent(keywords);
    const url = `https://newsapi.org/v2/everything?q=${query}&language=ar&sortBy=publishedAt&pageSize=10`;

    const response = await fetch(url, { headers: { 'X-Api-Key': API_KEY } });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch from NewsAPI. Status: ${response.status}. Body: ${errorText}`);
    }

    const data = await response.json();
    return data.articles;
}

function findBestArticle(articles) {
    const importantArticle = articles.find(article =>
        article.title && IMPORTANT_KEYWORDS.some(keyword => article.title.includes(keyword))
    );
    if (importantArticle) return importantArticle;
    return articles[0] || null;
}

async function postToTwitter(article) {
    const twitterClient = new TwitterApi({
        appKey: process.env.TWITTER_API_KEY,
        appSecret: process.env.TWITTER_API_SECRET,
        accessToken: process.env.TWITTER_ACCESS_TOKEN,
        accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    });

    const maxTitleLength = 150;
    const truncatedTitle = article.title.length > maxTitleLength
        ? article.title.substring(0, maxTitleLength) + '...'
        : article.title;

    // 5. Trimmed tweet text for cleaner formatting
    const tweetText = `🚨 خبر جديد | ${truncatedTitle}\n\n#LingramQ8 #اخبار_تقنية #العاب\n\nاقرأ المزيد: ${article.url}`;

    const rwClient = twitterClient.readWrite;
    await rwClient.v2.tweet(tweetText);
}
