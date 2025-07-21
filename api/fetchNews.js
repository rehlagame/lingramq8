// api/fetchNews.js - أخبار تقنية وألعاب فقط (بدون سياسة)

export default async function handler(req, res) {
    console.log('🟢 fetchNews API called - Tech & Gaming Only');
    
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
    console.log('🔑 API Key check:', API_KEY ? 'موجود' : 'مفقود');

    if (!API_KEY) {
        console.error("❌ CRITICAL: Missing NEWS_API_KEY environment variable");
        return res.status(500).json({ 
            success: false, 
            message: "خطأ في إعدادات الخادم - مفتاح API مفقود",
            error: "NEWS_API_KEY not configured"
        });
    }

    try {
        console.log('🎮 Fetching tech & gaming news only...');
        
        // كلمات بحث محددة للتقنية والألعاب فقط
        const techKeywords = [
            // شركات تقنية
            'آيفون', 'ايفون', 'iPhone', 'سامسونج', 'Samsung',
            'هواوي', 'Huawei', 'شاومي', 'Xiaomi', 'أوبو', 'Oppo',
            'ابل', 'Apple', 'جوجل', 'Google', 'مايكروسوفت', 'Microsoft',
            
            // ألعاب فيديو
            'بلايستيشن', 'PlayStation', 'اكسبوكس', 'Xbox', 'نينتندو', 'Nintendo',
            'ألعاب فيديو', 'العاب فيديو', 'لعبة', 'gaming', 'game',
            'FIFA', 'Call of Duty', 'Fortnite',
            
            // تقنيات
            'تطبيق', 'برنامج', 'تحديث', 'إصدار جديد',
            'ذكي', 'ذكاء اصطناعي', 'AI', 'تقنية', 'تكنولوجيا',
            'معالج', 'رقاقة', 'شريحة', 'بطارية', 'شاشة',
            
            // شركات هاردوير
            'انفيديا', 'NVIDIA', 'AMD', 'إنتل', 'Intel', 'Qualcomm',
            
            // منصات وخدمات
            'يوتيوب', 'YouTube', 'تيك توك', 'TikTok', 'فيسبوك', 'Facebook',
            'واتساب', 'WhatsApp', 'تلغرام', 'Telegram', 'انستغرام', 'Instagram'
        ];

        // تجميع الكلمات مع OR
        const query = encodeURIComponent(techKeywords.join(' OR '));
        
        // البحث في آخر يومين للحصول على أخبار حديثة
        const fromDate = new Date(Date.now() - 2*24*60*60*1000).toISOString();
        
        // استخدام domains محددة للمواقع التقنية
        const techDomains = [
            'techcrunch.com',
            'theverge.com', 
            'engadget.com',
            'ign.com',
            'gamespot.com',
            'polygon.com',
            'apple.com',
            'blog.google',
            'blogs.microsoft.com',
            'blog.playstation.com',
            'news.xbox.com'
        ].join(',');
        
        const url = `https://newsapi.org/v2/everything?q=${query}&domains=${techDomains}&language=ar,en&sortBy=publishedAt&pageSize=25&from=${fromDate}`;
        
        console.log('🔗 NewsAPI URL for tech/gaming built');
        console.log('📅 Searching from:', fromDate);

        const response = await fetch(url, {
            headers: { 
                'X-Api-Key': API_KEY,
                'User-Agent': 'LingramQ8-TechBot/1.0'
            },
        });

        console.log('📊 NewsAPI Response Status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ NewsAPI Error: ${response.status} - ${errorText}`);
            
            if (response.status === 426) {
                return res.status(503).json({
                    success: false,
                    message: "NewsAPI يتطلب ترقية الحساب للعمل على الخوادم المباشرة",
                    error: "API requires upgrade for production use",
                    hint: "المفتاح المجاني يعمل فقط على localhost"
                });
            }
            
            if (response.status === 429) {
                return res.status(429).json({
                    success: false,
                    message: "تم تجاوز حد الطلبات اليومي لـ NewsAPI",
                    error: "Daily request limit exceeded",
                    hint: "حاول مرة أخرى غداً أو ترقية الحساب"
                });
            }
            
            throw new Error(`NewsAPI HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log(`📈 Raw articles received: ${data.articles?.length || 0}`);

        if (!data.articles || data.articles.length === 0) {
            console.log('⚠️ No tech/gaming articles found');
            return res.status(404).json({
                success: false,
                message: "لا توجد أخبار تقنية أو ألعاب متاحة حالياً",
                error: "No tech/gaming articles found"
            });
        }

        // فلترة صارمة لإزالة الأخبار السياسية والعامة
        const politicalKeywords = [
            'سياسة', 'حكومة', 'رئيس', 'وزير', 'برلمان', 'انتخابات',
            'حرب', 'صراع', 'اتفاق', 'معاهدة', 'دبلوماسية',
            'politics', 'government', 'president', 'minister', 'parliament',
            'war', 'conflict', 'agreement', 'treaty', 'diplomatic',
            'ترامب', 'بايدن', 'أوباما', 'كلينتون',
            'السعودية', 'مصر', 'سوريا', 'فلسطين', 'إسرائيل',
            'أوكرانيا', 'روسيا', 'الصين الأمريكية'
        ];

        const filteredArticles = data.articles
            .filter(article => {
                // تحقق من صحة البيانات الأساسية
                const hasValidData = article.title && 
                                   article.title !== "[Removed]" && 
                                   article.description &&
                                   article.description !== "[Removed]" &&
                                   article.url &&
                                   article.source?.name;

                if (!hasValidData) return false;

                // تحقق من عدم وجود كلمات سياسية
                const titleAndDesc = (article.title + ' ' + article.description).toLowerCase();
                const hasPoliticalContent = politicalKeywords.some(keyword => 
                    titleAndDesc.includes(keyword.toLowerCase())
                );

                if (hasPoliticalContent) {
                    console.log('🗑️ Filtered out political content:', article.title?.substring(0, 50));
                    return false;
                }

                // تحقق من وجود كلمات تقنية
                const hasTechContent = techKeywords.some(keyword => 
                    titleAndDesc.includes(keyword.toLowerCase())
                );

                if (!hasTechContent) {
                    console.log('🗑️ Filtered out non-tech content:', article.title?.substring(0, 50));
                    return false;
                }

                return true;
            })
            .map(article => ({
                title: article.title,
                description: article.description,
                url: article.url,
                urlToImage: article.urlToImage || `https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600&h=300&fit=crop&crop=center`,
                publishedAt: article.publishedAt,
                source: article.source
            }))
            .slice(0, 12); // أقصى 12 خبر تقني

        console.log(`✅ Tech/Gaming articles after filtering: ${filteredArticles.length}`);

        if (filteredArticles.length === 0) {
            return res.status(404).json({
                success: false,
                message: "لا توجد أخبار تقنية أو ألعاب صالحة للعرض حالياً",
                error: "No valid tech/gaming articles after filtering"
            });
        }

        return res.status(200).json({
            success: true,
            source: 'newsapi_tech_gaming',
            totalResults: filteredArticles.length,
            articles: filteredArticles,
            meta: {
                fetched_at: new Date().toISOString(),
                api_total: data.totalResults,
                filtered_count: filteredArticles.length,
                content_type: 'technology_and_gaming_only'
            }
        });

    } catch (error) {
        console.error("💥 ERROR in fetchNews:", error);
        
        return res.status(500).json({
            success: false,
            message: "فشل في جلب الأخبار التقنية",
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}
