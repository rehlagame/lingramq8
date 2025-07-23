document.addEventListener('DOMContentLoaded', () => {
    // === تعريف المتغيرات والعناصر ===
    const apiUrl = '/api/get-news';
    const originalPageTitle = document.title;

    // عناصر DOM
    const newsGrid = document.getElementById('news-grid');
    const loader = document.getElementById('loader');
    const mainContent = document.getElementById('main-content');
    const articleDetails = document.getElementById('article-details');
    const articleContent = document.getElementById('article-content');
    const backButton = document.getElementById('back-button');
    const categoryFilters = document.getElementById('category-filters');
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');

    // مخزن البيانات والحالة
    let articlesCache = []; // لتخزين جميع الأخبار من الـ API
    let currentCategory = 'all';
    let currentSearchTerm = '';

    // تعريف كلمات مفتاحية لكل قسم
    const categoryKeywords = {
        tech: ['تقنية', 'تكنولوجيا', 'هواتف', 'جوالات', 'حواسيب', 'برمجة', 'سامسونج', 'آبل', 'جوجل'],
        gaming: ['ألعاب', 'لعبة', 'بلايستيشن', 'اكسبوكس', 'نينتندو', 'PC gaming', 'eSports', 'PS5', 'Xbox'],
        security: ['سيبراني', 'أمن', 'اختراق', 'فيروس', 'malware', 'phishing', 'حماية'],
        ai: ['ذكاء اصطناعي', 'تعلم الآلة', 'ChatGPT', 'OpenAI', 'AI']
    };

    // === الدوال الرئيسية ===

    async function fetchNews() {
        loader.style.display = 'block';
        newsGrid.innerHTML = '';
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('فشل تحميل الأخبار');

            const data = await response.json();
            articlesCache = data.articles.filter(a => a.urlToImage && a.title && a.description);
            applyFilters(); // عرض الأخبار بعد تحميلها وتطبيق الفلاتر الافتراضية

        } catch (error) {
            console.error('Error fetching news:', error);
            newsGrid.innerHTML = `<p style="text-align: center; color: #D81E2C;">عذراً، حدث خطأ أثناء جلب الأخبار.</p>`;
        } finally {
            loader.style.display = 'none';
        }
    }

    function applyFilters() {
        let filteredArticles = [...articlesCache];

        // 1. تطبيق فلتر القسم (Category)
        if (currentCategory !== 'all') {
            const keywords = categoryKeywords[currentCategory];
            filteredArticles = filteredArticles.filter(article => {
                const title = article.title.toLowerCase();
                const description = article.description.toLowerCase();
                return keywords.some(keyword => title.includes(keyword) || description.includes(keyword));
            });
        }

        // 2. تطبيق فلتر البحث
        if (currentSearchTerm) {
            filteredArticles = filteredArticles.filter(article =>
                article.title.toLowerCase().includes(currentSearchTerm) ||
                article.description.toLowerCase().includes(currentSearchTerm)
            );
        }

        displayNews(filteredArticles);
    }

    function displayNews(articles) {
        newsGrid.innerHTML = '';
        if (articles.length === 0) {
            newsGrid.innerHTML = `<p style="text-align: center;">لا توجد أخبار تطابق بحثك.</p>`;
            return;
        }

        articles.forEach(article => {
            const card = document.createElement('div');
            card.className = 'news-card';

            // إضافة معرّف فريد للخبر للوصول إليه لاحقاً
            card.addEventListener('click', () => {
                // البحث عن الخبر الأصلي في الكاش لتجنب مشاكل الفهرس
                const originalArticle = articlesCache.find(a => a.url === article.url);
                showArticleDetails(originalArticle);
            });

            card.innerHTML = `
                <img src="${article.urlToImage}" alt="${article.title}" onerror="this.onerror=null;this.src='https://via.placeholder.com/400x200?text=Image+Not+Found';">
                <div class="card-content">
                    <h2>${article.title}</h2>
                    <p>${article.description || ''}</p>
                    <div class="card-footer">
                        <span>${article.source.name}</span>
                    </div>
                </div>
            `;
            newsGrid.appendChild(card);
        });
    }

    function showArticleDetails(article) {
        mainContent.classList.add('hidden');
        articleDetails.classList.remove('hidden');
        window.scrollTo(0, 0);

        // تحديث عنوان الصفحة في المتصفح
        document.title = `${article.title} | lingramq8`;

        const publishedDate = new Date(article.publishedAt).toLocaleString('ar-EG', { dateStyle: 'long', timeStyle: 'short' });
        const contentToShow = article.description || 'لا يوجد وصف متاح لهذا الخبر.';

        articleContent.innerHTML = `
            <h1>${article.title}</h1>
            <div class="meta-info">
                <span>بواسطة: ${article.author || article.source.name}</span> | 
                <span>بتاريخ: ${publishedDate}</span>
            </div>
            <img src="${article.urlToImage}" alt="${article.title}">
            <p>${contentToShow}</p>
            <a href="${article.url}" target="_blank" class="back-btn">قراءة الخبر كاملاً من المصدر</a>
            <div class="share-section">
                <h3>شارك الخبر</h3>
                <div class="share-buttons">
                    <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(article.title + ' ' + article.url)}" target="_blank" class="share-btn whatsapp" aria-label="Share on WhatsApp"><i class="fab fa-whatsapp"></i></a>
                    <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(article.url)}&text=${encodeURIComponent(article.title)}" target="_blank" class="share-btn twitter-x" aria-label="Share on X"><i class="fab fa-xing"></i></a>
                    <a href="https://t.me/share/url?url=${encodeURIComponent(article.url)}&text=${encodeURIComponent(article.title)}" target="_blank" class="share-btn telegram" aria-label="Share on Telegram"><i class="fab fa-telegram"></i></a>
                </div>
            </div>
        `;
    }

    // === ربط الأحداث (Event Listeners) ===

    // العودة من صفحة التفاصيل
    backButton.addEventListener('click', () => {
        articleDetails.classList.add('hidden');
        mainContent.classList.remove('hidden');
        document.title = originalPageTitle; // استعادة العنوان الأصلي
    });

    // التعامل مع فلاتر الأقسام
    categoryFilters.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            document.querySelector('.filter-btn.active').classList.remove('active');
            e.target.classList.add('active');
            currentCategory = e.target.dataset.category;
            applyFilters();
        }
    });

    // التعامل مع البحث
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        currentSearchTerm = searchInput.value.trim().toLowerCase();
        applyFilters();
    });

    // === بدء تشغيل التطبيق ===
    fetchNews();
});