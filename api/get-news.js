// هذا السطر يجعل الدالة قابلة للاستخدام بواسطة Vercel
export default async function handler(request, response) {
    
    // 1. قراءة مفتاح API السري من متغيرات البيئة في Vercel (ليس من الكود مباشرة)
    const apiKey = process.env.NEWS_API_KEY;

    // التحقق من وجود المفتاح على الخادم
    if (!apiKey) {
        return response.status(500).json({ error: 'مفتاح API غير معرف على الخادم. تأكد من إضافته في إعدادات Vercel.' });
    }

    // 2. بناء استعلام البحث المخصص للحصول على الأخبار المطلوبة فقط
    const query = `(تقنية OR "أمن سيبراني" OR "ذكاء اصطناعي" OR "ألعاب فيديو" OR "بلايستيشن" OR "اكسبوكس" OR "نينتندو" OR "PC gaming") NOT (سياسة OR حرب)`;
    const apiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=ar&sortBy=publishedAt&apiKey=${apiKey}`;

    try {
        // 3. إرسال الطلب إلى NewsAPI من الخادم
        const newsResponse = await fetch(apiUrl);

        // إذا فشل الطلب، قم بإرسال رسالة خطأ واضحة
        if (!newsResponse.ok) {
            const errorBody = await newsResponse.json();
            console.error('NewsAPI Error:', errorBody);
            throw new Error(`خطأ من NewsAPI: ${errorBody.message || newsResponse.statusText}`);
        }

        // 4. الحصول على بيانات الأخبار بصيغة JSON
        const newsData = await newsResponse.json();

        // 5. إرسال البيانات بنجاح إلى الواجهة الأمامية (مدونتك)
        // إضافة header للسماح بالتخزين المؤقت (caching) لمدة 10 دقائق
        response.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
        response.status(200).json(newsData);

    } catch (error) {
        // في حالة حدوث أي خطأ آخر، قم بتسجيله وإرسال استجابة خطأ
        console.error('Internal Server Error:', error);
        response.status(500).json({ error: error.message });
    }
}
