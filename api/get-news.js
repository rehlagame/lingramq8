// هذا السطر يجعل الدالة قابلة للاستخدام بواسطة Vercel
export default async function handler(request, response) {

    // 1. قراءة مفتاح API السري من متغيرات البيئة
    const apiKey = process.env.NEWS_API_KEY;

    if (!apiKey) {
        return response.status(500).json({ error: 'مفتاح API غير معرف على الخادم.' });
    }

    // =========================================================
    // ==== قائمة الكلمات المفتاحية الموسعة (النسخة المعتمدة) ====
    // =========================================================
    const query = `
        (
            "غوغل" OR "آبل" OR "مايكروسوفت" OR "ميتا" OR "نتفليكس" OR "تسلا" OR "OpenAI" OR
            "بيكسل" OR "آيفون" OR "آيباد" OR "ChatGPT" OR "Grok" OR
            "بلايستيشن" OR "اكسبوكس" OR "نينتندو" OR "ستيم" OR "PC gaming" OR "ألعاب فيديو" OR
            "أمن سيبراني" OR "ثغرة" OR "اختراق" OR "تسريب بيانات" OR
            "ذكاء اصطناعي" OR "الذكاء الاصطناعي التوليدي" OR
            "هاتف ذكي" OR "تقنية" OR "تكنولوجيا" OR "عملة رقمية"
        ) 
        NOT (سياسة OR حرب OR اقتصاد OR رياضة)
    `;

    // بناء رابط الطلب الكامل مع الكلمات المفتاحية الجديدة
    const apiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=ar&sortBy=publishedAt&apiKey=${apiKey}`;

    try {
        // 3. إرسال الطلب إلى NewsAPI
        const newsResponse = await fetch(apiUrl);

        if (!newsResponse.ok) {
            const errorBody = await newsResponse.json();
            console.error('NewsAPI Error:', errorBody);
            throw new Error(`خطأ من NewsAPI: ${errorBody.message || newsResponse.statusText}`);
        }
        
        // 4. الحصول على بيانات الأخبار
        const newsData = await newsResponse.json();
        
        // 5. إرسال البيانات للواجهة الأمامية مع التخزين المؤقت
        response.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
        response.status(200).json(newsData);

    } catch (error) {
        console.error('Internal Server Error:', error);
        response.status(500).json({ error: error.message });
    }
}
