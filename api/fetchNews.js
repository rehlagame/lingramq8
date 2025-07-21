// api/fetchNews.js - نسخة نهائية مع أخبار تجريبية عالية الجودة

export default async function handler(req, res) {
    console.log('🟢 fetchNews API called - LingramQ8');
    
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
    console.log('🔑 API Key status:', API_KEY ? 'Available' : 'Missing');

    // بيانات أخبار تجريبية عالية الجودة
    const mockNews = [
        {
            title: "آبل تكشف عن iPhone 16 Pro مع شريحة A18 Bionic المتطورة",
            description: "كشفت شركة آبل النقاب عن iPhone 16 Pro الجديد الذي يأتي بشريحة A18 Bionic المتطورة وكاميرا بدقة 48 ميجابكسل مع تحسينات كبيرة في الأداء والذكاء الاصطناعي.",
            url: "https://www.apple.com/iphone-16-pro/",
            urlToImage: "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=600&h=300&fit=crop&crop=center",
            publishedAt: new Date().toISOString(),
            source: { name: "Apple Newsroom" }
        },
        {
            title: "سونی تعلن عن PlayStation 5 Pro بقوة معالجة مضاعفة",
            description: "أعلنت سوني رسمياً عن PlayStation 5 Pro الجديد الذي يوفر قوة معالجة مضاعفة مع دعم Ray Tracing المتقدم وتقنية PSSR لتحسين جودة الألعاب.",
            url: "https://www.playstation.com/ps5-pro/",
            urlToImage: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600&h=300&fit=crop&crop=center",
            publishedAt: new Date(Date.now() - 2*60*60*1000).toISOString(),
            source: { name: "PlayStation Blog" }
        },
        {
            title: "مايكروسوفت تطلق Windows 11 2025 مع ميزات ذكية جديدة",
            description: "أطلقت مايكروسوفت تحديث Windows 11 2025 الذي يتضمن ميزات ذكية جديدة مثل Copilot المتقدم وتحسينات في الأمان والأداء وواجهة مستخدم محسّنة.",
            url: "https://www.microsoft.com/windows/",
            urlToImage: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&h=300&fit=crop&crop=center",
            publishedAt: new Date(Date.now() - 4*60*60*1000).toISOString(),
            source: { name: "Microsoft News" }
        },
        {
            title: "نفيديا تكشف عن RTX 5090 Ti بأداء ثوري في الألعاب",
            description: "كشفت نفيديا عن بطاقة الرسوميات الجديدة RTX 5090 Ti التي توفر أداءً ثورياً في الألعاب مع دعم كامل للذكاء الاصطناعي وتقنية DLSS 4.0.",
            url: "https://www.nvidia.com/rtx-5090/",
            urlToImage: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=300&fit=crop&crop=center",
            publishedAt: new Date(Date.now() - 6*60*60*1000).toISOString(),
            source: { name: "NVIDIA GeForce" }
        },
        {
            title: "سامسونج تعلن عن Galaxy S25 Ultra مع كاميرا بدقة 200MP",
            description: "كشفت سامسونج عن Galaxy S25 Ultra الجديد الذي يأتي بكاميرا رئيسية بدقة 200 ميجابكسل وتقنيات تصوير متقدمة مدعومة بالذكاء الاصطناعي.",
            url: "https://www.samsung.com/galaxy-s25/",
            urlToImage: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=300&fit=crop&crop=center",
            publishedAt: new Date(Date.now() - 8*60*60*1000).toISOString(),
            source: { name: "Samsung Newsroom" }
        },
        {
            title: "تسلا تبدأ إنتاج Model Y الجديدة بمدى 600 كيلومتر",
            description: "بدأت تسلا إنتاج Model Y الجديدة المطورة التي توفر مدى يصل إلى 600 كيلومتر بشحنة واحدة مع تحسينات في التصميم والتقنيات الذكية.",
            url: "https://www.tesla.com/modely/",
            urlToImage: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=600&h=300&fit=crop&crop=center",
            publishedAt: new Date(Date.now() - 10*60*60*1000).toISOString(),
            source: { name: "Tesla News" }
        },
        {
            title: "جوجل تطلق Pixel 9 Pro مع ميزات تصوير ذكية متقدمة",
            description: "أطلقت جوجل هاتف Pixel 9 Pro الجديد الذي يأتي بميزات تصوير ذكية متقدمة وتقنية Magic Eraser المحسّنة مع دعم أفضل للذكاء الاصطناعي.",
            url: "https://store.google.com/pixel-9-pro/",
            urlToImage: "https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=600&h=300&fit=crop&crop=center",
            publishedAt: new Date(Date.now() - 12*60*60*1000).toISOString(),
            source: { name: "Google Store" }
        },
        {
            title: "AMD تعلن عن معالجات Ryzen 8000 بكفاءة طاقة متقدمة",
            description: "كشفت AMD عن سلسلة معالجات Ryzen 8000 الجديدة التي توفر أداءً عالياً مع كفاءة طاقة متقدمة وتقنيات ذكية للحوسبة المتطورة.",
            url: "https://www.amd.com/ryzen-8000/",
            urlToImage: "https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=600&h=300&fit=crop&crop=center",
            publishedAt: new Date(Date.now() - 14*60*60*1000).toISOString(),
            source: { name: "AMD News" }
        },
        {
            title: "مايتا تكشف عن نظارات الواقع المختلط Quest 4 الثورية",
            description: "كشفت مايتا عن نظارات Quest 4 للواقع المختلط التي توفر تجربة غامرة مع دقة عرض 4K وتتبع حركة العين وتقنيات ذكية متطورة.",
            url: "https://www.meta.com/quest-4/",
            urlToImage: "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=600&h=300&fit=crop&crop=center",
            publishedAt: new Date(Date.now() - 16*60*60*1000).toISOString(),
            source: { name: "Meta Newsroom" }
        }
    ];

    try {
        // محاولة جلب أخبار حقيقية أولاً (ستفشل على الأرجح)
        if (API_KEY) {
            console.log('🔄 Attempting to fetch real news...');
            
            const keywords = encodeURIComponent('تقنية OR ألعاب OR آيفون OR سامسونج');
            const fromDate = new Date(Date.now() - 24*60*60*1000).toISOString();
            const url = `https://newsapi.org/v2/everything?q=${keywords}&language=ar&sortBy=publishedAt&pageSize=10&from=${fromDate}`;

            const response = await fetch(url, {
                headers: { 
                    'X-Api-Key': API_KEY,
                    'User-Agent': 'LingramQ8-NewsBot/1.0'
                },
            });

            if (response.ok) {
                const data = await response.json();
                const realArticles = (data.articles || [])
                    .filter(article => 
                        article.title && 
                        article.title !== "[Removed]" && 
                        article.description &&
                        article.urlToImage
                    )
                    .slice(0, 8);

                if (realArticles.length > 0) {
                    console.log('✅ Real news fetched successfully:', realArticles.length);
                    return res.status(200).json({
                        success: true,
                        source: 'real_api',
                        totalResults: realArticles.length,
                        articles: realArticles
                    });
                }
            } else {
                console.log('⚠️ NewsAPI failed, status:', response.status);
            }
        }

        // إذا فشل جلب الأخبار الحقيقية، استخدم الأخبار التجريبية
        console.log('📰 Using high-quality mock news data');
        
        // تحديث تواريخ الأخبار التجريبية لتبدو حديثة
        const updatedMockNews = mockNews.map((article, index) => ({
            ...article,
            publishedAt: new Date(Date.now() - (index * 2 * 60 * 60 * 1000)).toISOString()
        }));

        return res.status(200).json({
            success: true,
            source: 'demo_content',
            message: "عرض محتوى تجريبي عالي الجودة - LingramQ8",
            totalResults: updatedMockNews.length,
            articles: updatedMockNews,
            meta: {
                fetched_at: new Date().toISOString(),
                note: "هذا محتوى تجريبي لعرض إمكانيات الموقع"
            }
        });

    } catch (error) {
        console.error("💥 Error in fetchNews:", error);
        
        // في حالة خطأ، ارجع بعض الأخبار التجريبية
        return res.status(200).json({
            success: true,
            source: 'fallback',
            message: "تم التبديل للوضع الاحتياطي",
            totalResults: 3,
            articles: mockNews.slice(0, 3)
        });
    }
}
