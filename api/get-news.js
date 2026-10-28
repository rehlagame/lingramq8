// محرك جلب الأخبار الهجين لمدونة Lingram (RSS + NewsAPI) مع حفظ حقوق المصادر
const RSS_SOURCES = [
    {
        name: 'البوابة العربية للأخبار التقنية (AITNews)',
        siteUrl: 'https://aitnews.com',
        feedUrl: 'https://aitnews.com/feed/',
        defaultCategory: 'tech'
    },
    {
        name: 'عالم التقنية (Tech-WD)',
        siteUrl: 'https://www.tech-wd.com/wd',
        feedUrl: 'https://www.tech-wd.com/wd/feed/',
        defaultCategory: 'tech'
    },
    {
        name: 'التقنية بلا حدود (Unlimit-Tech)',
        siteUrl: 'https://www.unlimit-tech.com',
        feedUrl: 'https://www.unlimit-tech.com/feed/',
        defaultCategory: 'tech'
    },
    {
        name: 'سعودي جيمر (Saudi Gamer)',
        siteUrl: 'https://www.saudigamer.com',
        feedUrl: 'https://www.saudigamer.com/feed/',
        defaultCategory: 'gaming'
    },
    {
        name: 'ترو جيمنج (TrueGaming)',
        siteUrl: 'https://www.true-gaming.net/home',
        feedUrl: 'https://www.true-gaming.net/home/feed/',
        defaultCategory: 'gaming'
    },
    {
        name: 'عرب هاردوير (ArabHardware)',
        siteUrl: 'https://arabhardware.net',
        feedUrl: 'https://arabhardware.net/feed',
        defaultCategory: 'tech'
    }
];

const CATEGORY_RULES = {
    ai: [
        'ذكاء اصطناعي', 'الذكاء الاصطناعي', 'تعلم الآلة', 'chatgpt', 'openai',
        'gemini', 'claude', 'copilot', 'غروك', 'grok', 'نماذج لغوية', 'llm',
        'توليد الصور', 'sora', 'deepseek', 'ديب سيك', 'روبوت'
    ],
    security: [
        'أمن سيبراني', 'الأمن السيبراني', 'سيبراني', 'اختراق', 'ثغرة', 'ثغرات',
        'هاكر', 'قرصنة', 'برمجيات خبيثة', 'فدية', 'تصيد', 'تشفير', 'حماية البيانات',
        'خصوصية', 'malware', 'ransomware', 'phishing', 'zero-day', 'أمن المعلومات'
    ],
    gaming: [
        'ألعاب', 'لعبة', 'بلايستيشن', 'اكسبوكس', 'إكسبوكس', 'نينتندو', 'ستيم',
        'playstation', 'ps5', 'ps6', 'xbox', 'nintendo', 'switch', 'steam',
        'gta', 'call of duty', 'فيفا', 'ea sports', 'ألعاب الفيديو', 'جيمر', 'جيمنج'
    ],
    tech: [
        'تكنولوجيا', 'تقنية', 'هاتف', 'هواتف', 'آيفون', 'أندرويد', 'سامسونج',
        'آبل', 'جوجل', 'غوغل', 'مايكروسوفت', 'ويندوز', 'معالج', 'شاشة', 'حاسوب',
        'لابتوب', 'إنفيديا', 'nvidia', 'تسلا', 'فضاء', 'تطبيق', 'تحديث'
    ]
};

function stripHtml(html = '') {
    return html
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#8211;|&#8212;|&ndash;|&mdash;/gi, '-')
        .replace(/&#8216;|&#8217;|&#039;/gi, "'")
        .replace(/&#8220;|&#8221;/gi, '"')
        .replace(/&#8230;|&hellip;/gi, '...')
        .replace(/\s+/g, ' ')
        .trim();
}

function extractTagContent(xml, tagName) {
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
    const match = xml.match(regex);
    if (!match) return '';
    return match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1').trim();
}

function extractImageFromItem(itemXml) {
    // 1. media:content or media:thumbnail or enclosure
    const mediaMatch = itemXml.match(/<(?:media:content|media:thumbnail|enclosure)[^>]+url=["']([^"']+)["']/i);
    if (mediaMatch && mediaMatch[1]) return mediaMatch[1];

    // 2. <img src="..."> inside description or content:encoded
    const imgMatch = itemXml.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch && imgMatch[1]) return imgMatch[1];

    return null;
}

function detectCategory(title = '', description = '', defaultCat = 'tech') {
    const text = `${title} ${description}`.toLowerCase();
    if (CATEGORY_RULES.security.some(k => text.includes(k.toLowerCase()))) return 'security';
    if (CATEGORY_RULES.ai.some(k => text.includes(k.toLowerCase()))) return 'ai';
    if (CATEGORY_RULES.gaming.some(k => text.includes(k.toLowerCase()))) return 'gaming';
    if (defaultCat && defaultCat !== 'tech') return defaultCat;
    return 'tech';
}

function parseRssItems(xmlText, sourceInfo) {
    const items = [];
    const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null) {
        const itemXml = match[1];
        const rawTitle = extractTagContent(itemXml, 'title');
        const title = stripHtml(rawTitle);
        const link = stripHtml(extractTagContent(itemXml, 'link'));
        const pubDateRaw = extractTagContent(itemXml, 'pubDate') || extractTagContent(itemXml, 'dc:date');
        const creator = stripHtml(extractTagContent(itemXml, 'dc:creator') || extractTagContent(itemXml, 'author'));
        const rawDesc = extractTagContent(itemXml, 'description');
        const rawContent = extractTagContent(itemXml, 'content:encoded');

        const cleanDesc = stripHtml(rawDesc).slice(0, 320);
        const cleanContent = stripHtml(rawContent || rawDesc).slice(0, 1500);
        const imageUrl = extractImageFromItem(itemXml);

        if (!title || !link) continue;

        const publishedAt = pubDateRaw && !isNaN(Date.parse(pubDateRaw))
            ? new Date(pubDateRaw).toISOString()
            : new Date().toISOString();

        const category = detectCategory(title, cleanDesc, sourceInfo.defaultCategory);

        items.push({
            title,
            description: cleanDesc || title,
            content: cleanContent || cleanDesc,
            url: link,
            urlToImage: imageUrl,
            publishedAt,
            author: creator || sourceInfo.name,
            category,
            source: {
                id: sourceInfo.name,
                name: sourceInfo.name,
                url: sourceInfo.siteUrl
            }
        });
    }

    return items;
}

async function fetchRssFeeds() {
    const feedPromises = RSS_SOURCES.map(async (source) => {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5500);
            const res = await fetch(source.feedUrl, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'LingramTechNewsAggregator/2.0 (+https://lingramq8.vercel.app)'
                }
            });
            clearTimeout(timeout);
            if (!res.ok) return [];
            const xml = await res.text();
            return parseRssItems(xml, source).slice(0, 12);
        } catch {
            return [];
        }
    });

    const results = await Promise.all(feedPromises);
    return results.flat();
}

async function fetchFromNewsApi(apiKey) {
    if (!apiKey) return [];
    const query = `
        (
            "غوغل" OR "آبل" OR "مايكروسوفت" OR "ميتا" OR "تسلا" OR "OpenAI" OR
            "آيفون" OR "ChatGPT" OR "بلايستيشن" OR "اكسبوكس" OR "نينتندو" OR "ستيم" OR 
            "ألعاب فيديو" OR "أمن سيبراني" OR "ثغرة" OR
            "ذكاء اصطناعي" OR "تكنولوجيا" OR "عملة رقمية"
        ) 
        NOT (سياسة OR حرب OR اقتصاد OR رياضة OR 
            غزة OR إسرائيل OR فلسطين OR الاحتلال OR قصف OR 
            نتنياهو OR اسرائيل OR إيران OR سوريا OR الضفة OR حماس OR القدس)
    `;

    const apiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=ar&sortBy=publishedAt&pageSize=30&apiKey=${apiKey}`;
    try {
        const res = await fetch(apiUrl);
        if (!res.ok) return [];
        const data = await res.json();
        if (!Array.isArray(data.articles)) return [];

        return data.articles
            .filter(a => a && a.title && a.url)
            .map(a => {
                let sourceOrigin = '';
                try {
                    sourceOrigin = new URL(a.url).origin;
                } catch {
                    sourceOrigin = a.url;
                }
                const cleanDesc = stripHtml(a.description || '');
                const cleanContent = stripHtml(a.content || a.description || '');
                return {
                    title: stripHtml(a.title),
                    description: cleanDesc,
                    content: cleanContent,
                    url: a.url,
                    urlToImage: a.urlToImage || null,
                    publishedAt: a.publishedAt || new Date().toISOString(),
                    author: a.author || (a.source && a.source.name) || 'محرر الأخبار',
                    category: detectCategory(a.title, cleanDesc, 'tech'),
                    source: {
                        id: (a.source && a.source.id) || null,
                        name: (a.source && a.source.name) || 'مصدر إخباري',
                        url: sourceOrigin
                    }
                };
            });
    } catch {
        return [];
    }
}

export default async function handler(request, response) {
    try {
        const apiKey = process.env.NEWS_API_KEY;

        const [rssArticles, newsApiArticles] = await Promise.all([
            fetchRssFeeds(),
            fetchFromNewsApi(apiKey)
        ]);

        // دمج الأخبار وإزالة التكرار مع الحفاظ على المصدر الأصلي لكل مقال
        const combined = [...rssArticles, ...newsApiArticles];
        const seenUrls = new Set();
        const seenTitles = new Set();

        const uniqueArticles = combined.filter(article => {
            const normUrl = (article.url || '').trim().toLowerCase();
            const normTitle = (article.title || '').trim().toLowerCase();
            if (!normUrl || !normTitle) return false;
            if (seenUrls.has(normUrl) || seenTitles.has(normTitle)) return false;
            seenUrls.add(normUrl);
            seenTitles.add(normTitle);
            return true;
        });

        uniqueArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

        response.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=300');
        return response.status(200).json({
            status: 'ok',
            totalResults: uniqueArticles.length,
            copyrightNotice: 'جميع حقوق النشر محفوظة للمصادر الأصلية المذكورة مع كل خبر.',
            articles: uniqueArticles.slice(0, 60)
        });
    } catch (error) {
        console.error('Internal Server Error:', error);
        return response.status(500).json({ error: error.message || 'حدث خطأ أثناء جلب الأخبار' });
    }
}
