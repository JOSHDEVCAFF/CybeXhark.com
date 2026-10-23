(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    const selectors = [
        'body > .main > .navbar',
        'body > .navbar',
        'body > .site-header',
        'body > header',
        'body > .main > .main-content',
        'body > main:not(.container)',
        'body > .container',
        'body > .main > .content',
        'body > .main > .payment-container',
        'body > .main > .payment-container > *',
        '.featured-products',
        '.other-products',
        '.shop-intro',
        '.shop-categories',
        '.listProduct',
        '.services',
        '.contact-section',
        '.service-card',
        '.product-card',
        '.value-card',
        'body > footer'
    ].join(',');
    const elements = [...document.querySelectorAll(selectors)]
        .filter(element => !element.matches('#view-cart') && !element.closest('.sidebar, .admin-view, .account-settings-section'));

    if (elements.length === 0) {
        return;
    }

    document.documentElement.classList.add('motion-enabled');
    elements.forEach((element, index) => {
        element.dataset.motion = 'rise';
        element.style.setProperty('--motion-delay', `${Math.min(index % 5, 4) * 90}ms`);
    });

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, currentObserver) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('motion-visible');
                    currentObserver.unobserve(entry.target);
                }
            });
        }, { rootMargin: '24px 0px' });

        elements.forEach(element => observer.observe(element));
        return;
    }

    let framePending = false;
    const revealVisibleElements = () => {
        framePending = false;
        elements.forEach(element => {
            if (element.classList.contains('motion-visible')) {
                return;
            }
            const bounds = element.getBoundingClientRect();
            if (bounds.top < window.innerHeight - 24 && bounds.bottom > 24) {
                element.classList.add('motion-visible');
            }
        });

        if (elements.every(element => element.classList.contains('motion-visible'))) {
            window.removeEventListener('scroll', scheduleReveal);
            window.removeEventListener('resize', scheduleReveal);
            window.removeEventListener('pageshow', scheduleReveal);
        }
    };
    const scheduleReveal = () => {
        if (framePending) {
            return;
        }
        framePending = true;
        window.requestAnimationFrame(revealVisibleElements);
    };
    window.addEventListener('scroll', scheduleReveal, { passive: true });
    window.addEventListener('resize', scheduleReveal);
    window.addEventListener('pageshow', scheduleReveal);
    revealVisibleElements();
})();
