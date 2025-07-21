// api/postToTwitter.js
import { kv } from '@vercel/kv';
import { TwitterApi } from 'twitter-api-v2';

// كلمات مهمة للبحث عن أفضل الأخبار
const IMPORTANT_KEYWORDS = [
    'إطلاق', 'حصريا', 'رسميا', 'رسميًا', 'لأول مرة',
    'الكشف عن', 'اطلاق', 'تعلن', 'جديد', 'عاجل'
];

const LAST_POSTED_KEY = 'last_posted_article';
const LAST_RUN_KEY = 'last_cron_run';

export default async function handler(req, res) {
    // التحقق من طريقة الطلب
    if (req.method !== 'POST' && req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        console.log("🤖 بدء مهمة بوت تويتر...");

        // التحقق من آخر تشغيل لتجنب التكرار
        const lastRun = await kv.get(LAST_RUN_KEY);
        const now = Date.now();
        const twoHours = 2 * 60 * 60 * 1000; // ساعتين بالميلي ثانية

        if (lastRun && (now - lastRun) < twoHours) {
            console.log("⏰ لم تمر ساعتين بعد من آخر تشغيل");
            return res.status(200).json({
                message: "تم التشغيل مؤخراً - انتظار ساعتين"
            });
        }

        // جلب الأخبار
        const articles = await fetchLatestNews();

        if (!articles || articles.length === 0) {
            console.log("❌ لا توجد أخبار متاحة");
            return res.status(200).json({ message: "لا توجد أخبار جديدة" });
        }

        console.log(`📰 تم العثور على ${articles.length} مقال`);

        // اختيار أفضل مقال
        const selectedArticle = selectBestArticle(articles);

        if (!selectedArticle) {
            console.log("❌ لم يتم العثور على مقال مناسب");
            return res.status(200).json({ message: "لا يوجد مقال مناسب للنشر" });
        }

        // التحقق من عدم تكرار النشر
        const lastPosted = await kv.get(LAST_POSTED_KEY);
        if (lastPosted?.url === selectedArticle.url) {
            console.log("🔄 تم نشر هذا المقال مسبقاً");
            return res.status(200).json({ message: "تم نشر هذا المقال مسبقاً" });
        }

        // نشر على تويتر
        console.log(`📤 نشر المقال: ${selectedArticle.title.substring(0, 50)}...`);
        await postToTwitter(selectedArticle);

        // حفظ معلومات آخر نشر وآخر تشغيل
        await kv.set(LAST_POSTED_KEY, {
            url: selectedArticle.url,
            title: selectedArticle.title,
            postedAt: now
        });
        await kv.set(LAST_RUN_KEY, now);

        console.log("✅ تم النشر بنجاح على تويتر");

        return res.status(200).json({
            success: true,
            message: "تم النشر بنجاح",
            article: {
                title: selectedArticle.title,
                source: selectedArticle.source.name
            }
        });

    } catch (error) {
        console.error("❌ خطأ في بوت تويتر:", error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

async function fetchLatestNews() {
    const API_KEY = process.env.NEWS_API_KEY;

    if (!API_KEY) {
        throw new Error("مفتاح NewsAPI مفقود");
    }

    const keywords = [
        'تقنية', 'ألعاب', 'بلايستيشن', 'اكسبوكس',
        'ابل', 'جوجل', 'انفيديا'
    ].join(' OR ');

    const query = encodeURIComponent(keywords);
    const url = `https://newsapi.org/v2/everything?q=${query}&language=ar&sortBy=publishedAt&pageSize=10&from=${new Date(Date.now() - 6*60*60*1000).toISOString()}`;

    const response = await fetch(url, {
        headers: {
            'X-Api-Key': API_KEY,
            'User-Agent': 'LingramQ8-TwitterBot/1.0'
        }
    });

    if (!response.ok) {
        throw new Error(`NewsAPI Error: ${response.status}`);
    }

    const data = await response.json();

    return data.articles?.filter(article =>
        article.title &&
        article.title !== "[Removed]" &&
        article.description &&
        article.url
    ) || [];
}

function selectBestArticle(articles) {
    // البحث عن مقال يحتوي على كلمات مهمة
    let bestArticle = articles.find(article =>
        IMPORTANT_KEYWORDS.some(keyword =>
            article.title?.includes(keyword) ||
            article.description?.includes(keyword)
        )
    );

    // إذا لم نجد مقال مهم، نأخذ الأحدث
    if (!bestArticle) {
        bestArticle = articles[0];
    }

    return bestArticle;
}

async function postToTwitter(article) {
    const twitterClient = new TwitterApi({
        appKey: process.env.TWITTER_API_KEY,
        appSecret: process.env.TWITTER_API_SECRET,
        accessToken: process.env.TWITTER_ACCESS_TOKEN,
        accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    });

    // تحضير النص
    const maxTitleLength = 120;
    let title = article.title;

    if (title.length > maxTitleLength) {
        title = title.substring(0, maxTitleLength) + '...';
    }

    // تكوين التغريدة
    const tweetText = `🚨 ${title}

📖 المصدر: ${article.source.name}

#LingramQ8 #اخبار_تقنية #العاب #تقنية

🔗 ${article.url}`;

    // نشر التغريدة
    const rwClient = twitterClient.readWrite;
    const result = await rwClient.v2.tweet(tweetText);

    console.log("✅ تم نشر التغريدة:", result.data.id);
    return result;
}
