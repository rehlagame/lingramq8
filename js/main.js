// js/main.js - نسخة نهائية بدون بانر تجريبي
document.addEventListener('DOMContentLoaded', () => {
    const newsGrid = document.getElementById('news-grid');
    const loader = document.getElementById('loader');

    // عرض الأخبار
    const displayNews = (articles, source = 'unknown') => {
        newsGrid.innerHTML = '';
        
        if (!articles || articles.length === 0) {
            newsGrid.innerHTML = `
                <div style="text-align: center; padding: 40px; grid-column: 1 / -1;">
                    <h3>لا توجد أخبار متاحة حالياً</h3>
                    <p>جاري العمل على إضافة المزيد من المصادر...</p>
                    <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: var(--accent-red); color: white; border: none; border-radius: 5px; cursor: pointer;">
                        إعادة تحديث
                    </button>
                </div>
            `;
            return;
        }

        // إزالة البانرات التجريبية - الموقع سيبدو احترافي تماماً
        // لا نعرض أي رسائل حول نوع المحتوى

        articles.forEach((article, index) => {
            // تخطي المقالات المحذوفة
            if (article.title === '[Removed]' || !article.title) return;

            // التأكد من وجود صورة جيدة
            let imageUrl = article.urlToImage;
            if (!imageUrl || imageUrl.includes('removed') || imageUrl.includes('placeholder')) {
                // استخدام صور Unsplash حسب الموضوع
                const techKeywords = ['آبل', 'سامسونج', 'أندرويد', 'آيفون', 'هاتف', 'تطبيق'];
                const gameKeywords = ['بلايستيشن', 'اكسبوكس', 'نينتندو', 'ألعاب', 'لعبة'];
                const carKeywords = ['تسلا', 'سيارة', 'كهربائية'];
                const aiKeywords = ['ذكي', 'ذكاء', 'AI', 'تقنية'];
                
                if (techKeywords.some(keyword => article.title.includes(keyword))) {
                    imageUrl = `https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=300&fit=crop&crop=center&auto=format&q=80`;
                } else if (gameKeywords.some(keyword => article.title.includes(keyword))) {
                    imageUrl = `https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=600&h=300&fit=crop&crop=center&auto=format&q=80`;
                } else if (carKeywords.some(keyword => article.title.includes(keyword))) {
                    imageUrl = `https://images.unsplash.com/photo-1549399853-8d165c3a4e17?w=600&h=300&fit=crop&crop=center&auto=format&q=80`;
                } else if (aiKeywords.some(keyword => article.title.includes(keyword))) {
                    imageUrl = `https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=300&fit=crop&crop=center&auto=format&q=80`;
                } else {
                    imageUrl = `https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600&h=300&fit=crop&crop=center&auto=format&q=80`;
                }
            }

            const shortDesc = article.description ? 
                (article.description.length > 120 ? 
                 article.description.substring(0, 120) + '...' : 
                 article.description) : 
                'اضغط لقراءة المزيد...';

            const card = document.createElement('a');
            card.className = 'card';
            card.href = `article.html?index=${index}`;

            card.innerHTML = `
                <img src="${imageUrl}" 
                     alt="${article.title}" 
                     class="card-img" 
                     onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600&h=300&fit=crop&crop=center';"
                     loading="lazy">
                <div class="card-content">
                    <span class="card-source">${article.source?.name || 'مصدر تقني'}</span>
                    <h2 class="card-title">${article.title}</h2>
                    <p class="card-description">${shortDesc}</p>
                    <span class="card-date">${formatDate(article.publishedAt)}</span>
                </div>
            `;
            
            newsGrid.appendChild(card);
        });
    };

    // تنسيق التاريخ
    const formatDate = (dateString) => {
        if (!dateString) return '';
        
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
            
            if (diffHours < 1) {
                return 'منذ دقائق';
            } else if (diffHours < 24) {
                return `منذ ${diffHours} ساعة`;
            } else {
                const diffDays = Math.ceil(diffHours / 24);
                if (diffDays === 1) {
                    return 'منذ يوم واحد';
                } else if (diffDays < 7) {
                    return `منذ ${diffDays} أيام`;
                } else {
                    return date.toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                }
            }
        } catch (error) {
            return '';
        }
    };

    // جلب الأخبار
    const loadNews = async () => {
        try {
            console.log('🔄 جاري جلب الأخبار...');
            
            // إظهار اللودر
            loader.classList.remove('hidden');
            newsGrid.innerHTML = '';

            const response = await fetch('/api/fetchNews', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('📰 تم جلب البيانات:', data);

            if (!data.success) {
                throw new Error(data.message || 'فشل في جلب الأخبار');
            }

            const articles = data.articles || [];
            
            // حفظ البيانات في localStorage للصفحة التفصيلية
            localStorage.setItem('lingramNewsData', JSON.stringify(articles));
            
            // عرض الأخبار بدون أي بانرات
            displayNews(articles);
            
            console.log(`✅ تم عرض ${articles.length} مقال`);

        } catch (error) {
            console.error('❌ خطأ في جلب الأخبار:', error);
            
            // محاولة تحميل بيانات محفوظة
            const cachedData = localStorage.getItem('lingramNewsData');
            
            if (cachedData) {
                try {
                    const articles = JSON.parse(cachedData);
                    displayNews(articles);
                    console.log('📦 تم تحميل بيانات محفوظة');
                    
                    // إظهار رسالة تحديث بسيطة
                    const updateNotice = document.createElement('div');
                    updateNotice.style.cssText = `
                        background: #fff3cd; 
                        border: 1px solid #ffeaa7; 
                        color: #856404; 
                        padding: 15px; 
                        margin-bottom: 20px; 
                        border-radius: 8px; 
                        text-align: center;
                    `;
                    updateNotice.innerHTML = '⚠️ يتم عرض أخبار محفوظة - تحقق من الاتصال بالإنترنت';
                    newsGrid.parentNode.insertBefore(updateNotice, newsGrid);
                    
                    return;
                } catch (e) {
                    console.error('خطأ في تحليل البيانات المحفوظة:', e);
                }
            }

            // عرض رسالة خطأ
            newsGrid.innerHTML = `
                <div style="text-align: center; padding: 40px; grid-column: 1 / -1; background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; border-radius: 8px;">
                    <h3>❌ خطأ في تحميل الأخبار</h3>
                    <p>${error.message}</p>
                    <p style="font-size: 0.9em; margin-top: 10px;">
                        قد يكون السبب: مشكلة في الشبكة أو انتهاء حصة API
                    </p>
                    <button onclick="window.location.reload()" 
                            style="margin-top: 15px; padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        إعادة المحاولة
                    </button>
                </div>
            `;
            
        } finally {
            // إخفاء اللودر
            loader.classList.add('hidden');
        }
    };

    // بدء تحميل الأخبار
    loadNews();

    // إعادة تحميل الأخبار كل 15 دقيقة
    setInterval(() => {
        console.log('🔄 إعادة تحديث تلقائية...');
        loadNews();
    }, 15 * 60 * 1000);
});
