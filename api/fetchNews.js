// api/fetchNews.js - مع تشخيص متقدم ومعالجة أخطاء محسّنة

export default async function handler(req, res) {
    console.log('🟢 fetchNews API called');
    console.log('Method:', req.method);
    console.log('Headers:', req.headers);
    
    // إضافة CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        console.log('⚪ OPTIONS request handled');
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
        console.log('📰 Starting news fetch...');
        
        // كلمات البحث المحسّنة
        const keywords = [
            'تقنية', 'ألعاب', 'بلايستيشن', 'اكسبوكس', 
            'ابل', 'جوجل', 'انفيديا', 'سامسونج', 'هواوي',
            'آيفون', 'اندرويد', 'ذكي', 'تطبيق'
        ].join(' OR ');

        const query = encodeURIComponent(keywords);
        
        // تحديد تاريخ البحث (آخر 24 ساعة)
        const fromDate = new Date(Date.now() - 24*60*60*1000).toISOString();
        
        const url = `https://newsapi.org/v2/everything?q=${query}&language=ar&sortBy=publishedAt&pageSize=15&from=${fromDate}`;
        
        console.log('🔗 News API URL:', url.substring(0, 100) + '...');
        console.log('📅 From date:', fromDate);

        const response = await fetch(url, {
            headers: { 
                'X-Api-Key': API_KEY,
                'User-Agent': 'LingramQ8-NewsBot/1.0'
            },
        });

        console.log('📊 NewsAPI Response Status:', response.status);
        console.log('📊 NewsAPI Response Headers:', response.headers);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ NewsAPI Error: ${response.status} - ${errorText}`);
            
            // إذا كانت مشكلة في الحصة، ارجع بيانات تجريبية
            if (response.status === 426 || response.status === 429) {
                console.log('⚠️ API quota exceeded, returning mock data');
                return res.status(200).json({
                    success: true,
                    message: "تم استنفاد حصة API - عرض بيانات تجريبية",
                    totalResults: 2,
                    articles: [
                        {
                            title: "⚠️ تم استنفاد حصة NewsAPI اليومية",
                            description: "تم الوصول للحد الأقصى من طلبات NewsAPI (1000 طلب/يوم). سيتم إعادة التفعيل تلقائياً غداً. هذه رسالة تجريبية للتأكد من عمل الموقع.",
                            url: "https://newsapi.org/pricing",
                            urlToImage: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=200&fit=crop",
                            publishedAt: new Date().toISOString(),
                            source: { name: "LingramQ8 System" }
                        },
                        {
                            title: "🔧 نظام LingramQ8 يعمل بشكل طبيعي",
                            description: "جميع أنظمة LingramQ8 تعمل بشكل طبيعي. المشكلة فقط في حصة API الخارجية. بوت تويتر وباقي الخدمات تعمل بشكل ممتاز.",
                            url: "https://lingramq8-qxr1.vercel.app",
                            urlToImage: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=200&fit=crop",
                            publishedAt: new Date(Date.now() - 1*60*60*1000).toISOString(),
                            source: { name: "LingramQ8 Status" }
                        }
                    ]
                });
            }
            
            throw new Error(`NewsAPI HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log(`📈 Raw articles received: ${data.articles?.length || 0}`);
        console.log(`📈 Total results: ${data.totalResults || 0}`);

        // تنظيف وفلترة الأخبار
        const filteredArticles = (data.articles || [])
            .filter(article => {
                const isValid = article.title && 
                               article.title !== "[Removed]" && 
                               article.description &&
                               article.description !== "[Removed]" &&
                               article.urlToImage &&
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
                urlToImage: article.urlToImage,
                publishedAt: article.publishedAt,
                source: article.source
            }));

        console.log(`✅ Clean articles after filtering: ${filteredArticles.length}`);

        // إذا لم نحصل على أخبار كافية، أضف بيانات تجريبية
        if (filteredArticles.length === 0) {
            console.log('⚠️ No valid articles found, returning fallback data');
            filteredArticles.push({
                title: "📰 لا توجد أخبار جديدة حالياً",
                description: "لم يتم العثور على أخبار تقنية جديدة في آخر 24 ساعة. يرجى المحاولة مرة أخرى لاحقاً أو تحديث الصفحة.",
                url: "https://lingramq8-qxr1.vercel.app",
                urlToImage: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=200&fit=crop",
                publishedAt: new Date().toISOString(),
                source: { name: "LingramQ8" }
            });
        }

        const response_data = {
            success: true,
            totalResults: filteredArticles.length,
            articles: filteredArticles,
            meta: {
                fetched_at: new Date().toISOString(),
                raw_count: data.articles?.length || 0,
                filtered_count: filteredArticles.length
            }
        };

        console.log('🎉 Success! Returning', filteredArticles.length, 'articles');
        return res.status(200).json(response_data);

    } catch (error) {
        console.error("💥 ERROR in fetchNews:", error);
        console.error("💥 Error stack:", error.stack);
        
        return res.status(500).json({
            success: false,
            message: "فشل في جلب الأخبار",
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}
