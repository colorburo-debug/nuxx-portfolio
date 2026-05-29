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
            // Increased to 0.50 to reduce the "heaviness" by another 30%, making the cursor feel extremely light and snappy
            reticleX += (mouseX - reticleX) * 0.50;
            reticleY += (mouseY - reticleY) * 0.50;
            reticle.style.left = `${reticleX}px`;
            reticle.style.top = `${reticleY}px`;
            requestAnimationFrame(tick);
        };
        tick();
    }
};

const updateCursorHover = (containerParent) => {
    const reticle = document.getElementById('cursor-reticle');
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (reticle && !isTouchDevice) {
        // Re-query interactive elements after page transition
        const context = containerParent || document;
        const interactiveElements = context.querySelectorAll(
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
        if (header && !document.body.classList.contains('artifacts-page')) {
            header.classList.remove('header-inverted');
        }
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

// ─── initArtifacts ──────────────────────────────────────────
const initArtifacts = (containerParent) => {
    const context = containerParent || document;
    const layout = context.querySelector('.artifacts-layout');
    if (!layout) return;

    const navItems = context.querySelectorAll('.artifacts-menu-item');

    // Helper to switch instantly (used on load)
    const switchPanelInstantly = (targetId) => {
        const targetPanel = context.querySelector('#' + targetId);
        const activePanel = context.querySelector('.artifacts-panel.active');
        if (!targetPanel || targetPanel === activePanel) return;

        navItems.forEach(nav => {
            if (nav.getAttribute('data-target') === targetId) {
                nav.classList.add('active');
            } else {
                nav.classList.remove('active');
            }
        });

        if (activePanel) activePanel.classList.remove('active');
        targetPanel.classList.add('active');
    };

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('data-target');
            const targetHash = targetId.replace('panel-', '');
            
            // Update URL hash without page jump
            try {
                if (window.history.pushState) {
                    window.history.pushState(null, null, `#${targetHash}`);
                } else {
                    window.location.hash = targetHash;
                }
            } catch (e) {
                // Ignore DOMException on file:// protocols
            }

            const targetPanel = context.querySelector('#' + targetId);
            const activePanel = context.querySelector('.artifacts-panel.active');

            if (!targetPanel || targetPanel === activePanel) return;

            // Update active states on menu items
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            if (window.gsap) {
                // Smooth crossfade with GSAP
                window.gsap.to(activePanel, {
                    opacity: 0,
                    y: 10,
                    duration: 0.25,
                    onComplete: () => {
                        activePanel.classList.remove('active');
                        targetPanel.classList.add('active');
                        window.gsap.fromTo(targetPanel, 
                            { opacity: 0, y: -10 },
                            { opacity: 1, y: 0, duration: 0.35 }
                        );
                    }
                });
            } else {
                activePanel.classList.remove('active');
                targetPanel.classList.add('active');
            }
        });
    });

    // Handle initial load from URL hash
    if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        const targetId = `panel-${hash}`;
        if (context.querySelector('#' + targetId)) {
            switchPanelInstantly(targetId);
        }
    }

    // Video auto-playback & interaction controller
    const videos = context.querySelectorAll('.artifact-video');
    videos.forEach(video => {
        const container = video.closest('.video-player-mockup');
        const progressBar = container ? container.querySelector('.progress-filled') : null;

        // Prevent autoplay from fighting with manual pauses
        let userPaused = false;

        const updatePlayStateClass = () => {
            if (video.paused) {
                container.classList.remove('playing');
            } else {
                container.classList.add('playing');
            }
        };

        if (container) {
            container.addEventListener('click', (e) => {
                e.stopPropagation();
                if (video.paused) {
                    userPaused = false;
                    video.play().catch(err => console.warn("Video play error:", err));
                } else {
                    userPaused = true;
                    video.pause();
                }
                updatePlayStateClass();
            });
        }

        video.addEventListener('timeupdate', () => {
            if (progressBar && video.duration) {
                const percent = (video.currentTime / video.duration) * 100;
                progressBar.style.width = `${percent}%`;
            }
        });

        video.addEventListener('play', updatePlayStateClass);
        video.addEventListener('pause', updatePlayStateClass);

        // Play/Pause when entering/leaving viewport
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        if (!userPaused) {
                            video.play().catch(err => {
                                console.warn("Autoplay blocked by browser policy:", err);
                            });
                        }
                    } else {
                        video.pause();
                    }
                });
            }, {
                threshold: 0.3 // Play when 30% visible
            });
            observer.observe(video);
        } else {
            // Autoplay fallback
            video.autoplay = true;
            video.play().catch(err => console.warn("Autoplay fallback blocked:", err));
        }
    });
};

// ─── initPage ───────────────────────────────────────────────
// Called by Barba.js beforeEnter hooks in animations.js.
const initPage = (containerParent) => {
    console.log('Nuxx Page Initialized');

    // Always reset menu state on page enter
    closeMobileMenu();

    // Re-bind hover events for the new page content
    updateCursorHover(containerParent);

    // Init artifacts page tabs if present
    initArtifacts(containerParent);



    // Re-bind WebGL lifecycle
    const context = containerParent || document;
    const webglContainer = context.querySelector('#webgl-container');
    if (webglContainer) {
        if (window.initWebGL) window.initWebGL(webglContainer);
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
