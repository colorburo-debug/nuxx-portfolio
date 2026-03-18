/* ============================================================
   NUXX — script.js
   Mobile menu uses document-level event delegation so it works
   reliably across all pages and after Barba.js page transitions.
   The listeners are attached ONCE on DOMContentLoaded and never
   need to be re-initialised.
   ============================================================ */

// ─── Mobile Menu ────────────────────────────────────────────
// We delegate from `document` so the handler survives Barba
// swapping the inner container (which contains the toggle).
// The overlay and close button live outside the Barba container
// on index.html, but we query them fresh each time to support
// pages that load independently (about.html, lahaus.html, etc.)

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

// Single delegated listener on document — survives all DOM mutations
document.addEventListener('click', (e) => {
    // Open: click on the toggle button or any child inside it
    if (e.target.closest('#mobile-menu-toggle')) {
        e.stopPropagation();
        openMobileMenu();
        return;
    }

    // Close: click on the close button or any child inside it
    if (e.target.closest('#mobile-menu-close')) {
        e.stopPropagation();
        closeMobileMenu();
        return;
    }

    // Close: click on a nav item inside the overlay
    if (e.target.closest('.mobile-nav-item')) {
        closeMobileMenu();
        return;
    }
}, true); // useCapture=true ensures we catch events even on elements that stopPropagation

// Also handle touch events explicitly for iOS Safari reliability
document.addEventListener('touchend', (e) => {
    if (e.target.closest('#mobile-menu-toggle')) {
        e.preventDefault();
        openMobileMenu();
        return;
    }
    if (e.target.closest('#mobile-menu-close')) {
        e.preventDefault();
        closeMobileMenu();
        return;
    }
    if (e.target.closest('.mobile-nav-item')) {
        closeMobileMenu();
        return;
    }
}, { passive: false, capture: true });


// ─── initPage ───────────────────────────────────────────────
// Called by Barba.js beforeEnter hooks in animations.js.
// Menu setup is handled globally above, so this only handles
// per-page cursor logic which is not menu-related.
const initPage = () => {
    console.log('Nuxx Page Initialized');

    // Always reset menu state on page enter
    // (clears any stuck 'active' or 'no-scroll' state from a previous page)
    closeMobileMenu();

    // Custom Cursor Logic (desktop only, non-touch)
    const reticle = document.getElementById('cursor-reticle');
    const hasWebGL = document.getElementById('webgl-container');
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (reticle && !hasWebGL && !isTouchDevice) {
        document.addEventListener('mousemove', (e) => {
            reticle.style.left = `${e.clientX}px`;
            reticle.style.top = `${e.clientY}px`;
        });

        const interactiveElements = document.querySelectorAll(
            'a, button, .action-btn, .mobile-menu-toggle, .about-cta-pill'
        );
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                reticle.style.transform = 'translate(-50%, -50%) scale(2.5)';
                reticle.style.borderWidth = '2px';
            });
            el.addEventListener('mouseleave', () => {
                reticle.style.transform = 'translate(-50%, -50%) scale(1)';
                reticle.style.borderWidth = '1px';
            });
        });
    }
};

// Expose globally for Barba
window.initPage = initPage;

// Run on first load
document.addEventListener('DOMContentLoaded', initPage);
