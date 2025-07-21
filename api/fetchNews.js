// api/fetchNews.js - أخبار تقنية وألعاب فقط (كود محسّن ومصحح)

export default async function handler(req, res) {
    console.log('🟢 fetchNews API called - Tech & Gaming Only [v2]');

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

        // كلمات بحث محددة للتقنية والألعاب فقط
        const techKeywords = [
            'آيفون', 'ايفون', 'iPhone', 'سامسونج', 'Samsung', 'هواوي', 'Huawei',
            'شاومي', 'Xiaomi', 'أوبو', 'Oppo', 'ابل', 'Apple', 'جوجل', 'Google',
            'مايكروسوفت', 'Microsoft', 'بلايستيشن', 'PlayStation', 'اكسبوكس', 'Xbox',
            'نينتندو', 'Nintendo', 'ألعاب فيديو', 'العاب فيديو', 'لعبة', 'gaming', 'game',
            'FIFA', 'Call of Duty', 'Fortnite', 'تطبيق', 'برنامج', 'تحديث',
            'إصدار جديد', 'ذكي', 'ذكاء اصطناعي', 'AI', 'تقنية', 'تكنولوجيا',
            'معالج', 'رقاقة', 'شريحة', 'بطارية', 'شاشة', 'انفيديا', 'NVIDIA',
            'AMD', 'إنتل', 'Intel', 'Qualcomm', 'يوتيوب', 'YouTube', 'تيك توك', 'TikTok',
            'فيسبوك', 'Facebook', 'واتساب', 'WhatsApp', 'تلغرام', 'Telegram', 'انستغرام', 'Instagram'
        ];

        // تجميع الكلمات مع OR لتكوين طلب بحث قوي
        const query = encodeURIComponent(techKeywords.join(' OR '));
        const fromDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10); // آخر يومين

        // [!!] إصلاح هام: تم حذف پارامتر 'domains' لأنه ميزة مدفوعة في NewsAPI
        // ويسبب خطأ 500 عند النشر على Vercel.
        // تم زيادة 'pageSize' إلى 50 لجلب المزيد من المقالات وتعويض الفلترة.
        const url = `https://newsapi.org/v2/everything?q=${query}&language=ar,en&sortBy=publishedAt&pageSize=50&from=${fromDate}`;

        console.log('🔗 Building NewsAPI URL (fixed for production):', url);
        console.log('📅 Searching from:', fromDate);

        const response = await fetch(url, {
            headers: {
                'X-Api-Key': API_KEY,
                'User-Agent': 'LingramQ8-TechBot/1.1'
            },
        });

        console.log('📊 NewsAPI Response Status:', response.status);

        if (!response.ok) {
            // محاولة قراءة الخطأ من NewsAPI
            const errorBody = await response.json().catch(() => ({ message: 'Could not parse error JSON' }));
            console.error(`❌ NewsAPI Error: ${response.status}`, errorBody);

            let userMessage = `فشل في الاتصال بمصدر الأخبار (خطأ: ${response.status})`;
            if (response.status === 429) userMessage = "تم تجاوز الحد الأقصى للطلبات اليومية من NewsAPI.";
            if (response.status === 426) userMessage = "ميزة مطلوبة غير متوفرة في الخطة الحالية لـ NewsAPI.";
            
            return res.status(502).json({ // 502 Bad Gateway is more appropriate
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

        // [!!] تحسين الفلترة: تعديل قائمة الكلمات السياسية لتكون أكثر دقة
        // تم حذف أسماء الدول التي قد تظهر في أخبار تقنية شرعية
        const politicalKeywords = [
            'سياس', // 'سياسة', 'سياسي'
            'حكومة', 'رئيس', 'وزير', 'برلمان', 'انتخابات', 'دستور',
            'حرب', 'صراع', 'نزاع', 'هجوم', 'غارة', 'قصف',
            'اتفاق', 'معاهدة', 'دبلوماس', // 'دبلوماسية', 'دبلوماسي'
            'politics', 'government', 'president', 'minister', 'parliament',
            'election', 'war', 'conflict', 'treaty', 'diplomatic'
        ];

        const filteredArticles = data.articles
            .filter(article => {
                // فلترة أولية للمقالات غير الصالحة أو المحذوفة
                if (!article.title || article.title === "[Removed]" || !article.description) {
                    return false;
                }

                const titleAndDesc = (article.title + ' ' + article.description).toLowerCase();

                // فلترة المحتوى السياسي (المرحلة الأولى)
                const hasPoliticalContent = politicalKeywords.some(keyword =>
                    titleAndDesc.includes(keyword.toLowerCase())
                );
                if (hasPoliticalContent) {
                    console.log(`🗑️ Filtering political content: "${article.title.substring(0, 50)}..."`);
                    return false;
                }

                // [!!] تحسين: لا داعي للتحقق من وجود الكلمات التقنية مرة أخرى
                // لأننا طلبناها بالفعل من API. هذا يسرع العملية ويمنع الأخطاء.

                return true; // المقال نجا من الفلترة
            })
            .map(article => ({ // تنظيم البيانات للشكل النهائي
                title: article.title.trim(),
                description: article.description.trim(),
                url: article.url,
                urlToImage: article.urlToImage || null, // إرجاع null أفضل من رابط عشوائي
                publishedAt: article.publishedAt,
                source: article.source
            }))
            .slice(0, 15); // زيادة عدد الأخبار المعروضة إلى 15

        console.log(`✅ Tech/Gaming articles after filtering: ${filteredArticles.length}`);

        if (filteredArticles.length === 0) {
            return res.status(404).json({
                success: false,
                message: "لا توجد أخبار تقنية أو ألعاب صالحة للعرض حالياً بعد الفلترة",
                error: "No valid articles after filtering"
            });
        }

        // إرسال استجابة ناجحة مع البيانات النظيفة
        return res.status(200).json({
            success: true,
            source: 'newsapi_tech_gaming_v2',
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
