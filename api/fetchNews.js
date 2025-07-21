// api/fetchNews.js
export default async function handler(req, res) {
    // إضافة CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const API_KEY = process.env.NEWS_API_KEY;

    if (!API_KEY) {
        console.error("مفقود: NEWS_API_KEY");
        return res.status(500).json({
            success: false,
            message: "خطأ في إعدادات الخادم - مفتاح API مفقود"
        });
    }

    try {
        // كلمات البحث المحسّنة للأخبار التقنية والألعاب
        const keywords = [
            'تقنية', 'ألعاب', 'بلايستيشن', 'اكسبوكس',
            'ابل', 'جوجل', 'انفيديا', 'سامسونج', 'هواوي',
            'آيفون', 'اندرويد', 'ذكي'
        ].join(' OR ');

        const query = encodeURIComponent(keywords);
        const url = `https://newsapi.org/v2/everything?q=${query}&language=ar&sortBy=publishedAt&pageSize=15&from=${new Date(Date.now() - 24*60*60*1000).toISOString()}`;

        console.log("جاري جلب الأخبار من:", url);

        const response = await fetch(url, {
            headers: {
                'X-Api-Key': API_KEY,
                'User-Agent': 'LingramQ8-NewsBot/1.0'
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`خطأ من NewsAPI: ${response.status} - ${errorText}`);
            throw new Error(`NewsAPI خطأ: ${response.status}`);
        }

        const data = await response.json();
        console.log(`تم جلب ${data.articles?.length || 0} مقال`);

        // تنظيف وفلترة الأخبار
        const filteredArticles = (data.articles || [])
            .filter(article =>
                article.title &&
                article.title !== "[Removed]" &&
                article.description &&
                article.description !== "[Removed]" &&
                article.urlToImage &&
                article.source?.name
            )
            .map(article => ({
                title: article.title,
                description: article.description,
                url: article.url,
                urlToImage: article.urlToImage,
                publishedAt: article.publishedAt,
                source: article.source
            }));

        console.log(`تم تنظيف ${filteredArticles.length} مقال`);

        return res.status(200).json({
            success: true,
            totalResults: filteredArticles.length,
            articles: filteredArticles
        });

    } catch (error) {
        console.error("خطأ في جلب الأخبار:", error);
        return res.status(500).json({
            success: false,
            message: "فشل في جلب الأخبار",
            error: error.message
        });
    }
}
