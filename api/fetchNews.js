// api/fetchNews.js - أخبار حقيقية فقط من NewsAPI

export default async function handler(req, res) {
    console.log('🟢 fetchNews API called - Real News Only');
    
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
        console.log('🔄 Fetching real news from NewsAPI...');
        
        // كلمات البحث للأخبار التقنية والألعاب العربية
        const keywords = [
            'تقنية', 'تكنولوجيا', 'ألعاب', 'العاب', 'فيديو',
            'آيفون', 'ايفون', 'سامسونج', 'هواوي', 'شاومي',
            'بلايستيشن', 'اكسبوكس', 'نينتندو',
            'ابل', 'جوجل', 'مايكروسوفت', 'انفيديا',
            'ذكي', 'ذكاء اصطناعي', 'تطبيق', 'برنامج'
        ].join(' OR ');

        const query = encodeURIComponent(keywords);
        
        // البحث في آخر 3 أيام للحصول على أخبار أكثر
        const fromDate = new Date(Date.now() - 3*24*60*60*1000).toISOString();
        
        const url = `https://newsapi.org/v2/everything?q=${query}&language=ar&sortBy=publishedAt&pageSize=20&from=${fromDate}`;
        
        console.log('🔗 NewsAPI URL built');
        console.log('📅 Searching from:', fromDate);

        const response = await fetch(url, {
            headers: { 
                'X-Api-Key': API_KEY,
                'User-Agent': 'LingramQ8-NewsBot/1.0'
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
        console.log(`📈 Total results: ${data.totalResults || 0}`);

        if (!data.articles || data.articles.length === 0) {
            console.log('⚠️ No articles returned from NewsAPI');
            return res.status(404).json({
                success: false,
                message: "لا توجد أخبار متاحة حالياً",
                error: "No articles found",
                total_results: data.totalResults || 0
            });
        }

        // تنظيف وفلترة الأخبار الحقيقية
        const filteredArticles = data.articles
            .filter(article => {
                const isValid = article.title && 
                               article.title !== "[Removed]" && 
                               article.description &&
                               article.description !== "[Removed]" &&
                               article.url &&
                               article.source?.name;
                
                if (!isValid) {
                    console.log('🗑️ Filtered out invalid article:', article.title?.substring(0, 50));
                }
                
                return isValid;
            })
            .map(article => ({
                title: article.title,
                description: article.description,
                url: article.url,
                urlToImage: article.urlToImage || `https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600&h=300&fit=crop&crop=center`,
                publishedAt: article.publishedAt,
                source: article.source
            }))
            .slice(0, 12); // أقصى 12 خبر

        console.log(`✅ Clean articles after filtering: ${filteredArticles.length}`);

        if (filteredArticles.length === 0) {
            return res.status(404).json({
                success: false,
                message: "لا توجد أخبار صالحة للعرض حالياً",
                error: "No valid articles after filtering"
            });
        }

        return res.status(200).json({
            success: true,
            source: 'newsapi',
            totalResults: filteredArticles.length,
            articles: filteredArticles,
            meta: {
                fetched_at: new Date().toISOString(),
                api_total: data.totalResults,
                filtered_count: filteredArticles.length
            }
        });

    } catch (error) {
        console.error("💥 ERROR in fetchNews:", error);
        
        return res.status(500).json({
            success: false,
            message: "فشل في جلب الأخبار من المصدر",
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}
