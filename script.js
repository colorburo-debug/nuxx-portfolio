/* ============================================================
   NUXX — script.js
   Mobile menu uses document-level event delegation so it works
   reliably across all pages and after Barba.js page transitions.
   The listeners are attached ONCE on DOMContentLoaded and never
   need to be re-initialised.
   ============================================================ */

// ─── Mobile Menu ────────────────────────────────────────────

const openMobileMenu = () => {
    const overlay = document.getElementById('mobile-menu');
    if (overlay) {
        overlay.classList.add('active');
        document.body.classList.add('no-scroll');
    }
};

const closeMobileMenu = () => {
    const overlay = document.getElementById('mobile-menu');
    if (overlay) {
        overlay.classList.remove('active');
        document.body.classList.remove('no-scroll');
    }
};

// ─── Custom Cursor ──────────────────────────────────────────
const initCursor = () => {
    const reticle = document.getElementById('cursor-reticle');
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (reticle && !isTouchDevice) {
        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let reticleX = mouseX;
        let reticleY = mouseY;
        let hasMoved = false;

        // Hide cursor initial state until mouse moves to prevent weird jumping/centering on load
        reticle.style.opacity = '0';
        reticle.style.transition = 'transform 0.25s cubic-bezier(0.19, 1, 0.22, 1), opacity 0.3s ease';

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            if (!hasMoved) {
                reticleX = mouseX;
                reticleY = mouseY;
                reticle.style.opacity = '1';
                hasMoved = true;
            }
        });

        const tick = () => {
            // 0.15 is the sweet spot for smooth, premium-feeling trailing lag
            reticleX += (mouseX - reticleX) * 0.15;
            reticleY += (mouseY - reticleY) * 0.15;
            reticle.style.left = `${reticleX}px`;
            reticle.style.top = `${reticleY}px`;
            requestAnimationFrame(tick);
        };
        tick();
    }
};

const updateCursorHover = () => {
    const reticle = document.getElementById('cursor-reticle');
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (reticle && !isTouchDevice) {
        // Re-query interactive elements after page transition
        const interactiveElements = document.querySelectorAll(
            'a, button, .action-btn, .mobile-menu-toggle, .about-cta-pill, .interaction-indicator'
        );
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                reticle.style.transform = 'translate(-50%, -50%) scale(3.5)';
            });
            el.addEventListener('mouseleave', () => {
                reticle.style.transform = 'translate(-50%, -50%) scale(1)';
            });
        });
    }
};


// ─── Header Inversion ───────────────────────────────────────
// Managed globally to remain active across page transitions
const handleHeaderScroll = () => {
    const header = document.querySelector('.header-pill');
    const workSection = document.querySelector('.work-highlights');

    if (!header || !workSection) {
        // Reset if no work section present on current page
        if (header) header.classList.remove('header-inverted');
        return;
    }

    const headerRect = header.getBoundingClientRect();
    const workRect = workSection.getBoundingClientRect();

    // Check if the bottom of the header has crossed the top of the Work section
    if (workRect.top <= headerRect.bottom && workRect.bottom >= headerRect.top) {
        header.classList.add('header-inverted');
    } else {
        header.classList.remove('header-inverted');
    }

    // Hide theme toggle when the header is about to reach the Work section
    // We trigger the fade out when the header is within 150px of the work section
    if (workRect.top - headerRect.bottom <= 150) {
        header.classList.add('header-past-hero');
    } else {
        header.classList.remove('header-past-hero');
    }
};

// ─── initPage ───────────────────────────────────────────────
// Called by Barba.js beforeEnter hooks in animations.js.
const initPage = () => {
    console.log('Nuxx Page Initialized');

    // Always reset menu state on page enter
    closeMobileMenu();

    // Re-bind hover events for the new page content
    updateCursorHover();

    // Re-bind WebGL lifecycle
    if (document.getElementById('webgl-container')) {
        if (window.initWebGL) window.initWebGL();
    } else {
        window.isWebGLRunning = false;
    }

    // Trigger initial check
    handleHeaderScroll();

    // Handle hash scrolling (e.g., /index.html#work)
    const hash = window.location.hash;
    if (hash) {
        const target = document.querySelector(hash);
        if (target) {
            // Slight delay to ensure content is rendered and layout is stable
            setTimeout(() => {
                target.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }
};

// ─── Global Event Listeners (Attached Once) ─────────────────

const initGlobalListeners = () => {
    // Single scroll listener for header inversion
    window.addEventListener('scroll', handleHeaderScroll, { passive: true });

    // Single delegated listener on document — survives all DOM mutations
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        
        // 1. Mobile Menu Toggle Logic
        if (e.target.closest('#mobile-menu-toggle')) {
            e.stopPropagation();
            openMobileMenu();
            return;
        }

        if (e.target.closest('#mobile-menu-close')) {
            e.stopPropagation();
            closeMobileMenu();
            return;
        }

        // 2. Hash Link Logic (e.g., #work)
        if (link && link.getAttribute('href')?.startsWith('#')) {
            const targetId = link.getAttribute('href');
            const targetEl = document.querySelector(targetId);
            
            if (targetEl) {
                e.preventDefault();
                closeMobileMenu();
                targetEl.scrollIntoView({ behavior: 'smooth' });
                // Update URL hash without jumping
                history.pushState(null, null, targetId);
                return;
            }
        }

        // 3. Close menu on any nav item click (even external/other pages)
        if (e.target.closest('.mobile-nav-item')) {
            closeMobileMenu();
            // Allow default link behavior to proceed
        }
    }, true);

    // Also handle touch events explicitly for iOS Safari reliability
    document.addEventListener('touchend', (e) => {
        if (e.target.closest('#mobile-menu-toggle')) {
            // e.preventDefault(); // Might interfere with click above if not careful
            openMobileMenu();
        }
        if (e.target.closest('#mobile-menu-close')) {
            closeMobileMenu();
        }
    }, { passive: true });
}

// Expose globally for Barba
window.initPage = initPage;

// Run on first load
document.addEventListener('DOMContentLoaded', () => {
    initCursor();
    initGlobalListeners();
    initPage();
});
