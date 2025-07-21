// api/fetchNews.js - (v4) الكود النهائي مع قائمة كلمات متوازنة

export default async function handler(req, res) {
    console.log('🟢 fetchNews API called - Tech & Gaming Only [v4 - Balanced]');

    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const API_KEY = process.env.NEWS_API_KEY;
    if (!API_KEY) {
        console.error("❌ CRITICAL: Missing NEWS_API_KEY");
        return res.status(500).json({ success: false, message: "خطأ في إعدادات الخادم - مفتاح API مفقود" });
    }

    try {
        console.log('🎮 Fetching tech & gaming news...');

        // [!!!] إصلاح نهائي: قائمة كلمات مفتاحية متوازنة - واسعة بما يكفي للعثور على نتائج وقصيرة بما يكفي لتجنب الأخطاء
        const techKeywords = [
            // كلمات عامة وقوية
            'تقنية', 'تكنولوجيا', 'ألعاب', 'gaming',

            // شركات ومنصات كبرى (استخدام "" يزيد الدقة)
            'Apple', 'Google', '"مايكروسوفت"', 'NVIDIA', 'AMD', 'Intel',
            'بلايستيشن', 'PlayStation', 'اكسبوكس', 'Xbox', 'Nintendo',

            // منتجات ومصطلحات شائعة
            'آيفون', 'iPhone', 'سامسونج', 'هواوي', 'شاومي', '"ذكاء اصطناعي"',
            'AI', 'تسريبات', 'تحديث'
        ];

        const query = encodeURIComponent(techKeywords.join(' OR '));
        const fromDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10); // زيادة نطاق البحث إلى 3 أيام

        const url = `https://newsapi.org/v2/everything?q=${query}&language=ar,en&sortBy=publishedAt&pageSize=100&from=${fromDate}`;

        console.log('🔗 Building NewsAPI URL:', url.slice(0, 200) + '...');

        const response = await fetch(url, { headers: { 'X-Api-Key': API_KEY, 'User-Agent': 'LingramQ8-Bot/1.3' } });

        console.log('📊 NewsAPI Response Status:', response.status);

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(`NewsAPI error ${response.status}: ${errorBody.message || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log(`📈 Raw articles received: ${data.articles?.length || 0}`);

        if (!data.articles || data.articles.length === 0) {
            return res.status(404).json({
                success: false,
                message: "لم يتم العثور على أخبار تقنية جديدة بالمصادر حالياً، حاول لاحقاً.",
            });
        }

        const politicalKeywords = [
            'سياس', 'حكومة', 'رئيس', 'وزير', 'برلمان', 'انتخابات', 'دستور',
            'حرب', 'صراع', 'نزاع', 'هجوم', 'قصف', 'معاهدة', 'دبلوماس'
        ];

        const filteredArticles = data.articles
            .filter(article => {
                if (!article.title || article.title === "[Removed]" || !article.description) return false;
                const titleAndDesc = (article.title + ' ' + article.description).toLowerCase();
                return !politicalKeywords.some(keyword => titleAndDesc.includes(keyword));
            })
            .map(article => ({
                title: article.title.trim(),
                description: article.description.trim(),
                url: article.url,
                urlToImage: article.urlToImage || null,
                publishedAt: article.publishedAt,
                source: article.source
            }))
            .slice(0, 20);

        console.log(`✅ Articles after filtering: ${filteredArticles.length}`);

        if (filteredArticles.length === 0) {
            return res.status(404).json({
                success: false,
                message: "لا توجد أخبار صالحة للعرض بعد عملية الفلترة.",
            });
        }

        return res.status(200).json({
            success: true,
            source: 'newsapi_tech_gaming_v4_balanced',
            totalResults: filteredArticles.length,
            articles: filteredArticles,
        });

    } catch (error) {
        console.error("💥 UNHANDLED ERROR in fetchNews:", error);
        return res.status(500).json({ success: false, message: "حدث خطأ غير متوقع في الخادم.", error: error.message });
    }
}
