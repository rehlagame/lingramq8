// js/article.js
document.addEventListener('DOMContentLoaded', () => {
    const articleContainer = document.getElementById('article-container');
    const loader = document.getElementById('loader');

    // عرض المقال
    const renderArticle = (article) => {
        // إخفاء اللودر
        loader.classList.add('hidden');

        // تحديث عنوان الصفحة
        document.title = `${article.title} | LingramQ8`;

        const imageUrl = article.urlToImage || 'images/logo.PNG';
        const summary = article.description || "لا يتوفر ملخص لهذا الخبر.";

        // تنسيق التاريخ
        const formatDate = (dateString) => {
            if (!dateString) return 'تاريخ غير محدد';

            try {
                return new Date(dateString).toLocaleDateString('ar-EG', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch (error) {
                return 'تاريخ غير صحيح';
            }
        };

        articleContainer.innerHTML = `
            <div class="article-header">
                <h1 class="article-title">${article.title}</h1>
                <div class="article-meta">
                    <span class="source-info">
                        📰 المصدر: <strong>${article.source?.name || 'غير محدد'}</strong>
                    </span>
                    <br>
                    <span class="date-info">
                        📅 تاريخ النشر: ${formatDate(article.publishedAt)}
                    </span>
                </div>
            </div>

            <div class="article-image-container">
                <img src="${imageUrl}" 
                     alt="${article.title}" 
                     class="article-image" 
                     onerror="this.onerror=null;this.src='images/logo.PNG';">
            </div>
            
            <div class="article-summary">
                <h3>📋 ملخص الخبر:</h3>
                <p>${summary}</p>
            </div>

            <div class="article-actions">
                <a href="${article.url}" 
                   class="read-more-btn" 
                   target="_blank" 
                   rel="noopener noreferrer">
                    📖 قراءة الخبر كاملاً في المصدر الأصلي
                    <span style="font-size: 0.8em; display: block; margin-top: 5px;">
                        (${getDomainFromUrl(article.url)})
                    </span>
                </a>
                
                <button onclick="shareArticle('${encodeURIComponent(article.title)}', '${encodeURIComponent(article.url)}')" 
                        class="share-btn">
                    📤 مشاركة الخبر
                </button>
            </div>
            
            <div class="navigation">
                <a href="index.html" class="back-link">
                    ← العودة إلى الصفحة الرئيسية
                </a>
            </div>
        `;
    };

    // استخراج النطاق من الرابط
    const getDomainFromUrl = (url) => {
        try {
            const domain = new URL(url).hostname;
            return domain.replace('www.', '');
        } catch (error) {
            return 'رابط خارجي';
        }
    };

    // تحميل المقال
    const loadArticle = () => {
        try {
            // الحصول على فهرس المقال من URL
            const urlParams = new URLSearchParams(window.location.search);
            const articleIndex = urlParams.get('index');

            if (articleIndex === null) {
                showError('لم يتم العثور على الخبر المطلوب.');
                return;
            }

            // تحميل البيانات من localStorage
            const newsData = localStorage.getItem('lingramNewsData');

            if (!newsData) {
                showError('حدث خطأ، لا يمكن تحميل بيانات الخبر. يرجى العودة للصفحة الرئيسية.');
                return;
            }

            const articles = JSON.parse(newsData);
            const article = articles[parseInt(articleIndex, 10)];

            if (article) {
                renderArticle(article);
            } else {
                showError('عفواً، الخبر الذي تبحث عنه غير موجود.');
            }

        } catch (error) {
            console.error('خطأ في تحميل المقال:', error);
            showError('حدث خطأ في تحميل المقال.');
        }
    };

    // عرض رسالة خطأ
    const showError = (message) => {
        loader.classList.add('hidden');
        articleContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; border-radius: 8px; margin: 20px 0;">
                <h3>❌ خطأ</h3>
                <p>${message}</p>
                <a href="index.html" style="display: inline-block; margin-top: 15px; padding: 10px 20px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px;">
                    العودة للرئيسية
                </a>
            </div>
        `;
    };

    // تحميل المقال
    loadArticle();
});

// وظيفة مشاركة المقال
function shareArticle(title, url) {
    const shareData = {
        title: decodeURIComponent(title),
        url: decodeURIComponent(url)
    };

    if (navigator.share) {
        // استخدام Web Share API إذا كان متاحاً
        navigator.share(shareData).catch(console.error);
    } else {
        // نسخ الرابط إلى الحافظة
        const textToCopy = `${shareData.title}\n\n${shareData.url}`;

        if (navigator.clipboard) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                alert('تم نسخ رابط الخبر إلى الحافظة!');
            }).catch(() => {
                fallbackCopyTextToClipboard(textToCopy);
            });
        } else {
            fallbackCopyTextToClipboard(textToCopy);
        }
    }
}

// وظيفة احتياطية لنسخ النص
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        document.execCommand('copy');
        alert('تم نسخ رابط الخبر!');
    } catch (err) {
        console.error('خطأ في النسخ:', err);
        alert('عذراً، لا يمكن نسخ الرابط تلقائياً.');
    }

    document.body.removeChild(textArea);
}
