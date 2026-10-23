(() => {
    const header = document.querySelector('.responsive-site-header');
    if (!header) return;

    const menu = header.querySelector('.site-menu');
    const toggle = header.querySelector('.site-menu-toggle');
    const closeButton = header.querySelector('.site-menu-close');
    const backdrop = header.querySelector('.site-menu-backdrop');
    const mobileQuery = window.matchMedia('(max-width: 1024px)');
    if (!menu || !toggle || !closeButton || !backdrop) return;

    const setOpen = (open) => {
        const isOpen = mobileQuery.matches && open;
        document.body.classList.toggle('site-menu-open', isOpen);
        toggle.setAttribute('aria-expanded', String(isOpen));
        toggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
        menu.setAttribute('aria-hidden', String(mobileQuery.matches && !isOpen));
        backdrop.hidden = !isOpen;
    };

    toggle.addEventListener('click', () => {
        setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    closeButton.addEventListener('click', () => {
        setOpen(false);
        toggle.focus();
    });
    backdrop.addEventListener('click', () => {
        setOpen(false);
        toggle.focus();
    });
    menu.addEventListener('click', (event) => {
        if (event.target instanceof Element && event.target.closest('a') && mobileQuery.matches) {
            setOpen(false);
        }
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && document.body.classList.contains('site-menu-open')) {
            setOpen(false);
            toggle.focus();
        }
    });

    const handleBreakpointChange = () => setOpen(false);
    if (mobileQuery.addEventListener) {
        mobileQuery.addEventListener('change', handleBreakpointChange);
    } else {
        mobileQuery.addListener(handleBreakpointChange);
    }
    setOpen(false);
})();