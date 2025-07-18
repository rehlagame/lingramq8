// File: /api/postToTwitter.js
// The final, robust version of the automated Twitter posting function.

import { kv } from '@vercel/kv';
import { TwitterApi } from 'twitter-api-v2';

// Keywords to identify an important article
const IMPORTANT_KEYWORDS = ['إطلاق', 'حصريا', 'رسميا', 'رسميًا', 'لأول مرة', 'الكشف عن','اطلاق',  'تعلن'];
const LAST_POSTED_KEY = 'last_posted_url'; // Use a constant for the database key

// Main handler for the Vercel Cron Job
export default async function handler(req, res) {
    // 1. Security Check: Only allow Vercel's Cron or an authorized user to run this.
    if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        // 2. Fetch latest news from NewsAPI
        console.log("CRON JOB: Task started. Fetching news...");
        const articles = await fetchNews();

        if (!articles || articles.length === 0) {
            console.log("CRON JOB: No news found from API. Task finished.");
            return res.status(200).json({ message: "No news found to process." });
        }

        // 3. Find the best article to post
        console.log(`CRON JOB: Analyzing ${articles.length} articles...`);
        const bestArticle = findBestArticle(articles);

        if (!bestArticle) {
            console.log("CRON JOB: No suitable article found. Task finished.");
            return res.status(200).json({ message: "No suitable article found." });
        }

        // 4. Check for duplicates to avoid re-posting
        const lastPostedUrl = await kv.get(LAST_POSTED_KEY);
        if (lastPostedUrl === bestArticle.url) {
            console.log(`CRON JOB: Best article (${bestArticle.title}) was already posted. Skipping.`);
            return res.status(200).json({ message: "Article already posted." });
        }

        // 5. Post the selected article to Twitter
        console.log(`CRON JOB: Found new article to post: "${bestArticle.title}"`);
        await postToTwitter(bestArticle);

        // 6. Save the new article's URL to the database
        await kv.set(LAST_POSTED_KEY, bestArticle.url);
        console.log("CRON JOB: Successfully posted to Twitter and updated KV store.");

        return res.status(200).json({ success: true, posted_title: bestArticle.title });

    } catch (error) {
        // Enhanced error logging for easier debugging on Vercel
        console.error("--- CRON JOB FAILED ---");
        console.error("Error Message:", error.message);
        if (error.data) { // Twitter API specific errors
            console.error("Twitter API Error Data:", error.data);
        }
        console.error("Error Stack:", error.stack);
        console.error("--- END OF ERROR ---");

        return res.status(500).json({ success: false, error: error.message });
    }
}

// --- Helper Functions ---

async function fetchNews() {
    const API_KEY = process.env.NEWS_API_KEY;
    const keywords = 'تقنية OR ألعاب OR بلايستيشن OR اكسبوكس OR ابل OR جوجل';
    const query = encodeURIComponent(keywords);
    const url = `https://newsapi.org/v2/everything?q=${query}&language=ar&sortBy=publishedAt&pageSize=10`;

    const response = await fetch(url, { headers: { 'X-Api-Key': API_KEY } });
    if (!response.ok) {
        // Log the error response from NewsAPI for more details
        const errorText = await response.text();
        throw new Error(`Failed to fetch from NewsAPI. Status: ${response.status}. Body: ${errorText}`);
    }

    const data = await response.json();
    return data.articles;
}

function findBestArticle(articles) {
    // First, find an article that matches our important keywords
    const importantArticle = articles.find(article =>
        article.title && IMPORTANT_KEYWORDS.some(keyword => article.title.includes(keyword))
    );
    if (importantArticle) return importantArticle;

    // If no "important" article is found, fall back to the newest one
    return articles[0] || null;
}

async function postToTwitter(article) {
    const twitterClient = new TwitterApi({
        appKey: process.env.TWITTER_API_KEY,
        appSecret: process.env.TWITTER_API_SECRET,
        accessToken: process.env.TWITTER_ACCESS_TOKEN,
        accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    });

    // Truncate the title to avoid exceeding Twitter's character limit
    // Max length is approx 150 chars to leave room for other text and the link
    const maxTitleLength = 150;
    const truncatedTitle = article.title.length > maxTitleLength
        ? article.title.substring(0, maxTitleLength) + '...'
        : article.title;

    const tweetText = `
🚨 خبر جديد | ${truncatedTitle}

#LingramQ8 #اخبار_تقنية #العاب

اقرأ المزيد: ${article.url}
  `;

    // Use the read-write client to post a tweet
    const rwClient = twitterClient.readWrite;
    await rwClient.v2.tweet(tweetText);
}