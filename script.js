console.log('Nuxx Portfolio loaded');

document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenuClose = document.getElementById('mobile-menu-close');
    const mobileMenuOverlay = document.getElementById('mobile-menu');
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');

    if (mobileMenuToggle && mobileMenuClose && mobileMenuOverlay) {
        mobileMenuToggle.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent WebGL morph trigger
            mobileMenuOverlay.classList.add('active');
            document.body.classList.add('no-scroll');
        });

        mobileMenuClose.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileMenuOverlay.classList.remove('active');
            document.body.classList.remove('no-scroll');
        });

        // Close menu when a link is clicked
        mobileNavItems.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuOverlay.classList.remove('active');
                document.body.classList.remove('no-scroll');
            });
        });
    }

    // Custom Cursor Logic for pages without background.js
    const reticle = document.getElementById('cursor-reticle');
    const hasWebGL = document.getElementById('webgl-container');

    if (reticle && !hasWebGL) {
        document.addEventListener('mousemove', (e) => {
            reticle.style.left = `${e.clientX}px`;
            reticle.style.top = `${e.clientY}px`;
        });

        const interactiveElements = document.querySelectorAll('a, button, .action-btn, .mobile-menu-toggle');
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
});
