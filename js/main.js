// js/main.js - محسّن للعمل محلياً وعلى الخادم
document.addEventListener('DOMContentLoaded', () => {
    const newsGrid = document.getElementById('news-grid');
    const loader = document.getElementById('loader');

    // بيانات تجريبية للاختبار المحلي
    const mockNewsData = {
        "success": true,
        "articles": [
            {
                "title": "آبل تكشف عن iPhone 16 Pro Max الجديد بمعالج A18 Bionic",
                "description": "كشفت شركة آبل عن أحدث هواتفها iPhone 16 Pro Max والذي يأتي بمعالج A18 Bionic المتطور وكاميرا بدقة 48 ميجابكسل مع تحسينات في الأداء والبطارية.",
                "url": "https://example.com/iphone16",
                "urlToImage": "https://via.placeholder.com/400x200/d9232d/ffffff?text=iPhone+16+Pro+Max",
                "publishedAt": new Date().toISOString(),
                "source": { "name": "تقنية عربية" }
            },
            {
                "title": "سونি تعلن عن PlayStation 5 Pro بأداء محسّن للألعاب",
                "description": "أعلنت سوني رسمياً عن PlayStation 5 Pro الجديد والذي يوفر أداءً محسّناً بنسبة 45% مع دعم Ray Tracing المتقدم وتقنية DLSS للألعاب.",
                "url": "https://example.com/ps5pro",
                "urlToImage": "https://via.placeholder.com/400x200/0070f3/ffffff?text=PlayStation+5+Pro",
                "publishedAt": new Date(Date.now() - 2*60*60*1000).toISOString(),
                "source": { "name": "جيمز عربي" }
            },
            {
                "title": "مايكروسوفت تطلق تحديث Windows 11 2024 مع ميزات الذكاء الاصطناعي",
                "description": "أطلقت مايكروسوفت التحديث السنوي لنظام Windows 11 والذي يتضمن ميزات جديدة للذكاء الاصطناعي وتحسينات في الأمان والأداء.",
                "url": "https://example.com/windows11",
                "urlToImage": "https://via.placeholder.com/400x200/00a86b/ffffff?text=Windows+11+2024",
                "publishedAt": new Date(Date.now() - 4*60*60*1000).toISOString(),
                "source": { "name": "تكنولوجيا اليوم" }
            },
            {
                "title": "نفيديا تكشف عن RTX 5090 بأداء مضاعف لمعالجة الرسوميات",
                "description": "كشفت نفيديا عن بطاقة الرسوميات الجديدة RTX 5090 التي توفر أداءً مضاعفاً مقارنة بالجيل السابق مع دعم كامل لتقنيات الذكاء الاصطناعي.",
                "url": "https://example.com/rtx5090",
                "urlToImage": "https://via.placeholder.com/400x200/76b900/ffffff?text=RTX+5090",
                "publishedAt": new Date(Date.now() - 6*60*60*1000).toISOString(),
                "source": { "name": "هاردوير عربي" }
            },
            {
                "title": "تسلا تبدأ إنتاج Model 2 الكهربائية الاقتصادية بسعر 25 ألف دولار",
                "description": "بدأت تسلا رسمياً في إنتاج سيارة Model 2 الكهربائية الجديدة والتي تستهدف الفئة الاقتصادية بسعر 25 ألف دولار ومدى يصل إلى 400 كيلومتر.",
                "url": "https://example.com/tesla-model2",
                "urlToImage": "https://via.placeholder.com/400x200/e74c3c/ffffff?text=Tesla+Model+2",
                "publishedAt": new Date(Date.now() - 8*60*60*1000).toISOString(),
                "source": { "name": "سيارات تقنية" }
            },
            {
                "title": "جوجل تطلق Pixel 9 Pro مع كاميرا AI وميزات تصوير متقدمة",
                "description": "أطلقت جوجل هاتف Pixel 9 Pro الجديد الذي يأتي بكاميرا ذكية تعتمد على الذكاء الاصطناعي لتحسين جودة الصور والفيديو تلقائياً.",
                "url": "https://example.com/pixel9pro",
                "urlToImage": "https://via.placeholder.com/400x200/4285f4/ffffff?text=Google+Pixel+9",
                "publishedAt": new Date(Date.now() - 12*60*60*1000).toISOString(),
                "source": { "name": "أندرويد عربي" }
            }
        ]
    };

    // التحقق من البيئة
    const isLocalhost = window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.protocol === 'file:';

    // عرض الأخبار
    const displayNews = (articles) => {
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

        articles.forEach((article, index) => {
            // تخطي المقالات المحذوفة
            if (article.title === '[Removed]' || !article.title) return;

            // استخدام صورة افتراضية إذا لم تكن موجودة
            let imageUrl = article.urlToImage;

            // إذا لم تكن هناك صورة أو كانت من placeholder
            if (!imageUrl || imageUrl.includes('placeholder')) {
                // استخدام صور من Unsplash حسب الموضوع
                const techKeywords = ['آبل', 'سامسونج', 'أندرويد', 'آيفون', 'هاتف'];
                const gameKeywords = ['بلايستيشن', 'اكسبوكس', 'نينتندو', 'ألعاب', 'لعبة'];
                const carKeywords = ['تسلا', 'سيارة', 'كهربائية'];

                if (techKeywords.some(keyword => article.title.includes(keyword))) {
                    imageUrl = `https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=200&fit=crop&crop=center`;
                } else if (gameKeywords.some(keyword => article.title.includes(keyword))) {
                    imageUrl = `https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=200&fit=crop&crop=center`;
                } else if (carKeywords.some(keyword => article.title.includes(keyword))) {
                    imageUrl = `https://images.unsplash.com/photo-1549399853-8d165c3a4e17?w=400&h=200&fit=crop&crop=center`;
                } else {
                    imageUrl = `https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=200&fit=crop&crop=center`;
                }
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
                     onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=200&fit=crop&crop=center';"
                     loading="lazy">
                <div class="card-content">
                    <span class="card-source">${article.source?.name || 'مصدر غير معروف'}</span>
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
                return date.toLocaleDateString('ar-EG', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
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

            let articles = [];

            if (isLocalhost) {
                // في البيئة المحلية، استخدم البيانات التجريبية
                console.log('🏠 تشغيل محلي - استخدام بيانات تجريبية');

                // محاكاة تأخير API
                await new Promise(resolve => setTimeout(resolve, 1000));

                articles = mockNewsData.articles;

                // إضافة بانر توضيحي
                const localBanner = document.createElement('div');
                localBanner.style.cssText = `
                    background: #e3f2fd; 
                    border: 1px solid #2196f3; 
                    color: #0d47a1; 
                    padding: 15px; 
                    margin-bottom: 20px; 
                    border-radius: 8px; 
                    text-align: center;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                `;
                localBanner.innerHTML = `
                    <strong>🏠 وضع التطوير المحلي</strong><br>
                    <small>يتم عرض أخبار تجريبية - للحصول على أخبار حقيقية، ارفع الموقع على Vercel</small>
                `;
                newsGrid.parentNode.insertBefore(localBanner, newsGrid);

            } else {
                // على الخادم، جلب الأخبار الحقيقية
                console.log('🌐 تشغيل على الخادم - جلب أخبار حقيقية');

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

                articles = data.articles || [];
            }

            // حفظ البيانات في localStorage للصفحة التفصيلية
            localStorage.setItem('lingramNewsData', JSON.stringify(articles));

            // عرض الأخبار
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

                    // إظهار رسالة تحديث
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
                        ${isLocalhost ?
                'تأكد من رفع الموقع على Vercel للحصول على أخبار حقيقية' :
                'قد يكون السبب: انتهاء حصة API أو مشكلة في الشبكة'
            }
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

    // إعادة تحميل الأخبار كل 10 دقائق (فقط على الخادم)
    if (!isLocalhost) {
        setInterval(() => {
            console.log('🔄 إعادة تحديث تلقائية...');
            loadNews();
        }, 10 * 60 * 1000);
    }
});
