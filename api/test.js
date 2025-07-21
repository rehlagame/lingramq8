// api/test.js - API اختبار بسيط للتأكد من عمل Vercel Functions

export default function handler(req, res) {
    // إضافة CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    console.log('🟢 Test API called successfully!');
    console.log('Method:', req.method);
    console.log('URL:', req.url);

    // بيانات اختبار
    const testNews = [
        {
            title: "✅ اختبار نجح - API يعمل على Vercel!",
            description: "هذا اختبار للتأكد من عمل Serverless Functions على Vercel. إذا ظهرت هذه الرسالة، فإن API يعمل بشكل صحيح.",
            url: "https://vercel.com/docs/functions",
            urlToImage: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=200&fit=crop",
            publishedAt: new Date().toISOString(),
            source: { name: "Vercel Test" }
        },
        {
            title: "🚀 LingramQ8 - منصة الأخبار التقنية",
            description: "موقع LingramQ8 يعمل بنجاح على منصة Vercel مع Serverless Functions للحصول على أحدث الأخبار التقنية.",
            url: "https://lingramq8-qxr1.vercel.app",
            urlToImage: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=200&fit=crop",
            publishedAt: new Date(Date.now() - 2*60*60*1000).toISOString(),
            source: { name: "LingramQ8" }
        }
    ];

    // إرسال الاستجابة
    res.status(200).json({
        success: true,
        message: "🎉 API Test يعمل بنجاح على Vercel!",
        timestamp: new Date().toISOString(),
        environment: "production",
        totalResults: testNews.length,
        articles: testNews
    });
}