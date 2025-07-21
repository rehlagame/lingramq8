// api/fetchNews.js - أخبار تقنية وألعاب فقط (كود محسّن ومصحح v3)

export default async function handler(req, res) {
    console.log('🟢 fetchNews API called - Tech & Gaming Only [v3]');

    // إضافة CORS headers للسماح بالطلبات من أي مصدر
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // معالجة طلبات OPTIONS pre-flight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const API_KEY = process.env.NEWS_API_KEY;
    if (!API_KEY) {
        console.error("❌ CRITICAL: Missing NEWS_API_KEY environment variable");
        return res.status(500).json({
            success: false,
            message: "خطأ في إعدادات الخادم - مفتاح API مفقود",
            error: "NEWS_API_KEY not configured"
        });
    }

    try {
        console.log('🎮 Fetching tech & gaming news...');

        // [!!!] إصلاح جذري: تم تقصير قائمة الكلمات المفتاحية بشكل كبير
        // لتجنب خطأ 'queryTooLong' (الحد الأقصى 500 حرف).
        // تم التركيز على الكلمات الأكثر أهمية ودقة.
        const techKeywords = [
            // أجهزة وشركات أساسية (مع استخدام "" لزيادة الدقة)
            '"آيفون"', 'iPhone', '"سامسونج جالاكسي"', '"Google Pixel"', 'هواوي',
            'Apple', 'Google', 'Microsoft',

            // ألعاب ومنصات
            'بلايستيشن', 'PlayStation', 'اكسبوكس', 'Xbox', 'Nintendo', '"ألعاب فيديو"',
            'gaming', 'Ubisoft', '"Electronic Arts"',

            // هاردوير ورقاقات
            'NVIDIA', 'AMD', 'Intel', 'Qualcomm', 'معالج',

            // مصطلحات تقنية هامة
            '"ذكاء اصطناعي"', 'AI', 'تسريبات', 'تطبيق'
        ];

        // تجميع الكلمات مع OR لتكوين طلب بحث قوي
        const query = encodeURIComponent(techKeywords.join(' OR '));
        const fromDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10); // آخر يومين

        // تم زيادة 'pageSize' إلى 80 لجلب أكبر عدد ممكن من المقالات للفلترة
        const url = `https://newsapi.org/v2/everything?q=${query}&language=ar,en&sortBy=publishedAt&pageSize=80&from=${fromDate}`;

        console.log('🔗 Building NewsAPI URL (fixed for production):', url.slice(0, 200) + '...');
        console.log('📅 Searching from:', fromDate);

        const response = await fetch(url, {
            headers: {
                'X-Api-Key': API_KEY,
                'User-Agent': 'LingramQ8-TechBot/1.2'
            },
        });

        console.log('📊 NewsAPI Response Status:', response.status);

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ message: 'Could not parse error JSON' }));
            console.error(`❌ NewsAPI Error: ${response.status}`, errorBody);

            let userMessage = `فشل في الاتصال بمصدر الأخبار (خطأ: ${response.status})`;
            if (response.status === 400) userMessage = `فشل في جلب الأخبار، خطأ في الطلب: ${errorBody.message}`;
            if (response.status === 429) userMessage = "تم تجاوز الحد الأقصى للطلبات اليومية من NewsAPI.";
            if (response.status === 426) userMessage = "ميزة مطلوبة غير متوفرة في الخطة الحالية لـ NewsAPI.";

            return res.status(502).json({
                success: false,
                message: userMessage,
                error: `NewsAPI returned status ${response.status}`,
                details: errorBody
            });
        }

        const data = await response.json();
        console.log(`📈 Raw articles received: ${data.articles?.length || 0}`);

        if (!data.articles || data.articles.length === 0) {
            return res.status(404).json({
                success: false,
                message: "لا توجد أخبار تقنية أو ألعاب متاحة حالياً",
                error: "No articles found from API"
            });
        }

        const politicalKeywords = [
            'سياس', 'حكومة', 'رئيس', 'وزير', 'برلمان', 'انتخابات', 'دستور',
            'حرب', 'صراع', 'نزاع', 'هجوم', 'غارة', 'قصف', 'اتفاق', 'معاهدة',
            'دبلوماس', 'politics', 'government', 'president', 'minister',
            'parliament', 'election', 'war', 'conflict', 'treaty', 'diplomatic'
        ];

        const filteredArticles = data.articles
            .filter(article => {
                if (!article.title || article.title === "[Removed]" || !article.description) {
                    return false;
                }
                const titleAndDesc = (article.title + ' ' + article.description).toLowerCase();
                const hasPoliticalContent = politicalKeywords.some(keyword =>
                    titleAndDesc.includes(keyword.toLowerCase())
                );
                if (hasPoliticalContent) {
                    console.log(`🗑️ Filtering political content: "${article.title.substring(0, 50)}..."`);
                    return false;
                }
                return true;
            })
            .map(article => ({
                title: article.title.trim(),
                description: article.description.trim(),
                url: article.url,
                urlToImage: article.urlToImage || null,
                publishedAt: article.publishedAt,
                source: article.source
            }))
            .slice(0, 18); // عرض عدد أكبر من الأخبار النظيفة

        console.log(`✅ Tech/Gaming articles after filtering: ${filteredArticles.length}`);

        if (filteredArticles.length === 0) {
            return res.status(404).json({
                success: false,
                message: "لا توجد أخبار تقنية أو ألعاب صالحة للعرض حالياً بعد الفلترة",
                error: "No valid articles after filtering"
            });
        }

        return res.status(200).json({
            success: true,
            source: 'newsapi_tech_gaming_v3',
            totalResults: filteredArticles.length,
            articles: filteredArticles,
        });

    } catch (error) {
        console.error("💥 UNHANDLED ERROR in fetchNews:", error);
        return res.status(500).json({
            success: false,
            message: "حدث خطأ غير متوقع في الخادم أثناء جلب الأخبار",
            error: error.message,
        });
    }
}
