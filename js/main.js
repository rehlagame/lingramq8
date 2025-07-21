// js/main.js - أخبار حقيقية فقط
document.addEventListener('DOMContentLoaded', () => {
    const newsGrid = document.getElementById('news-grid');
    const loader = document.getElementById('loader');

    // عرض الأخبار الحقيقية
    const displayNews = (articles) => {
        newsGrid.innerHTML = '';
        
        if (!articles || articles.length === 0) {
            newsGrid.innerHTML = `
                <div style="text-align: center; padding: 40px; grid-column: 1 / -1; background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; border-radius: 8px;">
                    <h3>❌ لا توجد أخبار متاحة حالياً</h3>
                    <p>قد يكون السبب:</p>
                    <ul style="text-align: right; margin: 15px 0;">
                        <li>انتهاء حصة NewsAPI اليومية</li>
                        <li>مشكلة في الاتصال بالإنترنت</li>
                        <li>عدم وجود أخبار جديدة</li>
                    </ul>
                    <button onclick="window.location.reload()" style="margin-top: 15px; padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        إعادة المحاولة
                    </button>
                </div>
            `;
            return;
        }

        // عرض الأخبار الحقيقية بدون أي بانرات
        articles.forEach((article, index) => {
            // تخطي المقالات المحذوفة
            if (article.title === '[Removed]' || !article.title) return;

            // استخدام صورة افتراضية عالية الجودة إذا لم تكن موجودة
            let imageUrl = article.urlToImage;
            if (!imageUrl || imageUrl.includes('removed')) {
                imageUrl = `https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&h=300&fit=crop&crop=center&auto=format&q=80`;
            }

            const shortDesc = article.description ? 
                (article.description.length > 150 ? 
                 article.description.substring(0, 150) + '...' : 
                 article.description) : 
                'اضغط لقراءة المزيد...';

            const card = document.createElement('a');
            card.className = 'card';
            card.href = `article.html?index=${index}`;

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

    // جلب الأخبار الحقيقية فقط
    const loadNews = async () => {
        try {
            console.log('🔄 جاري جلب الأخبار الحقيقية من NewsAPI...');
            
            // إظهار اللودر
            loader.classList.remove('hidden');
            newsGrid.innerHTML = '';

            const response = await fetch('/api/fetchNews', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            console.log('📊 API Response Status:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('📰 تم جلب البيانات:', data);

            if (!data.success) {
                throw new Error(data.message || 'فشل في جلب الأخبار');
            }

            const articles = data.articles || [];
            
            if (articles.length === 0) {
                throw new Error('لا توجد أخبار متاحة من NewsAPI');
            }

            // حفظ البيانات في localStorage للصفحة التفصيلية
            localStorage.setItem('lingramNewsData', JSON.stringify(articles));
            
            // عرض الأخبار الحقيقية
            displayNews(articles);
            
            console.log(`✅ تم عرض ${articles.length} خبر حقيقي من NewsAPI`);

            // إضافة بانر نجاح (اختياري)
            if (articles.length > 0) {
                const successBanner = document.createElement('div');
                successBanner.style.cssText = `
                    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
                    color: white;
                    padding: 10px;
                    margin-bottom: 20px;
                    border-radius: 8px;
                    text-align: center;
                    font-size: 0.9rem;
                `;
                successBanner.innerHTML = `✅ تم جلب ${articles.length} خبر حقيقي من NewsAPI`;
                newsGrid.parentNode.insertBefore(successBanner, newsGrid);
                
                // إخفاء البانر بعد 3 ثواني
                setTimeout(() => {
                    successBanner.remove();
                }, 3000);
            }

        } catch (error) {
            console.error('❌ خطأ في جلب الأخبار:', error);
            
            // محاولة تحميل بيانات محفوظة
            const cachedData = localStorage.getItem('lingramNewsData');
            
            if (cachedData) {
                try {
                    const articles = JSON.parse(cachedData);
                    if (articles.length > 0) {
                        displayNews(articles);
                        console.log('📦 تم تحميل أخبار محفوظة');
                        
                        // إظهار رسالة تحديث
                        const cacheNotice = document.createElement('div');
                        cacheNotice.style.cssText = `
                            background: #fff3cd; 
                            border: 1px solid #ffeaa7; 
                            color: #856404; 
                            padding: 15px; 
                            margin-bottom: 20px; 
                            border-radius: 8px; 
                            text-align: center;
                        `;
                        cacheNotice.innerHTML = `⚠️ يتم عرض أخبار محفوظة من آخر جلسة ناجحة - ${error.message}`;
                        newsGrid.parentNode.insertBefore(cacheNotice, newsGrid);
                        
                        return;
                    }
                } catch (e) {
                    console.error('خطأ في تحليل البيانات المحفوظة:', e);
                }
            }

            // عرض رسالة خطأ تفصيلية
            newsGrid.innerHTML = `
                <div style="text-align: center; padding: 40px; grid-column: 1 / -1; background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; border-radius: 8px;">
                    <h3>❌ فشل في جلب الأخبار</h3>
                    <p style="margin: 15px 0;"><strong>السبب:</strong> ${error.message}</p>
                    
                    <div style="background: #fff; padding: 15px; border-radius: 5px; margin: 20px 0; color: #495057;">
                        <strong>الحلول المقترحة:</strong>
                        <ul style="text-align: right; margin-top: 10px;">
                            <li>تحقق من الاتصال بالإنترنت</li>
                            <li>تأكد من صحة مفتاح NewsAPI</li>
                            <li>قد تحتاج لترقية حساب NewsAPI للعمل على الخوادم</li>
                            <li>حاول مرة أخرى بعد قليل</li>
                        </ul>
                    </div>
                    
                    <button onclick="window.location.reload()" 
                            style="margin-top: 15px; padding: 12px 25px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 1rem;">
                        🔄 إعادة المحاولة
                    </button>
                </div>
            `;
            
        } finally {
            // إخفاء اللودر
            loader.classList.add('hidden');
        }
    };

    // بدء تحميل الأخبار الحقيقية
    loadNews();

    // إعادة تحميل الأخبار كل 15 دقيقة (للأخبار الحقيقية)
    setInterval(() => {
        console.log('🔄 إعادة تحديث تلقائية للأخبار الحقيقية...');
        loadNews();
    }, 15 * 60 * 1000);
});
