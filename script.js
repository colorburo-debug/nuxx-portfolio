const initPage = () => {
    console.log('Nuxx Page Initialized');
    
    // Mobile Menu Logic
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenuClose = document.getElementById('mobile-menu-close');
    const mobileMenuOverlay = document.getElementById('mobile-menu');
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');

    if (mobileMenuToggle && mobileMenuClose && mobileMenuOverlay) {
        // Remove existing listeners if any (simple way for this prototype)
        const newToggle = mobileMenuToggle.cloneNode(true);
        mobileMenuToggle.parentNode.replaceChild(newToggle, mobileMenuToggle);
        
        newToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileMenuOverlay.classList.add('active');
            document.body.classList.add('no-scroll');
        });

        mobileMenuClose.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileMenuOverlay.classList.remove('active');
            document.body.classList.remove('no-scroll');
        });

        mobileNavItems.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuOverlay.classList.remove('active');
                document.body.classList.remove('no-scroll');
            });
        });
    }

    // Custom Cursor Logic
    const reticle = document.getElementById('cursor-reticle');
    const hasWebGL = document.getElementById('webgl-container');
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (reticle && !hasWebGL && !isTouchDevice) {
        document.addEventListener('mousemove', (e) => {
            reticle.style.left = `${e.clientX}px`;
            reticle.style.top = `${e.clientY}px`;
        });

        const interactiveElements = document.querySelectorAll('a, button, .action-btn, .mobile-menu-toggle, .about-cta-pill');
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

document.addEventListener('DOMContentLoaded', initPage);
