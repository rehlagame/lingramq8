document.addEventListener('DOMContentLoaded', () => {
    const articleContainer = document.getElementById('article-container');
    const loader = document.getElementById('loader');

    const renderArticle = (article) => {
        loader.classList.add('hidden');
        document.title = `${article.title} | LingramQ8`;

        const imageUrl = article.urlToImage || 'images/logo.png';

        // Use the description as the primary summary on our site.
        const summary = article.description || "لا يتوفر ملخص لهذا الخبر.";

        articleContainer.innerHTML = `
            <div class="article-header">
                <h1 class="article-title">${article.title}</h1>
                <p class="article-meta">
                    <span>المصدر: ${article.source.name}</span> | 
                    <span>تاريخ النشر: ${new Date(article.publishedAt).toLocaleDateString('ar-EG')}</span>
                </p>
            </div>
            <img src="${imageUrl}" alt="${article.title}" class="article-image" onerror="this.onerror=null;this.src='images/logo.png';">
            
            <div class="article-summary">
                <p>${summary}</p>
            </div>

            <div class="read-more-container">
                <a href="${article.url}" class="read-more-btn" target="_blank" rel="noopener noreferrer">
                    قراءة الخبر كاملاً في المصدر
                </a>
            </div>
            
            <a href="index.html" class="back-link">→ العودة إلى الصفحة الرئيسية</a>
        `;
    };

    const loadArticle = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const articleIndex = urlParams.get('index');

        if (articleIndex === null) {
            articleContainer.innerHTML = '<p>لم يتم العثور على الخبر المطلوب.</p>';
            return;
        }

        const newsData = JSON.parse(localStorage.getItem('lingramNewsData'));

        if (!newsData) {
            articleContainer.innerHTML = '<p>حدث خطأ، لا يمكن تحميل بيانات الخبر. يرجى العودة للصفحة الرئيسية.</p>';
            return;
        }

        const article = newsData[parseInt(articleIndex, 10)];

        if (article) {
            renderArticle(article);
        } else {
            loader.classList.add('hidden');
            articleContainer.innerHTML = '<p>عفواً، الخبر الذي تبحث عنه غير موجود.</p>';
        }
    };

    loadArticle();
});