// هذا السطر يجعل الدالة قابلة للاستخدام بواسطة Vercel
export default async function handler(request, response) {

    // 1. قراءة مفتاح API السري من متغيرات البيئة
    const apiKey = process.env.NEWS_API_KEY;

    if (!apiKey) {
        return response.status(500).json({ error: 'مفتاح API غير معرف على الخادم.' });
    }

    // ==== قائمة الكلمات المفتاحية (نسخة مختصرة تحت 500 حرف) ====
    const query = `
        (
            "غوغل" OR "آبل" OR "مايكروسوفت" OR "ميتا" OR "تسلا" OR "OpenAI" OR
            "آيفون" OR "ChatGPT" OR "بلايستيشن" OR "اكسبوكس" OR "نينتندو" OR "ستيم" OR 
            "ألعاب فيديو" OR "أمن سيبراني" OR "ثغرة" OR
            "ذكاء اصطناعي" OR "تكنولوجيا" OR "عملة رقمية"
        ) 
        NOT (
            سياسة OR حرب OR اقتصاد OR رياضة OR 
            غزة OR إسرائيل OR فلسطين OR الاحتلال OR قصف OR 
            نتنياهو OR اسرائيل OR إيران OR سوريا OR الضفة OR حماس OR القدس
        )
    `;

    // بناء رابط الطلب الكامل
    const apiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=ar&sortBy=publishedAt&apiKey=${apiKey}`;

    try {
        const newsResponse = await fetch(apiUrl);
        if (!newsResponse.ok) {
            const errorBody = await newsResponse.json();
            throw new Error(`خطأ من NewsAPI: ${errorBody.message || newsResponse.statusText}`);
        }
        const newsData = await newsResponse.json();
        response.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
        response.status(200).json(newsData);
    } catch (error) {
        console.error('Internal Server Error:', error);
        response.status(500).json({ error: error.message });
    }
}
