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

    let articlesCache = [];
    let currentCategory = 'all';
    let currentSearchTerm = '';

    const categoryKeywords = {
        tech: [ 'تكنولوجيا', 'هواتف', 'جوالات', 'حواسيب', 'برمجة', 'سامسونج', 'آبل', 'جوجل', 'ويندوز', 'تسلا'],
        gaming: ['ألعاب', 'لعبة', 'بلايستيشن', 'اكسبوكس', 'نينتندو', 'ستيم', 'PC gaming', 'eSports', 'PS5', 'Xbox'],
        security: ['سيبراني', 'أمن', 'اختراق', 'فيروس', 'malware', 'phishing', 'حماية', 'ثغرة'],
        ai: ['ذكاء اصطناعي', 'تعلم الآلة', 'ChatGPT', 'OpenAI', 'AI', 'غروك']
    };

    async function fetchNews() {
        loader.style.display = 'block';
        newsGrid.innerHTML = '';
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('فشل تحميل الأخبار');

            const data = await response.json();
            
            // ==== التطوير: ترتيب الأخبار هنا مباشرة ====
            // نرتب المصفوفة حسب تاريخ النشر من الأحدث إلى الأقدم
            const sortedArticles = data.articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

            articlesCache = sortedArticles.filter(a => a.urlToImage && a.title && a.description);
            applyFilters();

        } catch (error) {
            console.error('Error fetching news:', error);
            newsGrid.innerHTML = `<p style="text-align: center; color: #D81E2C;">عذراً، حدث خطأ أثناء جلب الأخبار.</p>`;
        } finally {
            loader.style.display = 'none';
        }
    }

    function applyFilters() {
        let filteredArticles = [...articlesCache];

        if (currentCategory !== 'all') {
            const keywords = categoryKeywords[currentCategory];
            filteredArticles = filteredArticles.filter(article => {
                const title = article.title.toLowerCase();
                const description = article.description.toLowerCase();
                return keywords.some(keyword => title.includes(keyword) || description.includes(keyword));
            });
        }

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

            card.addEventListener('click', () => {
                const originalArticle = articlesCache.find(a => a.url === article.url);
                showArticleDetails(originalArticle);
            });

            // ==== التطوير: تنسيق التاريخ لعرضه ====
            const publishedDate = new Date(article.publishedAt).toLocaleDateString('ar-EG', {
                year: 'numeric', month: 'long', day: 'numeric'
            });

            // ==== التطوير: إضافة التاريخ والمصدر في الـ Footer ====
            card.innerHTML = `
                <img src="${article.urlToImage}" alt="${article.title}" onerror="this.onerror=null;this.src='https://via.placeholder.com/400x200?text=Image+Not+Found';">
                <div class="card-content">
                    <h2>${article.title}</h2>
                    <p>${article.description || ''}</p>
                    <div class="card-footer">
                        <span class="source-name">${article.source.name}</span>
                        <span class="publish-date">${publishedDate}</span>
                    </div>
                </div>
            `;
            newsGrid.appendChild(card);
        });
    }

    function showArticleDetails(article) {
        // ... (هذه الدالة لا تحتاج أي تغيير)
        mainContent.classList.add('hidden');
        articleDetails.classList.remove('hidden');
        window.scrollTo(0, 0);

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

    // ربط الأحداث (لا تغيير هنا)
    backButton.addEventListener('click', () => {
        articleDetails.classList.add('hidden');
        mainContent.classList.remove('hidden');
        document.title = originalPageTitle;
    });

    categoryFilters.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            document.querySelector('.filter-btn.active').classList.remove('active');
            e.target.classList.add('active');
            currentCategory = e.target.dataset.category;
            applyFilters();
        }
    });

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        currentSearchTerm = searchInput.value.trim().toLowerCase();
        applyFilters();
    });

    fetchNews();
});
