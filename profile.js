// Respect reduced motion and smooth scrolling options
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const smoothOptions = reduced ? { behavior: 'auto' } : { behavior: 'smooth' };

// Utilities
const safe = (selector) => document.querySelector(selector);
const safeAll = (selector) => Array.from(document.querySelectorAll(selector));

// >>> REPLACE top anchor handlers with a single delegated handler (works on mobile) <<<<
/* Smooth scrolling for nav links (works for both .nav and #navbar)
safeAll('#navbar a, .nav a, a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href') || '';
    if (!href.startsWith('#')) return; // allow external links
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) target.scrollIntoView(smoothOptions);

    // close mobile nav if open
    const nav = safe('#navbar') || safe('.nav');
    if (nav) {
      nav.classList.remove('open');
      nav.classList.remove('active'); // legacy compatibility
    }
    const menuBtn = safe('#menu-btn');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
  }, { passive: true });
}); */

// remove the older per-link handlers and contactBtn handler
// add delegated handler:
(function () {
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest('a[href^="#"]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;

    if (a.closest('#navbar')) {
      setActiveNavLink(a);
    }

    ev.preventDefault();

    // close mobile nav if open
    const navEl = safe('#navbar') || safe('.nav');
    if (a.closest('#navbar') && navEl && (navEl.classList.contains('open') || navEl.classList.contains('active'))) {
      setMenuOpen(false);
    }

    target.scrollIntoView(smoothOptions);
  }, { passive: false });
})();

const setActiveNavLink = (activeLink) => {
  safeAll('#navbar a[href^="#"]').forEach((link) => {
    if (link === activeLink) {
      link.setAttribute('aria-current', 'location');
    } else {
      link.removeAttribute('aria-current');
    }
  });
};

const sectionObserver = ('IntersectionObserver' in window) ? new IntersectionObserver((entries) => {
  const visibleSections = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

  if (!visibleSections.length) return;

  const currentSection = visibleSections[0].target;
  const currentLink = safe(`#navbar a[href="#${currentSection.id}"]`);
  if (currentLink) setActiveNavLink(currentLink);
}, {
  rootMargin: '-20% 0px -65% 0px',
  threshold: 0
}) : null;

if (sectionObserver) {
  safeAll('#navbar a[href^="#"]').forEach((link) => {
    const section = safe(link.getAttribute('href'));
    if (section) sectionObserver.observe(section);
  });
}

// Responsive sidebar: collapsible on desktop and an off-canvas drawer on smaller screens.
const menuBtn = safe('#mobile-menu-btn');
const collapseBtn = safe('#sidebar-collapse-btn');
const sidebarBackdrop = safe('#sidebar-backdrop');
const sidebar = safe('#site-sidebar');
const nav = safe('#navbar') || safe('.nav');
const mobileSidebar = window.matchMedia('(max-width: 1024px)');
const setMenuOpen = (isOpen, focusFirst = false) => {
  if (!menuBtn || !nav || !sidebarBackdrop) return;

  nav.classList.toggle('open', isOpen);
  nav.classList.toggle('active', isOpen);
  document.body.classList.toggle('sidebar-open', isOpen);
  menuBtn.setAttribute('aria-expanded', String(isOpen));
  menuBtn.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  nav.setAttribute('aria-hidden', String(mobileSidebar.matches && !isOpen));
  if (sidebar) sidebar.setAttribute('aria-hidden', String(mobileSidebar.matches && !isOpen));
  sidebarBackdrop.hidden = !isOpen;

  if (focusFirst) {
    const firstLink = nav.querySelector('a');
    if (firstLink) firstLink.focus();
  }
};

if (menuBtn && nav) {
  menuBtn.addEventListener('click', () => {
    setMenuOpen(!nav.classList.contains('open'), !nav.classList.contains('open'));
  });
}

if (collapseBtn) {
  collapseBtn.addEventListener('click', () => {
    const collapsed = document.body.classList.toggle('sidebar-collapsed');
    collapseBtn.setAttribute('aria-expanded', String(!collapsed));
    collapseBtn.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
    collapseBtn.title = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
  });
}

if (sidebarBackdrop && menuBtn) {
  sidebarBackdrop.addEventListener('click', () => {
    setMenuOpen(false);
    menuBtn.focus();
  });
}

if (nav && menuBtn) {
  nav.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a') && mobileSidebar.matches) {
      setMenuOpen(false);
      menuBtn.focus();
    }
  });
}

setMenuOpen(false);

// Close menu on Escape and clicking outside
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (document.body.classList.contains('sidebar-open')) {
      setMenuOpen(false);
      if (menuBtn) menuBtn.focus();
    }
    // also close chat if open
    const chatPanel = safe('.chat-panel');
    const chatToggle = safe('#chat-toggle');
    if (chatPanel && chatPanel.classList.contains('open')) {
      chatPanel.classList.remove('open');
      if (chatToggle) chatToggle.setAttribute('aria-expanded', 'false');
      chatPanel.setAttribute('aria-hidden', 'true');
    }
  }
});

document.addEventListener('click', (e) => {
  const target = e.target;
  // click outside nav closes it on small screens
  if (document.body.classList.contains('sidebar-open')) {
    if (sidebar && !sidebar.contains(target) && menuBtn && !menuBtn.contains(target)) {
      setMenuOpen(false);
    }
  }
});

const handleSidebarBreakpointChange = () => {
  setMenuOpen(false);
  if (collapseBtn) {
    document.body.classList.remove('sidebar-collapsed');
    collapseBtn.setAttribute('aria-expanded', 'true');
    collapseBtn.setAttribute('aria-label', 'Collapse sidebar');
    collapseBtn.title = 'Collapse sidebar';
  }
};

if (mobileSidebar.addEventListener) {
  mobileSidebar.addEventListener('change', handleSidebarBreakpointChange);
} else {
  mobileSidebar.addListener(handleSidebarBreakpointChange);
}

// Theme toggle (dark / light) with persistence
const themeToggle = safe('#theme-toggle');
const applyTheme = (isDark) => {
  if (isDark) {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
  try { localStorage.setItem('theme', isDark ? 'dark' : 'light'); } catch (e) {}
  // swap icons if present
  if (themeToggle) {
    const sun = themeToggle.querySelector('.icon-sun');
    const moon = themeToggle.querySelector('.icon-moon');
    if (sun) sun.style.display = isDark ? 'none' : 'inline';
    if (moon) moon.style.display = isDark ? 'inline' : 'none';
    themeToggle.setAttribute('aria-pressed', String(isDark));
    themeToggle.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  }
};

// Initialize theme from localStorage or system preference
(() => {
  const stored = (() => { try { return localStorage.getItem('theme'); } catch (e) { return null; } })();
  let useDark = false;
  if (stored === 'dark') useDark = true;
  else if (stored === 'light') useDark = false;
  else useDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(useDark);
})();

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark');
    applyTheme(isDark);
  });
}

// <<< Chat code removed per request >>>
// All variables and handlers for the chat widget (toggle, panel, full-mode, send/receive)
// have been removed. If you want the chat back later, I can add a simplified version.

// Set current year in footer if element exists
const yearEl = safe('#year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

// Animate skill bars (reads data-percent)
safeAll('.skill-fill').forEach(el => {
  const pct = el.getAttribute('data-percent') || el.dataset.percent || '0';
  // small delay so it animates after load
  setTimeout(() => { el.style.width = pct.endsWith('%') ? pct : pct + '%'; }, 250);
});

// Close mobile nav when viewport becomes wide (avoid stuck open after rotate)
(function () {
  const BREAKPOINT = 900;
  let lastWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    const w = window.innerWidth;
    // only act when crossing the breakpoint threshold
    if (lastWidth <= BREAKPOINT && w > BREAKPOINT) {
      const navEl = safe('#navbar') || safe('.nav');
      if (navEl) setMenuOpen(false);
    }
    lastWidth = w;
  }, { passive: true });
})();

/* Reveal-on-scroll using IntersectionObserver */
(function () {
  // Respect reduced motion — if user prefers reduced motion, reveal all immediately
  if (reduced) {
    safeAll('.reveal').forEach(el => el.classList.add('is-visible'));
    return;
  }

  const reveals = safeAll('.reveal');
  if (!reveals.length) return;

  // Options: trigger slightly before element fully in view
  const ioOptions = {
    root: null,
    rootMargin: '0px 0px -12% 0px',
    threshold: 0.12
  };

  // Observer callback: add is-visible when entering; remove when leaving to allow slide-out
  const io = ('IntersectionObserver' in window) ? new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const el = entry.target;
      if (entry.isIntersecting) {
        el.classList.add('is-visible');
        // optional: keep visible permanently by unobserving
        // io.unobserve(el);
      } else {
        // slide out when leaving top of viewport; keep this behavior for subtle exit
        el.classList.remove('is-visible');
      }
    });
  }, ioOptions) : null;

  if (io) {
    reveals.forEach((el, idx) => {
      // optional stagger support via data-delay attr
      const delay = idx % 3;
      if (!el.hasAttribute('data-delay')) el.setAttribute('data-delay', String(delay));
      io.observe(el);
    });
  } else {
    // fallback: no IO support - reveal all
    reveals.forEach(el => el.classList.add('is-visible'));
  }
})();

// CTA: scroll to contact and copy-email behaviour
(function () {
  const ctaBtn = safe('#cta-scroll-btn');
  const copyEmailBtn = safe('#copy-email-btn');
  const contactSection = safe('#contact');

  if (ctaBtn && contactSection) {
    ctaBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // use header offset scroll (reuse header height logic)
      const header = safe('.site-header');
      const headerOffset = header ? Math.round(header.getBoundingClientRect().height) + 12 : 96;
      const top = contactSection.getBoundingClientRect().top + window.pageYOffset - headerOffset;
      window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
    });
  }

  if (copyEmailBtn) {
    const toast = document.createElement('div');
    toast.className = 'cta-toast';
    toast.textContent = 'Email copied to clipboard';
    document.body.appendChild(toast);

    copyEmailBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = 'joshscz123@gmail.com';
      try {
        await navigator.clipboard.writeText(email);
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
      } catch (err) {
        // fallback: show prompt
        window.prompt('Copy email:', email);
      }
    });
  }
})();
