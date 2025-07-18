// File: /api/postToTwitter.js

import { kv } from '@vercel/kv';
import { TwitterApi } from 'twitter-api-v2';

// The keywords we are looking for to determine an "important" article
const IMPORTANT_KEYWORDS = ['إطلاق', 'حصريا', 'رسميا', 'رسميًا', 'لأول مرة', 'الكشف عن', 'تعلن'];

// Main handler for the Vercel Cron Job
export default async function handler(req, res) {
    // --- 1. Security Check: Ensure this is triggered by Vercel Cron or an authorized user ---
    if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        // --- 2. Fetch latest news from NewsAPI ---
        console.log("Cron job started: Fetching news...");
        const newsData = await fetchNews();

        if (!newsData || newsData.length === 0) {
            console.log("No news found to process.");
            return res.status(200).json({ message: "No news found." });
        }

        // --- 3. Find the best article to post ---
        console.log("Analyzing articles to find the best one...");
        const bestArticle = findBestArticle(newsData);

        if (!bestArticle) {
            console.log("No new, important article found to post.");
            return res.status(200).json({ message: "No new, important article found." });
        }

        // --- 4. Check if we've already posted this article ---
        const lastPostedUrl = await kv.get('last_posted_url');
        if (lastPostedUrl === bestArticle.url) {
            console.log("Best article found has already been posted. Skipping.");
            return res.status(200).json({ message: "Article already posted." });
        }

        // --- 5. Post to Twitter ---
        console.log(`Posting to Twitter: "${bestArticle.title}"`);
        await postToTwitter(bestArticle);

        // --- 6. Save the URL of the posted article to prevent duplicates ---
        await kv.set('last_posted_url', bestArticle.url);
        console.log("Successfully posted and updated last posted URL.");

        return res.status(200).json({ success: true, posted_title: bestArticle.title });

    } catch (error) {
        console.error("An error occurred in the cron job:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

// Helper function to fetch news from NewsAPI
async function fetchNews() {
    const API_KEY = process.env.NEWS_API_KEY;
    const keywords = 'تقنية OR ألعاب OR بلايستيشن OR اكسبوكس OR ابل OR جوجل';
    const query = encodeURIComponent(keywords);
    const url = `https://newsapi.org/v2/everything?q=${query}&language=ar&sortBy=publishedAt&pageSize=10`;

    const response = await fetch(url, { headers: { 'X-Api-Key': API_KEY } });
    if (!response.ok) throw new Error("Failed to fetch from NewsAPI");

    const data = await response.json();
    return data.articles;
}

// Helper function to find the most "important" article
function findBestArticle(articles) {
    // First, look for an article with important keywords
    for (const article of articles) {
        const title = article.title || '';
        if (IMPORTANT_KEYWORDS.some(keyword => title.includes(keyword))) {
            return article; // Return the first article that matches
        }
    }
    // If no "important" article is found, return the newest one (the first in the list)
    return articles[0];
}

// Helper function to post the tweet
async function postToTwitter(article) {
    // Initialize Twitter client with your credentials
    const twitterClient = new TwitterApi({
        appKey: process.env.TWITTER_API_KEY,
        appSecret: process.env.TWITTER_API_SECRET,
        accessToken: process.env.TWITTER_ACCESS_TOKEN,
        accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    });

    // Construct the tweet text
    const tweetText = `
🚨 خبر جديد | ${article.title}

#LingramQ8 #اخبار_تقنية #العاب

اقرأ المزيد: ${article.url}
  `;

    // Post the tweet
    await twitterClient.v2.tweet(tweetText);
}