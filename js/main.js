// js/main.js - (v2) محسّن لمعالجة الأخطاء وعرض الرسائل بوضوح

document.addEventListener('DOMContentLoaded', () => {
    const newsGrid = document.getElementById('news-grid');
    const loader = document.getElementById('loader');
    const mainContainer = document.querySelector('main.container');

    // دالة لإزالة أي بانرات إشعارات سابقة
    const removeNoticeBanners = () => {
        const existingBanners = mainContainer.querySelectorAll('.notice-banner');
        existingBanners.forEach(banner => banner.remove());
    };

    // دالة لعرض بانر إشعار جديد
    const showNoticeBanner = (message, type = 'error') => {
        removeNoticeBanners(); // إزالة البانرات القديمة أولاً
        const banner = document.createElement('div');
        banner.className = 'notice-banner';
        
        let styles = '';
        if (type === 'error') {
            styles = 'background: #f8d7da; border-left: 5px solid #dc3545; color: #721c24;';
        } else if (type === 'warning') {
            styles = 'background: #fff3cd; border-left: 5px solid #ffc107; color: #856404;';
        } else if (type === 'success') {
            styles = 'background: #d4edda; border-left: 5px solid #28a745; color: #155724;';
        }

        banner.style.cssText = `padding: 15px; margin-bottom: 20px; border-radius: 8px; text-align: center; font-weight: 500; ${styles}`;
        banner.innerHTML = message;
        mainContainer.insertBefore(banner, loader);
    };

    const displayNews = (articles) => {
        newsGrid.innerHTML = ''; // تنظيف الشبكة قبل عرض الأخبار الجديدة

        articles.forEach((article, index) => {
            if (!article.title || article.title === '[Removed]') return;

            // استخدام صورة افتراضية في حالة عدم وجود صورة أو في حالة الخطأ
            const imageUrl = article.urlToImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&h=300&fit=crop&crop=center&auto=format&q=80';

            const shortDesc = article.description ?
                (article.description.length > 150 ? article.description.substring(0, 150) + '...' : article.description) :
                'اضغط لقراءة المزيد...';

            const card = document.createElement('a');
            card.className = 'card';
            card.href = `article.html?index=${index}`; // الربط بالصفحة التفصيلية

            card.innerHTML = `
                <img src="${imageUrl}" 
                     alt="${article.title}" 
                     class="card-img" 
                     onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&h=300&fit=crop&crop=center';"
                     loading="lazy">
                <div class="card-content">
                    <span class="card-source">${article.source?.name || 'مصدر إخباري'}</span>
                    <h2 class="card-title">${article.title}</h2>
                    <p class="card-description">${shortDesc}</p>
                    <span class="card-date">${formatDate(article.publishedAt)}</span>
                </div>
            `;
            newsGrid.appendChild(card);
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffHours = Math.ceil(Math.abs(now - date) / (1000 * 60 * 60));

            if (diffHours < 1) return 'قبل دقائق';
            if (diffHours < 24) return `قبل ${diffHours} ساعة`;
            
            const diffDays = Math.ceil(diffHours / 24);
            if (diffDays <= 1) return 'قبل يوم';
            if (diffDays < 7) return `قبل ${diffDays} أيام`;

            return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch (error) {
            return '';
        }
    };

    const loadNews = async () => {
        removeNoticeBanners();
        loader.classList.remove('hidden');
        newsGrid.innerHTML = '';

        try {
            console.log('🔄 جاري جلب الأخبار من /api/fetchNews...');
            const response = await fetch('/api/fetchNews');
            const data = await response.json();
            console.log('📊 API Response Status:', response.status);

            if (!response.ok || !data.success) {
                // رمي خطأ مع رسالة واضحة من الخادم
                throw new Error(data.message || `فشل تحميل الأخبار (حالة: ${response.status})`);
            }

            const articles = data.articles || [];
            if (articles.length === 0) {
                // هذه الحالة لا يجب أن تحدث إذا كان الـ API يعمل بشكل صحيح
                throw new Error("API succeeded but returned no articles.");
            }

            // --- كل شيء نجح ---
            localStorage.setItem('lingramNewsData', JSON.stringify(articles));
            displayNews(articles);
            showNoticeBanner(`✅ تم بنجاح جلب ${articles.length} خبر جديد!`, 'success');
            console.log(`✅ تم عرض ${articles.length} خبر.`);

        } catch (error) {
            console.error('❌ خطأ في جلب الأخبار:', error.message);
            showNoticeBanner(`⚠️ ${error.message}`, 'error');

            // محاولة عرض بيانات محفوظة كخطة بديلة
            const cachedData = localStorage.getItem('lingramNewsData');
            if (cachedData) {
                try {
                    const articles = JSON.parse(cachedData);
                    if (articles.length > 0) {
                        displayNews(articles);
                        console.log('📦 تم عرض أخبار محفوظة من آخر جلسة.');
                        showNoticeBanner(`⚠️ ${error.message} - يتم الآن عرض آخر أخبار تم تحميلها بنجاح.`, 'warning');
                        return; // الخروج من الدالة لأننا عرضنا شيئاً
                    }
                } catch (e) {
                    console.error('خطأ في تحليل البيانات المحفوظة:', e);
                }
            }
            
            // إذا فشل كل شيء، عرض رسالة خطأ نهائية
            newsGrid.innerHTML = `
                <div style="text-align: center; padding: 40px; grid-column: 1 / -1; background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; border-radius: 8px;">
                    <h3>❌ لا توجد أخبار لعرضها</h3>
                    <p style="margin: 15px 0;"><strong>السبب:</strong> ${error.message}</p>
                    <button onclick="window.location.reload()" 
                            style="margin-top: 15px; padding: 12px 25px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 1rem;">
                        🔄 إعادة المحاولة
                    </button>
                </div>
            `;

        } finally {
            loader.classList.add('hidden');
        }
    };

    // [!] تحسين: تم إزالة التحديث التلقائي `setInterval` للحفاظ على حصة API
    // يمكنك إضافة زر "تحديث" إذا أردت.
    loadNews();
});
