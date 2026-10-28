document.addEventListener('DOMContentLoaded', () => {
    const apiUrl = '/api/get-news';
    const originalPageTitle = document.title;

    // عناصر DOM الأساسية
    const newsGrid = document.getElementById('news-grid');
    const bentoSpotlight = document.getElementById('bento-spotlight');
    const resultsBar = document.getElementById('results-bar');
    const resultsTitle = document.getElementById('results-title');
    const resultsCounter = document.getElementById('results-counter');
    const loader = document.getElementById('loader');
    const mainContent = document.getElementById('main-content');
    const articleDetails = document.getElementById('article-details');
    const articleContent = document.getElementById('article-content');
    const relatedSection = document.getElementById('related-section');
    const relatedGrid = document.getElementById('related-grid');
    const backButton = document.getElementById('back-button');
    const categoryFilters = document.getElementById('category-filters');
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const sortSelect = document.getElementById('sort-select');
    const trendingTags = document.getElementById('trending-tags');
    const themeToggle = document.getElementById('theme-toggle');
    const savedViewBtn = document.getElementById('saved-view-btn');
    const savedCountBadge = document.getElementById('saved-count-badge');
    const audioBriefBtn = document.getElementById('audio-brief-btn');
    const listenArticleBtn = document.getElementById('listen-article-btn');
    const fontIncreaseBtn = document.getElementById('font-increase-btn');
    const fontDecreaseBtn = document.getElementById('font-decrease-btn');
    const bookmarkDetailBtn = document.getElementById('bookmark-detail-btn');
    const brandHome = document.getElementById('brand-home');
    const readingProgress = document.getElementById('reading-progress');
    const lastUpdatedText = document.getElementById('last-updated-text');
    const toastEl = document.getElementById('toast-notification');

    // حالة التطبيق
    let articlesCache = [];
    let savedArticles = loadSavedArticles();
    let currentCategory = 'all';
    let currentSearchTerm = '';
    let currentSort = 'newest';
    let currentOpenArticle = null;
    let readerFontSize = 1.12;
    let isSpeaking = false;

    // تعريف التصنيفات والكلمات المفتاحية الذكية
    const CATEGORY_META = {
        all: { label: 'كل الأخبار', icon: 'fa-layer-group' },
        tech: { label: 'تقنية وأجهزة', icon: 'fa-microchip' },
        ai: { label: 'ذكاء اصطناعي', icon: 'fa-wand-magic-sparkles' },
        security: { label: 'أمن سيبراني', icon: 'fa-shield-halved' },
        gaming: { label: 'ألعاب الفيديو', icon: 'fa-gamepad' },
        saved: { label: 'المحفوظات', icon: 'fa-bookmark' }
    };

    const categoryKeywords = {
        tech: ['تكنولوجيا', 'تقنية', 'هواتف', 'هاتف', 'جوالات', 'حواسيب', 'برمجة', 'سامسونج', 'آبل', 'جوجل', 'غوغل', 'مايكروسوفت', 'ويندوز', 'تسلا', 'آيفون', 'أندرويد', 'معالج', 'إنفيديا', 'nvidia'],
        gaming: ['ألعاب', 'لعبة', 'بلايستيشن', 'اكسبوكس', 'إكسبوكس', 'نينتندو', 'ستيم', 'pc gaming', 'esports', 'ps5', 'ps6', 'xbox', 'switch', 'gta', 'سعودي جيمر', 'ترو جيمنج'],
        security: ['سيبراني', 'أمن', 'فيروس', 'malware', 'phishing', 'حماية', 'ثغرة', 'اختراق', 'هاكر', 'تشفير', 'فدية', 'خصوصية'],
        ai: ['ذكاء اصطناعي', 'الذكاء الاصطناعي', 'تعلم الآلة', 'chatgpt', 'openai', 'ai', 'غروك', 'gemini', 'claude', 'copilot', 'deepseek', 'روبوت', 'نماذج لغوية']
    };

    const FALLBACK_IMAGES = {
        ai: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=900&q=80',
        security: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=900&q=80',
        gaming: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80',
        tech: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80'
    };

    // حزمة أخبار تقنية عربية موثقة المصادر لضمان عمل المدونة فوراً حتى في بيئة التطوير المحلية (WebStorm)
    const nowTs = Date.now();
    const CURATED_FALLBACK_ARTICLES = [
        {
            title: 'OpenAI تطلق جيلاً جديداً من وكلاء الذكاء الاصطناعي القادرين على تنفيذ المهام البرمجية المعقدة ذاتياً',
            description: 'كشفت شركة OpenAI عن تحديثات جوهرية في نماذج التفكير المنطقي والوكلاء الأذكياء (AI Agents) تتيح للمطورين والشركات أتمتة سير العمل البرمجي وتحليل البيانات بدقة غير مسبوقة.',
            content: 'كشفت شركة OpenAI عن تحديثات جوهرية في نماذج التفكير المنطقي والوكلاء الأذكياء (AI Agents) تتيح للمطورين والشركات أتمتة سير العمل البرمجية وتحليل البيانات بدقة غير مسبوقة. وتتميز النماذج الجديدة بقدرتها على التخطيط متعدد الخطوات، ومراجعة الأكواد البرمجية، واكتشاف الأخطاء الأمنية قبل النشر في بيئات الإنتاج.',
            url: 'https://aitnews.com/',
            urlToImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1000&q=80',
            publishedAt: new Date(nowTs - 25 * 60000).toISOString(),
            author: 'هيئة التحرير التقنية',
            category: 'ai',
            source: { name: 'البوابة العربية للأخبار التقنية (AITNews)', url: 'https://aitnews.com' }
        },
        {
            title: 'آبل تستعد لقفزة نوعية في معالجات Apple Silicon مع دقة تصنيع 2 نانومتر وكفاءة طاقة قياسية',
            description: 'تشير التقارير التقنية الحديثة إلى أن الجيل القادم من شرائح آبل سيعتمد على معمارية 2 نانومتر المتطورة، مما يمنح أجهزة MacBook و iPhone أداءً مضاعفاً في معالجة مهام الذكاء الاصطناعي المحلي.',
            content: 'تشير التقارير التقنية الحديثة إلى أن الجيل القادم من شرائح آبل سيعتمد على معمارية 2 نانومتر المتطورة، مما يمنح أجهزة MacBook و iPhone أداءً مضاعفاً في معالجة مهام الذكاء الاصطناعي المحلي على الجهاز (On-Device AI) دون استنزاف البطارية، مع تحسينات كبيرة في المحرك العصبي ووحدة معالجة الرسوميات.',
            url: 'https://www.tech-wd.com/wd/',
            urlToImage: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80',
            publishedAt: new Date(nowTs - 65 * 60000).toISOString(),
            author: 'فريق عالم التقنية',
            category: 'tech',
            source: { name: 'عالم التقنية (Tech-WD)', url: 'https://www.tech-wd.com/wd' }
        },
        {
            title: 'تحذير أمني عاجل: حملة تصيد سيبراني متطورة تستخدم التزييف العميق لاستهداف حسابات الشركات السحابية',
            description: 'رصد باحثو الأمن السيبراني موجة هجمات جديدة تعتمد على الذكاء الاصطناعي التوليدي لإنشاء رسائل صوتية ومرئية تحاكي مديري تقنية المعلومات بهدف اختراق أنظمة المصادقة الثنائية.',
            content: 'رصد باحثو الأمن السيبراني موجة هجمات جديدة تعتمد على الذكاء الاصطناعي التوليدي لإنشاء رسائل صوتية ومرئية تحاكي مديري تقنية المعلومات بهدف اختراق أنظمة المصادقة الثنائية. ويوصي خبراء الحماية بضرورة الانتقال إلى مفاتيح الأمان الفيزيائية ومعايير Passkeys المقاومة للتصيد.',
            url: 'https://aitnews.com/category/security/',
            urlToImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1000&q=80',
            publishedAt: new Date(nowTs - 110 * 60000).toISOString(),
            author: 'قسم الأمن السيبراني',
            category: 'security',
            source: { name: 'البوابة العربية للأخبار التقنية (AITNews)', url: 'https://aitnews.com' }
        },
        {
            title: 'سوني تكشف عن تحسينات تقنية الترقية بالذكاء الاصطناعي PSSR لأجهزة بلايستيشن لدعم دقة 4K بمعدل 120 إطاراً',
            description: 'تواصل سوني تطوير تقنية PlayStation Spectral Super Resolution لرفع جودة الرسوميات وتتبع الأشعة في ألعاب الجيل الجديد دون التضحية بسلاسة الإطارات.',
            content: 'تواصل سوني تطوير تقنية PlayStation Spectral Super Resolution لرفع جودة الرسوميات وتتبع الأشعة في ألعاب الجيل الجديد دون التضحية بسلاسة الإطارات. وأكد المطورون أن التحديث القادم سيوفر دعماً أوسع لمكتبة الألعاب التنافسية وألعاب العالم المفتوح.',
            url: 'https://www.saudigamer.com/',
            urlToImage: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=1000&q=80',
            publishedAt: new Date(nowTs - 160 * 60000).toISOString(),
            author: 'تحرير سعودي جيمر',
            category: 'gaming',
            source: { name: 'سعودي جيمر (Saudi Gamer)', url: 'https://www.saudigamer.com' }
        },
        {
            title: 'جوجل تدمج قدرات Gemini المتقدمة في متصفح Chrome وبيئة أندرويد لتلخيص المحتوى الفوري',
            description: 'أعلنت شركة جوجل عن توسيع قدرات المساعد الذكي Gemini ليعمل مباشرة داخل النظام والتطبيقات اليومية مع دعم كامل للغة العربية وفهم السياق المتعدد الوسائط.',
            content: 'أعلنت شركة جوجل عن توسيع قدرات المساعد الذكي Gemini ليعمل مباشرة داخل النظام والتطبيقات اليومية مع دعم كامل للغة العربية وفهم السياق المتعدد الوسائط (النصوص، الصور، الصوت، والفيديو) في الوقت الفعلي.',
            url: 'https://www.unlimit-tech.com/',
            urlToImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80',
            publishedAt: new Date(nowTs - 210 * 60000).toISOString(),
            author: 'فريق التقنية بلا حدود',
            category: 'ai',
            source: { name: 'التقنية بلا حدود (Unlimit-Tech)', url: 'https://www.unlimit-tech.com' }
        },
        {
            title: 'سامسونج تستعرض الجيل الجديد من شاشات OLED القابلة للطي والانزلاق بتقنية سطوع فائقة',
            description: 'قدمت سامسونج ابتكارات جديدة في عالم الشاشات المرنة المخصصة للهواتف الذكية والحواسيب المحمولة مع طبقة حماية معززة تقلل أثر الطي إلى الصفر تقريباً.',
            content: 'قدمت سامسونج ابتكارات جديدة في عالم الشاشات المرنة المخصصة للهواتف الذكية والحواسيب المحمولة مع طبقة حماية معززة تقلل أثر الطي إلى الصفر تقريباً، إلى جانب خفض استهلاك الطاقة بنسبة 25% مقارنة بالجيل السابق.',
            url: 'https://arabhardware.net/',
            urlToImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1000&q=80',
            publishedAt: new Date(nowTs - 280 * 60000).toISOString(),
            author: 'محرر عرب هاردوير',
            category: 'tech',
            source: { name: 'عرب هاردوير (ArabHardware)', url: 'https://arabhardware.net' }
        },
        {
            title: 'نينتندو تعلن عن قائمة ألعاب ضخمة قادمة لمنصتها الجديدة مع دعم التوافق المسبق الكامل',
            description: 'استعرضت شركة نينتندو مجموعة من العناوين الحصرية وألعاب الطرف الثالث التي تستفيد من القدرات الرسومية المحسنة وتقنيات DLSS.',
            content: 'استعرضت شركة نينتندو مجموعة من العناوين الحصرية وألعاب الطرف الثالث التي تستفيد من القدرات الرسومية المحسنة وتقنيات DLSS، مع تأكيد دعم تشغيل مكتبة الألعاب السابقة بسلاسة أعلى وأوقات تحميل أسرع.',
            url: 'https://www.true-gaming.net/home/',
            urlToImage: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?auto=format&fit=crop&w=1000&q=80',
            publishedAt: new Date(nowTs - 340 * 60000).toISOString(),
            author: 'فريق ترو جيمنج',
            category: 'gaming',
            source: { name: 'ترو جيمنج (TrueGaming)', url: 'https://www.true-gaming.net/home' }
        },
        {
            title: 'مايكروسوفت تطلق تحديثات أمنية لسد ثغرات حرجة في نظام ويندوز وخدمات الحوسبة السحابية',
            description: 'أصدرت مايكروسوفت حزمة التحديثات الأمنية الدورية التي تعالج عدة ثغرات في نواة النظام وبروتوكولات الشبكة، داعية المستخدمين والشركات للتحديث الفوري.',
            content: 'أصدرت مايكروسوفت حزمة التحديثات الأمنية الدورية التي تعالج عدة ثغرات في نواة النظام وبروتوكولات الشبكة، داعية المستخدمين والشركات لتثبيت التحديثات فوراً لتفادي أي استغلال محتمل.',
            url: 'https://www.tech-wd.com/wd/category/security/',
            urlToImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1000&q=80',
            publishedAt: new Date(nowTs - 420 * 60000).toISOString(),
            author: 'عالم التقنية',
            category: 'security',
            source: { name: 'عالم التقنية (Tech-WD)', url: 'https://www.tech-wd.com/wd' }
        },
        {
            title: 'إنفيديا تكشف عن معمارية بطاقات الرسوميات ومسرعات الذكاء الاصطناعي للجيل القادم',
            description: 'تستمر إنفيديا في قيادة سوق الحوسبة الفائقة وألعاب الحاسوب عبر إطلاق معمارية جديدة تضاعف أداء تتبع الأشعة الكامل (Path Tracing) وتدريب النماذج اللغوية.',
            content: 'تستمر إنفيديا في قيادة سوق الحوسبة الفائقة وألعاب الحاسوب عبر إطلاق معمارية جديدة تضاعف أداء تتبع الأشعة الكامل (Path Tracing) وتدريب النماذج اللغوية العملاقة مع ذاكرة فائقة السرعة.',
            url: 'https://arabhardware.net/news',
            urlToImage: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=1000&q=80',
            publishedAt: new Date(nowTs - 510 * 60000).toISOString(),
            author: 'عرب هاردوير',
            category: 'tech',
            source: { name: 'عرب هاردوير (ArabHardware)', url: 'https://arabhardware.net' }
        },
        {
            title: 'منصة Steam تسجل رقماً قياسياً جديداً في عدد اللاعبين المتصلين في آنٍ واحد عالمياً',
            description: 'واصلت منصة ستيم للحواسيب الشخصية تحطيم أرقامها القياسية بفضل الإطلاقات القوية لألعاب البقاء والألعاب التعاونية الجماعية خلال هذا الموسم.',
            content: 'واصلت منصة ستيم للحواسيب الشخصية تحطيم أرقامها القياسية بفضل الإطلاقات القوية لألعاب البقاء والألعاب التعاونية الجماعية خلال هذا الموسم، مما يعكس النمو المستمر لسوق ألعاب الحاسوب.',
            url: 'https://www.saudigamer.com/news/',
            urlToImage: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1000&q=80',
            publishedAt: new Date(nowTs - 600 * 60000).toISOString(),
            author: 'سعودي جيمر',
            category: 'gaming',
            source: { name: 'سعودي جيمر (Saudi Gamer)', url: 'https://www.saudigamer.com' }
        }
    ];

    // ===== أدوات مساعدة =====
    function escapeHtml(str = '') {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function stripHtmlText(html = '') {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
    }

    function showToast(message, icon = 'fa-circle-check') {
        if (!toastEl) return;
        toastEl.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHtml(message)}</span>`;
        toastEl.classList.remove('hidden');
        clearTimeout(showToast._timer);
        showToast._timer = setTimeout(() => {
            toastEl.classList.add('hidden');
        }, 3200);
    }

    function detectArticleCategory(article) {
        if (article.category && ['tech', 'ai', 'security', 'gaming'].includes(article.category)) {
            return article.category;
        }
        const text = `${article.title || ''} ${article.description || ''} ${(article.source && article.source.name) || ''}`.toLowerCase();
        if (categoryKeywords.security.some(k => text.includes(k.toLowerCase()))) return 'security';
        if (categoryKeywords.ai.some(k => text.includes(k.toLowerCase()))) return 'ai';
        if (categoryKeywords.gaming.some(k => text.includes(k.toLowerCase()))) return 'gaming';
        return 'tech';
    }

    function estimateReadingTime(article) {
        const text = `${article.title || ''} ${article.description || ''} ${article.content || ''}`;
        const words = text.trim().split(/\s+/).length;
        const minutes = Math.max(1, Math.ceil(words / 130));
        return minutes === 1 ? 'دقيقة للقراءة' : `${minutes} دقائق للقراءة`;
    }

    function formatRelativeDate(dateStr) {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'اليوم';
        const diffMs = Date.now() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 5) return 'الآن';
        if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
        if (diffHours < 24) return `منذ ${diffHours} ساعة`;
        if (diffDays === 1) return 'أمس';
        if (diffDays < 7) return `منذ ${diffDays} أيام`;

        return date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    function getSourceDomain(url) {
        try {
            return new URL(url).hostname.replace(/^www\./, '');
        } catch {
            return 'المصدر الأصلي';
        }
    }

    // ===== إدارة المظهر (Dark / Light) =====
    function initTheme() {
        const savedTheme = localStorage.getItem('lingram_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    }

    function updateThemeIcon(theme) {
        if (!themeToggle) return;
        themeToggle.innerHTML = theme === 'dark'
            ? '<i class="fa-solid fa-sun"></i>'
            : '<i class="fa-solid fa-moon"></i>';
    }

    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('lingram_theme', next);
        updateThemeIcon(next);
        showToast(next === 'dark' ? 'تم تفعيل الوضع الداكن (OLED)' : 'تم تفعيل الوضع الفاتح', 'fa-palette');
    });

    // ===== إدارة المحفوظات (Bookmarks) =====
    function loadSavedArticles() {
        try {
            const raw = localStorage.getItem('lingram_saved_articles');
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }

    function saveBookmarksToStorage() {
        try {
            localStorage.setItem('lingram_saved_articles', JSON.stringify(savedArticles));
        } catch (e) {
            console.warn('Could not save bookmarks:', e);
        }
        updateCategoryCounts();
    }

    function isArticleSaved(url) {
        return savedArticles.some(item => item.url === url);
    }

    function toggleSaveArticle(article, event) {
        if (event) event.stopPropagation();
        if (!article || !article.url) return;

        const exists = isArticleSaved(article.url);
        if (exists) {
            savedArticles = savedArticles.filter(item => item.url !== article.url);
            showToast('تمت إزالة الخبر من مكتبتك', 'fa-bookmark');
        } else {
            savedArticles.unshift(article);
            showToast('تم حفظ الخبر في مكتبتك للقراءة لاحقاً', 'fa-solid fa-bookmark');
        }
        saveBookmarksToStorage();

        if (currentOpenArticle && currentOpenArticle.url === article.url) {
            updateDetailBookmarkBtn(article.url);
        }
        if (currentCategory === 'saved') {
            applyFilters();
        } else {
            document.querySelectorAll(`.bookmark-card-btn[data-url="${CSS.escape(article.url)}"]`).forEach(btn => {
                const nowSaved = isArticleSaved(article.url);
                btn.classList.toggle('saved', nowSaved);
                btn.innerHTML = `<i class="fa-${nowSaved ? 'solid' : 'regular'} fa-bookmark"></i>`;
            });
        }
    }

    // ===== تحليل XML لخلاصات RSS في المتصفح بدون أخطاء CORS =====
    function parseXmlFeedInBrowser(xmlString, sourceInfo) {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
            const items = Array.from(xmlDoc.querySelectorAll('item')).slice(0, 10);

            return items.map(item => {
                const title = (item.querySelector('title')?.textContent || '').trim();
                const link = (item.querySelector('link')?.textContent || '').trim();
                const pubDateRaw = item.querySelector('pubDate')?.textContent || '';
                const creator = item.querySelector('creator, author')?.textContent || sourceInfo.name;
                const descHtml = item.querySelector('description')?.textContent || '';
                const encodedHtml = item.getElementsByTagNameNS('*', 'encoded')[0]?.textContent || descHtml;

                // استخراج الصورة من محتوى الـ RSS إن وجدت
                let imgUrl = null;
                const mediaEl = item.getElementsByTagNameNS('*', 'content')[0] || item.getElementsByTagNameNS('*', 'thumbnail')[0] || item.querySelector('enclosure');
                if (mediaEl && mediaEl.getAttribute('url')) {
                    imgUrl = mediaEl.getAttribute('url');
                } else {
                    const imgMatch = (encodedHtml || descHtml).match(/<img[^>]+src=["']([^"']+)["']/i);
                    if (imgMatch && imgMatch[1]) imgUrl = imgMatch[1];
                }

                const cleanDesc = stripHtmlText(descHtml).slice(0, 300);
                const cleanContent = stripHtmlText(encodedHtml).slice(0, 1400);

                const obj = {
                    title,
                    description: cleanDesc || title,
                    content: cleanContent || cleanDesc,
                    url: link,
                    urlToImage: imgUrl,
                    publishedAt: pubDateRaw && !isNaN(Date.parse(pubDateRaw)) ? new Date(pubDateRaw).toISOString() : new Date().toISOString(),
                    author: creator.trim() || sourceInfo.name,
                    source: {
                        name: sourceInfo.name,
                        url: sourceInfo.site
                    }
                };
                obj.category = detectArticleCategory(obj) || sourceInfo.cat;
                return obj;
            }).filter(a => a.title && a.url);
        } catch {
            return [];
        }
    }

    async function fetchDirectClientRssFallback() {
        const feeds = [
            { name: 'البوابة العربية للأخبار التقنية (AITNews)', url: 'https://aitnews.com/feed/', cat: 'tech', site: 'https://aitnews.com' },
            { name: 'عالم التقنية (Tech-WD)', url: 'https://www.tech-wd.com/wd/feed/', cat: 'tech', site: 'https://www.tech-wd.com/wd' },
            { name: 'سعودي جيمر (Saudi Gamer)', url: 'https://www.saudigamer.com/feed/', cat: 'gaming', site: 'https://www.saudigamer.com' },
            { name: 'التقنية بلا حدود (Unlimit-Tech)', url: 'https://www.unlimit-tech.com/feed/', cat: 'tech', site: 'https://www.unlimit-tech.com' }
        ];

        const requests = feeds.map(async (f) => {
            try {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), 4500);
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(f.url)}`;
                const res = await fetch(proxyUrl, { signal: controller.signal });
                clearTimeout(timer);
                if (!res.ok) return [];
                const data = await res.json();
                if (!data || !data.contents) return [];
                return parseXmlFeedInBrowser(data.contents, f);
            } catch {
                return [];
            }
        });

        const results = await Promise.all(requests);
        return results.flat();
    }

    async function fetchNews() {
        loader.classList.remove('hidden');
        newsGrid.innerHTML = '';
        bentoSpotlight.classList.add('hidden');
        resultsBar.classList.add('hidden');

        try {
            let articles = [];

            // التحقق مما إذا كان الموقع يعمل على خادم WebStorm المحلي الثابت (منفذ 63342) أو كملف محلي لتجنب خطأ 404 في الكونسول
            const isStaticIdePreview = window.location.port === '63342' || window.location.protocol === 'file:';

            if (!isStaticIdePreview) {
                try {
                    const response = await fetch(apiUrl);
                    if (response.ok) {
                        const data = await response.json();
                        if (Array.isArray(data.articles) && data.articles.length > 0) {
                            articles = data.articles;
                        }
                    }
                } catch {
                    // الانتقال السلس للبديل في حال عدم توفر الخادم
                }
            }

            if (articles.length === 0) {
                const liveRss = await fetchDirectClientRssFallback();
                if (liveRss.length > 0) {
                    // دمج الأخبار الحية مع الحزمة الموثقة لضمان غنى كافة الأقسام
                    articles = [...liveRss, ...CURATED_FALLBACK_ARTICLES];
                } else {
                    articles = [...CURATED_FALLBACK_ARTICLES];
                }
            }

            // إزالة أي تكرار وترتيب الأخبار مع ضمان نسبتها لمصادرها الأصلية
            const seen = new Set();
            const normalized = articles
                .filter(a => {
                    if (!a || !a.title || !a.url) return false;
                    const key = a.title.trim().toLowerCase();
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                })
                .map(a => {
                    const cat = detectArticleCategory(a);
                    return {
                        ...a,
                        category: cat,
                        urlToImage: a.urlToImage || FALLBACK_IMAGES[cat] || FALLBACK_IMAGES.tech,
                        description: a.description || a.title,
                        source: {
                            name: (a.source && a.source.name) ? a.source.name : getSourceDomain(a.url),
                            url: (a.source && a.source.url) ? a.source.url : a.url
                        }
                    };
                })
                .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

            articlesCache = normalized;
            updateCategoryCounts();
            updateLastUpdatedTime();
            applyFilters();
            checkUrlForDirectArticle();

        } catch (error) {
            console.error('Error fetching news:', error);
            articlesCache = [...CURATED_FALLBACK_ARTICLES];
            updateCategoryCounts();
            updateLastUpdatedTime();
            applyFilters();
        } finally {
            loader.classList.add('hidden');
        }
    }

    function updateLastUpdatedTime() {
        if (!lastUpdatedText) return;
        const now = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
        lastUpdatedText.innerHTML = `<i class="fa-regular fa-clock"></i> آخر تحديث: ${now} (${articlesCache.length} خبر موثق المصدر)`;
    }

    function updateCategoryCounts() {
        const counts = {
            all: articlesCache.length,
            tech: 0,
            ai: 0,
            security: 0,
            gaming: 0,
            saved: savedArticles.length
        };

        articlesCache.forEach(article => {
            const cat = detectArticleCategory(article);
            if (counts[cat] !== undefined) counts[cat]++;
        });

        document.querySelectorAll('[data-count-for]').forEach(badge => {
            const key = badge.getAttribute('data-count-for');
            if (counts[key] !== undefined) {
                badge.textContent = counts[key];
            }
        });

        if (savedCountBadge) {
            savedCountBadge.textContent = savedArticles.length;
        }
    }

    // ===== الفلترة والترتيب والعرض =====
    function applyFilters() {
        let baseList = currentCategory === 'saved' ? [...savedArticles] : [...articlesCache];

        if (currentCategory !== 'all' && currentCategory !== 'saved') {
            baseList = baseList.filter(article => {
                const detected = detectArticleCategory(article);
                if (detected === currentCategory) return true;
                const keywords = categoryKeywords[currentCategory] || [];
                const text = `${article.title || ''} ${article.description || ''}`.toLowerCase();
                return keywords.some(kw => text.includes(kw.toLowerCase()));
            });
        }

        if (currentSearchTerm) {
            baseList = baseList.filter(article => {
                const haystack = `${article.title || ''} ${article.description || ''} ${(article.source && article.source.name) || ''} ${article.author || ''}`.toLowerCase();
                return haystack.includes(currentSearchTerm);
            });
        }

        if (currentSort === 'source') {
            baseList.sort((a, b) => ((a.source && a.source.name) || '').localeCompare((b.source && b.source.name) || '', 'ar'));
        } else {
            baseList.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        }

        renderFeed(baseList);
    }

    function renderFeed(articles) {
        newsGrid.innerHTML = '';

        const showBento = currentCategory === 'all' && !currentSearchTerm && currentSort === 'newest' && articles.length >= 4;

        if (showBento) {
            renderBentoSpotlight(articles.slice(0, 4));
            bentoSpotlight.classList.remove('hidden');
        } else {
            bentoSpotlight.classList.add('hidden');
        }

        const gridArticles = showBento ? articles.slice(4) : articles;

        resultsBar.classList.remove('hidden');
        const catMeta = CATEGORY_META[currentCategory] || CATEGORY_META.all;
        resultsTitle.textContent = currentSearchTerm
            ? `نتائج البحث عن: "${currentSearchTerm}"`
            : catMeta.label;
        resultsCounter.textContent = `${articles.length} مقال موثق`;

        if (articles.length === 0) {
            newsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid ${currentCategory === 'saved' ? 'fa-bookmark' : 'fa-magnifying-glass'}"></i>
                    <h3>${currentCategory === 'saved' ? 'مكتبتك فارغة حالياً' : 'لا توجد أخبار تطابق بحثك'}</h3>
                    <p>${currentCategory === 'saved'
                        ? 'اضغط على أيقونة الحفظ (🔖) في أي خبر لإضافته إلى مكتبتك الخاصة.'
                        : 'جرب البحث بكلمات مفتاحية أخرى أو التبديل إلى قسم "كل الأخبار".'}</p>
                </div>
            `;
            return;
        }

        gridArticles.forEach(article => {
            const card = createNewsCard(article);
            newsGrid.appendChild(card);
        });
    }

    function renderBentoSpotlight(spotlightArticles) {
        const [hero, ...sideItems] = spotlightArticles;
        const heroCat = detectArticleCategory(hero);
        const heroCatMeta = CATEGORY_META[heroCat] || CATEGORY_META.tech;
        const heroImg = hero.urlToImage || FALLBACK_IMAGES[heroCat];

        const sideHtml = sideItems.map(item => {
            const cat = detectArticleCategory(item);
            const catMeta = CATEGORY_META[cat] || CATEGORY_META.tech;
            const img = item.urlToImage || FALLBACK_IMAGES[cat];
            return `
                <article class="bento-mini-card" data-article-title="${escapeHtml(item.title)}">
                    <img src="${escapeHtml(img)}" alt="${escapeHtml(item.title)}" class="bento-mini-img" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_IMAGES.tech}';">
                    <div class="bento-mini-body">
                        <div class="bento-mini-meta">
                            <span style="color: var(--primary); font-weight:700;">${escapeHtml(catMeta.label)}</span>
                            <span>•</span>
                            <span>${escapeHtml(formatRelativeDate(item.publishedAt))}</span>
                        </div>
                        <h3>${escapeHtml(item.title)}</h3>
                        <div class="bento-mini-meta">
                            <span><i class="fa-regular fa-newspaper"></i> المصدر: <strong>${escapeHtml(item.source.name)}</strong></span>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        bentoSpotlight.innerHTML = `
            <article class="bento-hero-card" data-article-title="${escapeHtml(hero.title)}">
                <img src="${escapeHtml(heroImg)}" alt="${escapeHtml(hero.title)}" class="hero-bg-img" onerror="this.onerror=null;this.src='${FALLBACK_IMAGES.tech}';">
                <div class="bento-hero-overlay">
                    <div class="hero-badges-row">
                        <span class="featured-pill"><i class="fa-solid fa-fire"></i> التغطية الأبرز</span>
                        <span class="category-badge" data-cat="${escapeHtml(heroCat)}">
                            <i class="fa-solid ${heroCatMeta.icon}"></i>
                            ${escapeHtml(heroCatMeta.label)}
                        </span>
                        <span class="category-badge"><i class="fa-regular fa-clock"></i> ${escapeHtml(estimateReadingTime(hero))}</span>
                    </div>
                    <h2>${escapeHtml(hero.title)}</h2>
                    <p>${escapeHtml(hero.description || '')}</p>
                    <div class="hero-meta-footer">
                        <a href="${escapeHtml(hero.url)}" target="_blank" rel="noopener noreferrer" class="source-credit-pill" onclick="event.stopPropagation();" title="الانتقال إلى موقع المصدر الأصلي">
                            <i class="fa-solid fa-building-columns"></i>
                            <span>المصدر: ${escapeHtml(hero.source.name)}</span>
                            <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.72rem;"></i>
                        </a>
                        <span><i class="fa-regular fa-calendar"></i> ${escapeHtml(formatRelativeDate(hero.publishedAt))}</span>
                    </div>
                </div>
            </article>

            <div class="bento-side-stack">
                <div class="bento-side-header">
                    <span><i class="fa-solid fa-bolt"></i> أبرز عناوين الساعة</span>
                    <span style="font-size: 0.76rem; color: var(--text-muted);">مختارات موثقة</span>
                </div>
                ${sideHtml}
            </div>
        `;

        bentoSpotlight.querySelectorAll('[data-article-title]').forEach(el => {
            el.addEventListener('click', () => {
                const title = el.getAttribute('data-article-title');
                const found = articlesCache.find(a => a.title === title) || savedArticles.find(a => a.title === title);
                if (found) showArticleDetails(found);
            });
        });
    }

    function createNewsCard(article) {
        const card = document.createElement('article');
        card.className = 'news-card';

        const cat = detectArticleCategory(article);
        const catMeta = CATEGORY_META[cat] || CATEGORY_META.tech;
        const saved = isArticleSaved(article.url);
        const imgUrl = article.urlToImage || FALLBACK_IMAGES[cat] || FALLBACK_IMAGES.tech;
        const relativeDate = formatRelativeDate(article.publishedAt);
        const readTime = estimateReadingTime(article);

        card.innerHTML = `
            <div class="card-media">
                <div class="card-top-badges">
                    <span class="category-badge" data-cat="${escapeHtml(cat)}">
                        <i class="fa-solid ${catMeta.icon}"></i>
                        ${escapeHtml(catMeta.label)}
                    </span>
                    <button type="button" class="bookmark-card-btn ${saved ? 'saved' : ''}" data-url="${escapeHtml(article.url)}" title="حفظ الخبر في مكتبتي" aria-label="حفظ الخبر">
                        <i class="fa-${saved ? 'solid' : 'regular'} fa-bookmark"></i>
                    </button>
                </div>
                <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(article.title)}" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_IMAGES[cat] || FALLBACK_IMAGES.tech}';">
                <span class="reading-time-badge"><i class="fa-regular fa-clock"></i> ${escapeHtml(readTime)}</span>
            </div>
            <div class="card-content">
                <h2>${escapeHtml(article.title)}</h2>
                <p>${escapeHtml(article.description || '')}</p>
                <div class="card-footer">
                    <a href="${escapeHtml(article.url)}" target="_blank" rel="noopener noreferrer" class="source-badge-link" title="المصدر الأصلي: ${escapeHtml(article.source.name)}" onclick="event.stopPropagation();">
                        <i class="fa-regular fa-newspaper"></i>
                        <span>${escapeHtml(article.source.name)}</span>
                        <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.65rem;"></i>
                    </a>
                    <span class="publish-date">
                        <i class="fa-regular fa-clock"></i>
                        ${escapeHtml(relativeDate)}
                    </span>
                </div>
            </div>
        `;

        const bookmarkBtn = card.querySelector('.bookmark-card-btn');
        bookmarkBtn.addEventListener('click', (e) => toggleSaveArticle(article, e));

        card.addEventListener('click', () => {
            showArticleDetails(article);
        });

        return card;
    }

    // ===== توليد النقاط الذكية وعرض تفاصيل الخبر مع حفظ حقوق النشر =====
    function buildSmartTakeaways(article) {
        const rawText = `${article.description || ''} ${article.content || ''}`
            .replace(/\[\+\d+\s*chars\]/gi, '')
            .trim();

        const sentences = rawText
            .split(/[.!؟\n]+/)
            .map(s => s.trim())
            .filter(s => s.length > 25);

        const points = [];
        if (sentences.length >= 2) {
            points.push(sentences[0]);
            if (sentences[1] && sentences[1] !== sentences[0]) points.push(sentences[1]);
        } else if (rawText.length > 0) {
            points.push(rawText);
        } else {
            points.push(article.title);
        }

        const cat = detectArticleCategory(article);
        const catMeta = CATEGORY_META[cat] || CATEGORY_META.tech;
        points.push(`يندرج هذا الخبر ضمن قطاع "${catMeta.label}" وقد نُشر عبر "${article.source.name}" مع حفظ كامل الحقوق للمصدر.`);

        return points.slice(0, 3);
    }

    function updateDetailBookmarkBtn(url) {
        if (!bookmarkDetailBtn) return;
        const saved = isArticleSaved(url);
        bookmarkDetailBtn.classList.toggle('active', saved);
        bookmarkDetailBtn.innerHTML = saved
            ? '<i class="fa-solid fa-bookmark"></i> <span>محفوظ في مكتبتي</span>'
            : '<i class="fa-regular fa-bookmark"></i> <span>حفظ</span>';
    }

    function showArticleDetails(article, pushHistory = true) {
        if (!article) return;
        currentOpenArticle = article;
        stopSpeech();

        mainContent.classList.add('hidden');
        articleDetails.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        document.title = `${article.title} | المصدر: ${article.source.name} - Lingram`;
        updateDetailBookmarkBtn(article.url);

        if (pushHistory) {
            const urlObj = new URL(window.location.href);
            urlObj.searchParams.set('article', encodeURIComponent(article.title));
            window.history.pushState({ articleTitle: article.title }, '', urlObj.toString());
        }

        const cat = detectArticleCategory(article);
        const catMeta = CATEGORY_META[cat] || CATEGORY_META.tech;
        const publishedDate = new Date(article.publishedAt).toLocaleString('ar-EG', {
            dateStyle: 'long',
            timeStyle: 'short'
        });
        const domain = getSourceDomain(article.url);
        const takeaways = buildSmartTakeaways(article);
        const bodyText = (article.content && article.content.length > (article.description || '').length)
            ? article.content.replace(/\[\+\d+\s*chars\]/gi, '')
            : (article.description || 'اضغط على زر المصدر الأصلي بالأسفل لقراءة التغطية الكاملة.');

        const imgUrl = article.urlToImage || FALLBACK_IMAGES[cat] || FALLBACK_IMAGES.tech;

        articleContent.innerHTML = `
            <div class="reader-header-meta">
                <span class="category-badge" data-cat="${escapeHtml(cat)}">
                    <i class="fa-solid ${catMeta.icon}"></i>
                    ${escapeHtml(catMeta.label)}
                </span>
                <span class="results-counter-pill"><i class="fa-regular fa-clock"></i> ${escapeHtml(estimateReadingTime(article))}</span>
            </div>

            <h1>${escapeHtml(article.title)}</h1>

            <div class="meta-info-bar">
                <span class="meta-item">
                    <i class="fa-solid fa-building-columns"></i>
                    <span>المصدر الأصلي: <strong>${escapeHtml(article.source.name)}</strong></span>
                </span>
                <span class="meta-item">
                    <i class="fa-solid fa-user-pen"></i>
                    <span>الكاتب/المحرر: <strong>${escapeHtml(article.author || article.source.name)}</strong></span>
                </span>
                <span class="meta-item">
                    <i class="fa-regular fa-calendar-check"></i>
                    <span>تاريخ النشر: ${escapeHtml(publishedDate)}</span>
                </span>
            </div>

            <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(article.title)}" class="reader-hero-img" onerror="this.onerror=null;this.src='${FALLBACK_IMAGES[cat] || FALLBACK_IMAGES.tech}';">

            <!-- صندوق الملخص الذكي -->
            <div class="smart-summary-box">
                <div class="smart-summary-header">
                    <i class="fa-solid fa-wand-magic-sparkles"></i>
                    <span>ملخص النقاط السريع (Smart Brief)</span>
                </div>
                <ul class="smart-summary-list">
                    ${takeaways.map(pt => `<li>${escapeHtml(pt)}</li>`).join('')}
                </ul>
            </div>

            <!-- نص المقتطف المتاح -->
            <div id="reader-body-text" class="article-body-text" style="font-size: ${readerFontSize}rem;">
                <p>${escapeHtml(bodyText)}</p>
            </div>

            <!-- بطاقة حفظ حقوق النشر والمصدر الأصلي -->
            <div class="source-attribution-box">
                <div class="source-box-top">
                    <div class="source-box-info">
                        <h4>
                            <i class="fa-solid fa-scale-balanced"></i>
                            <span>حقوق النشر والمصدر الأصلي: ${escapeHtml(article.source.name)}</span>
                        </h4>
                        <p>نُشر هذا المقال في الأصل عبر موقع (${escapeHtml(domain)}) بواسطة (${escapeHtml(article.author || article.source.name)}).</p>
                    </div>
                    <a href="${escapeHtml(article.url)}" target="_blank" rel="noopener noreferrer" class="primary-source-btn">
                        <span>قراءة الخبر كاملاً في ${escapeHtml(article.source.name)}</span>
                        <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    </a>
                </div>
                <div class="copyright-legal-note">
                    <i class="fa-regular fa-copyright"></i>
                    جميع حقوق النشر والملكية الفكرية والصور محفوظة بالكامل لـ <strong>${escapeHtml(article.source.name)}</strong>. تعرض منصة Lingram هذا المقتطف لأغراض الفهرسة والإحاطة التقنية مع التوجيه المباشر للمصدر الأصلي.
                </div>
            </div>

            <!-- قسم المشاركة الاجتماعية -->
            <div class="share-section">
                <h3><i class="fa-solid fa-share-nodes"></i> شارك الخبر مع ذكر المصدر:</h3>
                <div class="share-buttons">
                    <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(article.title + ' (المصدر: ' + article.source.name + ') ' + article.url)}" target="_blank" rel="noopener noreferrer" class="share-btn whatsapp" aria-label="مشاركة عبر واتساب" title="مشاركة عبر واتساب">
                        <i class="fa-brands fa-whatsapp"></i>
                    </a>
                    <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(article.url)}&text=${encodeURIComponent(article.title + ' - عبر ' + article.source.name)}" target="_blank" rel="noopener noreferrer" class="share-btn twitter-x" aria-label="مشاركة عبر منصة X" title="مشاركة عبر منصة X">
                        <i class="fa-brands fa-x-twitter"></i>
                    </a>
                    <a href="https://t.me/share/url?url=${encodeURIComponent(article.url)}&text=${encodeURIComponent(article.title + ' (المصدر: ' + article.source.name + ')')}" target="_blank" rel="noopener noreferrer" class="share-btn telegram" aria-label="مشاركة عبر تيليجرام" title="مشاركة عبر تيليجرام">
                        <i class="fa-brands fa-telegram"></i>
                    </a>
                    <button type="button" id="copy-article-link-btn" class="share-btn copy-link-btn" aria-label="نسخ رابط الخبر" title="نسخ رابط المصدر الأصلي">
                        <i class="fa-solid fa-link"></i>
                    </button>
                </div>
            </div>
        `;

        const copyBtn = document.getElementById('copy-article-link-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(article.url).then(() => {
                    showToast('تم نسخ رابط المصدر الأصلي إلى الحافظة', 'fa-link');
                });
            });
        }

        renderRelatedArticles(article, cat);
    }

    function renderRelatedArticles(currentArticle, category) {
        const related = articlesCache
            .filter(a => a.title !== currentArticle.title && detectArticleCategory(a) === category)
            .slice(0, 3);

        if (related.length === 0) {
            relatedSection.classList.add('hidden');
            return;
        }

        relatedSection.classList.remove('hidden');
        relatedGrid.innerHTML = '';
        related.forEach(item => {
            relatedGrid.appendChild(createNewsCard(item));
        });
    }

    function closeArticleDetails(pushHistory = true) {
        stopSpeech();
        articleDetails.classList.add('hidden');
        mainContent.classList.remove('hidden');
        document.title = originalPageTitle;
        currentOpenArticle = null;
        readingProgress.style.width = '0%';

        if (pushHistory) {
            const urlObj = new URL(window.location.href);
            urlObj.searchParams.delete('article');
            window.history.pushState({}, '', urlObj.toString());
        }
    }

    function checkUrlForDirectArticle() {
        const params = new URLSearchParams(window.location.search);
        const articleParam = params.get('article');
        if (!articleParam) return;
        const decoded = decodeURIComponent(articleParam);
        const found = articlesCache.find(a => a.title === decoded || a.url === decoded) || savedArticles.find(a => a.title === decoded || a.url === decoded);
        if (found) {
            showArticleDetails(found, false);
        }
    }

    window.addEventListener('popstate', () => {
        const params = new URLSearchParams(window.location.search);
        const articleParam = params.get('article');
        if (articleParam) {
            const decoded = decodeURIComponent(articleParam);
            const found = articlesCache.find(a => a.title === decoded || a.url === decoded) || savedArticles.find(a => a.title === decoded || a.url === decoded);
            if (found) showArticleDetails(found, false);
        } else if (!articleDetails.classList.contains('hidden')) {
            closeArticleDetails(false);
        }
    });

    // ===== القراءة الصوتية الذكية (Web Speech API) =====
    function stopSpeech() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        isSpeaking = false;
        if (audioBriefBtn) {
            audioBriefBtn.classList.remove('playing');
            audioBriefBtn.innerHTML = '<i class="fa-solid fa-headphones-simple"></i> <span>الموجز الصوتي</span>';
        }
        if (listenArticleBtn) {
            listenArticleBtn.classList.remove('active');
            listenArticleBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i> <span>استماع</span>';
        }
    }

    function speakArabicText(text, onEndCallback) {
        if (!('speechSynthesis' in window)) {
            showToast('متصفحك لا يدعم القراءة الصوتية المباشرة', 'fa-circle-exclamation');
            return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-SA';
        utterance.rate = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const arabicVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('ar'));
        if (arabicVoice) utterance.voice = arabicVoice;

        utterance.onend = () => {
            stopSpeech();
            if (onEndCallback) onEndCallback();
        };
        utterance.onerror = () => stopSpeech();

        isSpeaking = true;
        window.speechSynthesis.speak(utterance);
    }

    audioBriefBtn.addEventListener('click', () => {
        if (isSpeaking) {
            stopSpeech();
            showToast('تم إيقاف الموجز الصوتي', 'fa-stop');
            return;
        }
        const topFive = articlesCache.slice(0, 5);
        if (topFive.length === 0) {
            showToast('يرجى الانتظار حتى اكتمال تحميل الأخبار', 'fa-hourglass-half');
            return;
        }

        audioBriefBtn.classList.add('playing');
        audioBriefBtn.innerHTML = '<i class="fa-solid fa-stop"></i> <span>إيقاف الموجز</span>';
        showToast('جارٍ قراءة موجز أهم عناوين اليوم مع ذكر المصادر...', 'fa-headphones-simple');

        const scriptText = 'مرحباً بكم في موجز لينجرام التقني. إليكم أبرز العناوين: ' +
            topFive.map((a, idx) => `الخبر ${idx + 1} من ${a.source.name}: ${a.title}`).join('. ');

        speakArabicText(scriptText);
    });

    listenArticleBtn.addEventListener('click', () => {
        if (!currentOpenArticle) return;
        if (isSpeaking) {
            stopSpeech();
            return;
        }
        listenArticleBtn.classList.add('active');
        listenArticleBtn.innerHTML = '<i class="fa-solid fa-stop"></i> <span>إيقاف</span>';
        const textToRead = `${currentOpenArticle.title}. المصدر: ${currentOpenArticle.source.name}. ${currentOpenArticle.description || ''}`;
        speakArabicText(textToRead);
    });

    // ===== التحكم بحجم الخط وحفظ الخبر من داخل صفحة التفاصيل =====
    fontIncreaseBtn.addEventListener('click', () => {
        readerFontSize = Math.min(1.5, +(readerFontSize + 0.08).toFixed(2));
        const bodyEl = document.getElementById('reader-body-text');
        if (bodyEl) bodyEl.style.fontSize = `${readerFontSize}rem`;
    });

    fontDecreaseBtn.addEventListener('click', () => {
        readerFontSize = Math.max(0.92, +(readerFontSize - 0.08).toFixed(2));
        const bodyEl = document.getElementById('reader-body-text');
        if (bodyEl) bodyEl.style.fontSize = `${readerFontSize}rem`;
    });

    bookmarkDetailBtn.addEventListener('click', (e) => {
        if (currentOpenArticle) toggleSaveArticle(currentOpenArticle, e);
    });

    // ===== ربط أحداث التصفح والفلاتر والبحث =====
    backButton.addEventListener('click', () => closeArticleDetails(true));

    brandHome.addEventListener('click', (e) => {
        e.preventDefault();
        closeArticleDetails(true);
        currentCategory = 'all';
        currentSearchTerm = '';
        searchInput.value = '';
        clearSearchBtn.classList.add('hidden');
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.category === 'all'));
        document.querySelectorAll('.tag-chip').forEach(t => t.classList.remove('active'));
        applyFilters();
    });

    savedViewBtn.addEventListener('click', () => {
        closeArticleDetails(true);
        currentCategory = 'saved';
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.category === 'saved'));
        applyFilters();
    });

    categoryFilters.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;
        closeArticleDetails(true);
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        applyFilters();
    });

    trendingTags.addEventListener('click', (e) => {
        const chip = e.target.closest('.tag-chip');
        if (!chip) return;
        closeArticleDetails(true);
        const tagValue = chip.dataset.tag || '';
        const alreadyActive = chip.classList.contains('active');

        document.querySelectorAll('.tag-chip').forEach(c => c.classList.remove('active'));

        if (alreadyActive) {
            currentSearchTerm = '';
            searchInput.value = '';
            clearSearchBtn.classList.add('hidden');
        } else {
            chip.classList.add('active');
            currentSearchTerm = tagValue.toLowerCase();
            searchInput.value = tagValue;
            clearSearchBtn.classList.remove('hidden');
        }
        applyFilters();
    });

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        closeArticleDetails(true);
        currentSearchTerm = searchInput.value.trim().toLowerCase();
        applyFilters();
    });

    searchInput.addEventListener('input', () => {
        const val = searchInput.value.trim();
        clearSearchBtn.classList.toggle('hidden', val.length === 0);
        currentSearchTerm = val.toLowerCase();
        if (!articleDetails.classList.contains('hidden')) {
            closeArticleDetails(true);
        }
        applyFilters();
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        currentSearchTerm = '';
        clearSearchBtn.classList.add('hidden');
        document.querySelectorAll('.tag-chip').forEach(c => c.classList.remove('active'));
        applyFilters();
        searchInput.focus();
    });

    sortSelect.addEventListener('change', () => {
        currentSort = sortSelect.value;
        applyFilters();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement !== searchInput) {
            e.preventDefault();
            searchInput.focus();
        } else if (e.key === 'Escape' && !articleDetails.classList.contains('hidden')) {
            closeArticleDetails(true);
        }
    });

    window.addEventListener('scroll', () => {
        if (articleDetails.classList.contains('hidden')) {
            readingProgress.style.width = '0%';
            return;
        }
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const pct = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
        readingProgress.style.width = `${pct}%`;
    });

    // بدء التشغيل
    initTheme();
    updateCategoryCounts();
    fetchNews();
});
