// api/fetchNews.js - (v5) الكود النهائي مع قائمة كلمات مضمونة

export default async function handler(req, res) {
    console.log('🟢 fetchNews API called - Tech & Gaming Only [v5 - Final]');

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
        return res.status(500).json({ success: false, message: "خطأ في إعدادات الخادم" });
    }

    try {
        // [!!!] الحل النهائي: قائمة كلمات أوسع لضمان العثور على نتائج
        const techKeywords = [
            // كلمات عامة قوية
            'تقنية', 'تكنولوجيا', 'هاتف', 'كمبيوتر', 'لعبة', 'ألعاب', 'gaming',

            // شركات ومنصات أساسية
            'Apple', 'Google', 'Microsoft', 'NVIDIA', 'Intel',
            'PlayStation', 'Xbox', 'Nintendo',

            // منتجات ومصطلحات شائعة
            'iPhone', 'Android', 'Windows', 'سامسونج', '"ذكاء اصطناعي"', 'AI', 'تحديث'
        ];

        const query = encodeURIComponent(techKeywords.join(' OR '));
        // زيادة نطاق البحث إلى 4 أيام لزيادة فرصة العثور على أخبار
        const fromDate = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

        const url = `https://newsapi.org/v2/everything?q=${query}&language=ar,en&sortBy=publishedAt&pageSize=100&from=${fromDate}`;

        console.log('🔗 Building Final NewsAPI URL:', url.substring(0, 250) + '...');

        const response = await fetch(url, { headers: { 'X-Api-Key': API_KEY, 'User-Agent': 'LingramQ8-Bot/1.4' } });

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
            'سياس', 'حكومة', 'رئيس', 'وزير', 'برلمان', 'انتخابات',
            'حرب', 'صراع', 'نزاع', 'هجوم', 'قصف', 'معاهدة'
        ];

        const filteredArticles = data.articles
            .filter(article => {
                if (!article.title || article.title.includes("[Removed]") || !article.description) return false;
                const titleAndDesc = (article.title + ' ' + article.description).toLowerCase();
                // التأكد من خلوه من الكلمات السياسية
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
            .slice(0, 24);

        console.log(`✅ Articles after filtering: ${filteredArticles.length}`);

        if (filteredArticles.length === 0) {
            return res.status(404).json({
                success: false,
                message: "لا توجد أخبار صالحة للعرض بعد عملية الفلترة.",
            });
        }

        return res.status(200).json({
            success: true,
            articles: filteredArticles,
        });

    } catch (error) {
        console.error("💥 UNHANDLED ERROR in fetchNews:", error);
        return res.status(500).json({ success: false, message: "حدث خطأ غير متوقع في الخادم.", error: error.message });
    }
}
