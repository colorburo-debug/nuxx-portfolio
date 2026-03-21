// WebGL Background with Three.js - Antigravity Style (Liftoff Intro & Scroll Parallax & Bokeh & Vortex)
let renderer, scene, camera, clock, particles, raycaster, hitPlane;
let isInitialized = false;

// Global Animation Tracking
// Global Animation Tracking (Exposed for Barba.js lifecycle)
window.accumTime = 0;
window.smoothedScrollY = 0;
window.burstVelocity = 35.0; // The massive initial speed for the "Liftoff" burst
let isVisible = true; 

// Mouse Tracking Variables
let mouse2D = new THREE.Vector2(-9999, -9999);
let targetMouse = new THREE.Vector3(9999, 9999, 9999);
let currentMouse = new THREE.Vector3(9999, 9999, 9999);
let isMouseDown = false;

const initWebGL = () => {
    const container = document.getElementById('webgl-container');
    if (!container) return;

    if (isInitialized) {
        container.appendChild(renderer.domElement);
        if (window.updateWebGLSize) window.updateWebGLSize();
        // Reset velocity for reentry burst even if already initialized
        window.burstVelocity = 35.0; 
        return;
    }

    // --- Scene Setup ---
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const updateSize = () => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        if (!width || !height) return;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    };
    updateSize();
    container.appendChild(renderer.domElement);
    window.updateWebGLSize = updateSize;

    // --- Interaction Setup ---
    raycaster = new THREE.Raycaster();
    const hitPlaneGeometry = new THREE.PlaneGeometry(100, 100);
    const hitMaterial = new THREE.MeshBasicMaterial({ visible: false });
    hitPlane = new THREE.Mesh(hitPlaneGeometry, hitMaterial);
    scene.add(hitPlane);

    // --- Particle System ---
    const particleCount = 2015; // Ultra High Density (Increased by another 30% to over 2k particles)
    const geometry = new THREE.BufferGeometry();
    
    // Attributes
    const positions = new Float32Array(particleCount * 3);
    const randoms = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
        // Initial positions spread across a wide area to allow for wrapping
        // X: -10 to 10
        // Y: -10 to 10
        // Z: -2 to 2
        positions[i * 3 + 0] = (Math.random() - 0.5) * 20;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 4;

        // Random values for individualized motion
        randoms[i * 3 + 0] = Math.random();
        randoms[i * 3 + 1] = Math.random();
        randoms[i * 3 + 2] = Math.random();

        // Scale variations mostly small with occasional larger dots
        scales[i] = 1.0 + Math.random() * 2.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 3));
    geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

    const material = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uScrollOffset: { value: 0 }, // For Parallax Depth
            uMouse: { value: new THREE.Vector3(9999, 9999, 9999) },
            uIsMouseDown: { value: 0.0 }, // Trigger for Vortex
            uColor1: { value: new THREE.Color('#1E1E1E') },
            uColor2: { value: new THREE.Color('#6F6F6F') },
            uPixelRatio: { value: renderer.getPixelRatio() }
        },
        vertexShader: `
            uniform float uTime;
            uniform float uPixelRatio;
            uniform vec3 uMouse;
            uniform float uScrollOffset;
            uniform float uIsMouseDown;
            
            attribute vec3 aRandom;
            attribute float aScale;
            
            varying vec3 vRandom;
            varying float vScale;
            varying float vDepth; // Distance to camera

            void main() {
                vRandom = aRandom;
                vScale = aScale;

                vec3 pos = position;

                // Delicate carpet flow logic (More noticeable motion)
                // 1. Smooth continuous vertical drift
                float driftSpeed = 0.3 + aRandom.y * 0.2;
                float timeOffset = uTime * driftSpeed;
                
                // Wrap Y position continuously so they never run out
                pos.y = mod(pos.y + timeOffset + uScrollOffset + 10.0, 20.0) - 10.0;

                // 2. Wider horizontal sway 
                float sway = sin(uTime * 0.25 + pos.y * 0.3 + aRandom.x * 6.28) * 1.5;
                pos.x += sway;

                // 3. More pronounced depth undulation (the "carpet" wave)
                float wave = sin(pos.x * 0.5 + uTime * 0.5) * cos(pos.y * 0.5 + uTime * 0.4);
                pos.z += wave * 1.0 + aRandom.z * 0.5;

                // 4. Smooth Interaction & Magnetic Click Vortex
                float dist = distance(pos.xy, uMouse.xy);
                float influenceRadius = mix(3.5, 7.0, uIsMouseDown); // Expand reach when clicked
                
                // Smooth bell curve for repulsion/attraction
                float influence = smoothstep(influenceRadius, 0.0, dist);
                if (influence > 0.0) {
                    vec2 dir = normalize(pos.xy - uMouse.xy + 0.001);
                    
                    // Push away normally, pull intensely when clicked
                    float pushFactor = mix(1.2, -1.8, uIsMouseDown * influence);
                    
                    // Swirl delicately normally, spin rapidly when clicked
                    vec2 swirlDir = vec2(-dir.y, dir.x); 
                    float swirlFactor = mix(0.6, 6.0, uIsMouseDown * influence);
                    
                    // Blend push and swirl smoothly
                    pos.xy += dir * influence * pushFactor;
                    pos.xy += swirlDir * influence * swirlFactor;
                    
                    // Push back slightly for volume naturally, pull sharply forward towards user during vortex
                    float depthPush = mix(0.8, -2.5, uIsMouseDown);
                    pos.z -= influence * depthPush; 
                }

                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                vDepth = -mvPosition.z; // Send depth forward to simulate blur
                
                // Size mapping
                float baseSize = 10.4; 
                // Grow particles drastically while pulling them out of the background during vortex
                baseSize += uIsMouseDown * influence * 15.0;
                
                gl_PointSize = aScale * baseSize * uPixelRatio * (1.0 / vDepth);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform float uTime;
            uniform vec3 uColor1;
            uniform vec3 uColor2;
            
            varying vec3 vRandom;
            varying float vScale;
            varying float vDepth;

            vec3 getGradient(float t) {
                // Two-color gradient interpolation
                return mix(uColor1, uColor2, t);
            }

            void main() {
                vec2 uv = gl_PointCoord - 0.5;
                float dist = length(uv);
                
                // Perfect, soft circles
                if (dist > 0.5) discard;
                
                // Depth of Field (Simulated Camera Bokeh)
                // Focal plane is roughly at 4.5
                float focusDist = 4.5;
                float blurAmount = smoothstep(0.0, 3.0, abs(vDepth - focusDist));
                
                // Particles completely out of focus have much softer, blurred edges
                float edgeSoftness = mix(0.1, 0.45, blurAmount);
                float alpha = smoothstep(0.5, 0.5 - edgeSoftness, dist);
                
                if (alpha < 0.01) discard;

                // Derive the internal gradient strictly from coordinates 
                float gradientInput = (uv.x + uv.y + 0.5) * 0.5;
                vec3 finalColor = getGradient(clamp(gradientInput, 0.0, 1.0));
                
                // Dim particles gracefully as they get incredibly far away
                float depthFade = 1.0 - smoothstep(5.5, 8.0, vDepth);
                
                // Soft pulse over time
                float pulse = 0.8 + 0.2 * sin(uTime * 0.5 + vRandom.x * 6.28);
                
                gl_FragColor = vec4(finalColor, alpha * pulse * depthFade);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);

    clock = new THREE.Clock();
    
    // Force visibility to true immediately if we are on the homepage to prevent 'frozen' state
    isVisible = true;

    const observer = new IntersectionObserver((entries) => {
        isVisible = entries[0].isIntersecting;
    }, { rootMargin: "100px" });
    observer.observe(container);

    const animate = () => {
        // If the container was removed from the DOM (Barba transition), stop this loop
        if (!document.getElementById('webgl-container')) {
            isInitialized = false; // Allow re-initialization next time
            return; 
        }

        requestAnimationFrame(animate);
        
        // Skip all math and GPU rendering if the canvas is off-screen
        if (!isVisible) return;

        // Limit delta so pausing tabs doesn't break the animation mathematically
        const dt = Math.min(clock.getDelta(), 0.1);

        // 1. LIFTOFF INTRO BURST LOGIC
        window.burstVelocity += (0.0 - window.burstVelocity) * 1.5 * dt;

        let timeMultiplier = 1.0 + window.burstVelocity;
        window.accumTime += dt * timeMultiplier;
        material.uniforms.uTime.value = window.accumTime;

        // 2. PARALLAX SCROLL LOGIC
        const targetScrollY = window.scrollY || document.documentElement.scrollTop || 0;
        window.smoothedScrollY += (targetScrollY - window.smoothedScrollY) * 5.0 * dt;
        material.uniforms.uScrollOffset.value = window.smoothedScrollY * 0.015;

        // 3. ENHANCED VORTEX LOGIC
        let targetMouseDown = isMouseDown ? 1.0 : 0.0;
        let vortexEase = targetMouseDown === 1.0 ? 0.2 : 0.05;
        material.uniforms.uIsMouseDown.value += (targetMouseDown - material.uniforms.uIsMouseDown.value) * vortexEase;

        // 4. ENHANCED VOLUME EFFECTS (Camera tracking)
        let targetCameraZ = 5 + (window.burstVelocity * 0.1);
        camera.position.z += (targetCameraZ - camera.position.z) * 5.0 * dt;

        let baseCameraY = Math.cos(window.accumTime * 0.04) * 0.3;
        camera.position.y = baseCameraY - (window.smoothedScrollY * 0.0012);
        camera.position.x = Math.sin(window.accumTime * 0.05) * 0.5;
        camera.lookAt(scene.position);

        particles.rotation.y = window.accumTime * 0.05;
        particles.rotation.z = window.accumTime * 0.02;

        // 5. MOUSE HANDLING & VORTEX
        // Optimized to only raycast if the mouse is actively on screen
        if (mouse2D.x !== -9999) {
            raycaster.setFromCamera(mouse2D, camera);
            const intersects = raycaster.intersectObject(hitPlane);
            
            if (intersects.length > 0) {
                targetMouse.copy(intersects[0].point);
            } else {
                targetMouse.set(9999, 9999, 9999);
            }
        } else {
            targetMouse.set(9999, 9999, 9999);
        }

        currentMouse.lerp(targetMouse, 0.05);
        material.uniforms.uMouse.value.copy(currentMouse);

        renderer.render(scene, camera);
    };

    animate();

    // Event Listeners
    const handleMouseMove = (e) => {
        const currentContainer = document.getElementById('webgl-container');
        if (!currentContainer) return;
        const rect = currentContainer.getBoundingClientRect();
        
        let clientX = e.clientX ?? e.touches?.[0]?.clientX;
        let clientY = e.clientY ?? e.touches?.[0]?.clientY;
        if (clientX === undefined) return;
        
        mouse2D.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        mouse2D.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const handleMouseLeave = () => {
        mouse2D.set(-9999, -9999); 
        isMouseDown = false;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    
    // Vortex Trigger Listeners
    window.addEventListener('mousedown', () => { isMouseDown = true; }, { passive: true });
    window.addEventListener('mouseup', () => { isMouseDown = false; }, { passive: true });
    window.addEventListener('touchstart', (e) => { 
        handleMouseMove(e); 
        isMouseDown = true; 
    }, { passive: true });
    window.addEventListener('touchend', () => { isMouseDown = false; }, { passive: true });

    isInitialized = true;
};

// Lifecycle management for Barba.js
window.initPage = () => {
    if (document.getElementById('webgl-container')) {
        // Reset animation state for a fresh intro burst every visit
        window.burstVelocity = 35.0; 
        initWebGL();
    }
};

// Expose globally
window.initWebGL = initWebGL;

window.addEventListener('resize', () => {
    if (window.updateWebGLSize) window.updateWebGLSize();
});

// Run if on homepage initially
if (document.getElementById('webgl-container')) {
    initWebGL();
}
