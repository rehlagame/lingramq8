document.addEventListener('DOMContentLoaded', () => {
    const newsGrid = document.getElementById('news-grid');
    const loader = document.getElementById('loader');

    const displayNews = (articles) => {
        newsGrid.innerHTML = '';
        if (!articles || articles.length === 0) {
            newsGrid.innerHTML = '<p>لا توجد أخبار لعرضها حالياً. حاول تحديث الصفحة.</p>';
            return;
        }

        articles.forEach((article, index) => {
            // Filter out articles with "[Removed]" title
            if (article.title === '[Removed]') return;

            const imageUrl = article.urlToImage || 'images/logo.png'; // Use logo as fallback
            const shortDesc = article.description ? article.description.substring(0, 100) + '...' : 'اضغط لقراءة المزيد...';

            const card = document.createElement('a');
            card.className = 'card';
            // Pass the article index to the detail page
            card.href = `article.html?index=${index}`;

            card.innerHTML = `
                <img src="${imageUrl}" alt="${article.title}" class="card-img" onerror="this.onerror=null;this.src='images/logo.png';">
                <div class="card-content">
                    <span class="card-source">${article.source.name}</span>
                    <h2 class="card-title">${article.title}</h2>
                    <p class="card-description">${shortDesc}</p>
                </div>
            `;
            newsGrid.appendChild(card);
        });
    };

    const loadNews = async () => {
        loader.classList.remove('hidden');
        newsGrid.classList.add('hidden');

        try {
            // Fetch real news from our own serverless function
            const response = await fetch('/api/fetchNews');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            const articles = data.articles;

            // Save data to localStorage for the article page to use
            localStorage.setItem('lingramNewsData', JSON.stringify(articles));

            displayNews(articles);

        } catch (error) {
            console.error('Error fetching real news:', error);
            newsGrid.innerHTML = '<p>حدث خطأ أثناء جلب الأخبار. قد تكون واجهة برمجة التطبيقات قد وصلت إلى حدها الأقصى. يرجى المحاولة مرة أخرى لاحقاً.</p>';
        } finally {
            loader.classList.add('hidden');
            newsGrid.classList.remove('hidden');
        }
    };

    loadNews();
});