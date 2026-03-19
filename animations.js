// 1. Register GSAP Plugins
gsap.registerPlugin(ScrollTrigger);

const guglieriEase = "power3.out";

/**
 * ANIMATION MODULES
 */

const initHeroAnimations = () => {
    const hasAnimated = sessionStorage.getItem('heroAnimated');
    
    if (hasAnimated) {
        // Skip animation: Set elements to final state immediately
        gsap.set(".hero-title, .hero-subtitle, .hero-description, .interaction-indicator, .about-card", {
            opacity: 1,
            y: 0
        });
        return;
    }

    const heroTl = gsap.timeline({
        defaults: { ease: guglieriEase, duration: 1.2 }
    });

    // Set initial states for hero elements
    gsap.set(".hero-name, .hero-location, .hero-main-description, .hero-intro-right, .interaction-indicator, .about-card", {
        opacity: 0,
        y: 40
    });

    heroTl
        .to(".hero-name", { opacity: 1, y: 0, delay: 0.5 })
        .to(".hero-location", { opacity: 1, y: 0 }, "-=1.0")
        .to(".hero-main-description", { opacity: 1, y: 0 }, "-=1.0")
        .to(".hero-intro-right", { opacity: 1, y: 0 }, "-=1.0")
        .to(".interaction-indicator", { opacity: 1, y: 0 }, "-=1.0")
        .to(".about-card", { opacity: 1, y: 0, duration: 1.5 }, "-=0.8");

    // Mark as animated for this session
    sessionStorage.setItem('heroAnimated', 'true');
};

const initScrollReveals = () => {
    const hasAnimatedWork = sessionStorage.getItem('workAnimated');
    const cards = gsap.utils.toArray('.case-study-card');

    if (hasAnimatedWork) {
        // Skip entry animation: Set cards to visible state immediately
        gsap.set(cards, { opacity: 1, y: 0 });
        return;
    }

    cards.forEach((card) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: "top 85%",
                toggleActions: "play none none none"
            },
            opacity: 0,
            y: 60,
            duration: 1.2,
            ease: guglieriEase
        });
    });

    // Set flag so animations don't repeat in the same session
    sessionStorage.setItem('workAnimated', 'true');
};

const initNavEntrance = () => {
    gsap.from(".header-pill", {
        y: -100,
        opacity: 0,
        duration: 1,
        ease: "power2.out",
        delay: 0.2
    });
};

/**
 * BARBA.JS TRANSITIONS
 */

const pageTransitionOut = (container) => {
    return gsap.to(container, {
        opacity: 0,
        y: -30,
        duration: 0.6,
        ease: "power2.in"
    });
};

const pageTransitionIn = (container) => {
    return gsap.from(container, {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: guglieriEase
    });
};

const getBgColor = (data) => {
    // 1. Check the target container if it exists
    const container = data.next?.container;
    if (container && container.dataset.bodyClass) {
        if (container.dataset.bodyClass === 'home-page') return '#c3fe0c';
        if (container.dataset.bodyClass.includes('fincas')) return '#f7fbf8';
        if (container.dataset.bodyClass.includes('lauhaus')) return '#f7fbf8';
        if (container.dataset.bodyClass === 'about-page') return '#f7fbf8';
    }
    
    // 2. Fallback to trigger link URL
    const url = data.next?.url?.path || "";
    if (url.includes('index.html') || url === '/' || url.endsWith('/')) return '#c3fe0c';
    if (url.includes('about')) return '#f7fbf8';
    if (url.includes('project')) return '#f7fbf8';

    // 3. Fallback to namespace
    const colors = {
        'home': '#c3fe0c',
        'about': '#f7fbf8',
        'project': '#f7fbf8'
    };
    return colors[data.next?.namespace] || '#1e1e1e';
};

barba.init({
    transitions: [{
        name: 'curtain-transition',
        async leave(data) {
            const done = this.async();
            
            // 1. Prepare CURTAIN color based on TARGET page
            const nextColor = getBgColor(data);
            gsap.set('#page-transition-curtain', { 
                backgroundColor: nextColor,
                translateX: '-100%',
                opacity: 1
            });

            // 2. Animate CURTAIN IN (from Left to Center)
            await gsap.to('#page-transition-curtain', {
                translateX: '0%',
                duration: 0.6,
                ease: "power3.inOut"
            });

            // Fade out WebGL if leaving home
            if (data.current.namespace === 'home') {
                gsap.to('#webgl-container', { opacity: 0, duration: 0.3 });
            }

            // Hide OLD content immediately once covered
            gsap.set(data.current.container, { opacity: 0 });

            done();
        },
        async enter(data) {
            // 3. Sync Body Class immediately (Behind the curtain)
            const bodyClass = data.next.container.dataset.bodyClass;
            if (bodyClass) {
                document.body.className = bodyClass;
            }

            // Ensure body background matches next color
            gsap.set('body', { backgroundColor: getBgColor(data) });

            // Reset scroll position while curtain is up
            window.scrollTo(0, 0);

            // Fade in WebGL if entering home
            if (data.next.namespace === 'home') {
                gsap.to('#webgl-container', { opacity: 1, duration: 0.5 });
            }

            // 4. Animate CURTAIN OUT (from Center to Right)
            await gsap.to('#page-transition-curtain', {
                translateX: '100%',
                duration: 0.6,
                ease: "power3.inOut"
            });

            // Reset curtain for next time
            gsap.set('#page-transition-curtain', { translateX: '-100%' });
        }
    }],
    views: [{
        namespace: 'home',
        beforeEnter() {
            if (window.initPage) window.initPage();
            initHeroAnimations();
            initScrollReveals();
        }
    }, {
        namespace: 'about',
        beforeEnter() {
            if (window.initPage) window.initPage();
        }
    }, {
        namespace: 'project',
        beforeEnter() {
            if (window.initPage) window.initPage();
        }
    }]
});

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    // Barba handles initial load via views if properly configured, 
    // but we can trigger it manually if not already handled.
});
