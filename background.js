// WebGL Background with Three.js - Antigravity Style (Liftoff Intro & Scroll Parallax & Bokeh & Vortex)
let renderer, scene, camera, clock, particles, raycaster, hitPlane;
let isInitialized = false;

// Global Animation & Lifecycle Tracking
window.accumTime = 0;
window.smoothedScrollY = 0;
window.introProgress = 0.0; // Tracks the smooth majestic load bloom
window.isWebGLRunning = true; // Tracks the animation loop
let isVisible = true; 

// Interactive Morph State
let isMorphing = false;
let targetMorphFactor = 0.0;

// Mouse Tracking Variables
let mouse2D = new THREE.Vector2(-9999, -9999);
let targetMouse = new THREE.Vector3(9999, 9999, 9999);
let currentMouse = new THREE.Vector3(9999, 9999, 9999);
let isMouseDown = false;

// We ensure listeners are only bound once globally to prevent memory leaks across page transitions
let globalListenersBound = false;

const initWebGL = () => {
    const container = document.getElementById('webgl-container');
    if (!container) return;

    if (isInitialized) {
        // PERF: Reuse WebGL Renderer Context completely on return to home page
        container.appendChild(renderer.domElement);
        if (window.updateWebGLSize) window.updateWebGLSize();
        window.introProgress = 0.0; 
        isVisible = true; // Ensure we start visible to prevent freezing
        
        // RE-OBSERVE: The container was replaced by Barba, so we need a new observation path
        const observer = new IntersectionObserver((entries) => {
            isVisible = entries[0].isIntersecting;
        }, { rootMargin: "100px" });
        observer.observe(container);

        // Restart the animation loop if it was paused
        if (!window.isWebGLRunning) {
            window.isWebGLRunning = true;
            if (window.animateWebGL) window.animateWebGL();
        }
        return;
    }

    // --- Scene Setup ---
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const updateSize = () => {
        // ALWAYS target the latest container in the DOM to avoid closure stale-ness
        const currentContainer = document.getElementById('webgl-container');
        if (!currentContainer) return;
        
        const width = currentContainer.clientWidth;
        const height = currentContainer.clientHeight;
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
    const particleCount = 4500; // Increased density for a solid morphological figure
    const geometry = new THREE.BufferGeometry();
    
    // Attributes
    const positions = new Float32Array(particleCount * 3);
    const targetPositions = new Float32Array(particleCount * 3);
    const randoms = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
        // Initial chaotic positions spread across a wide area
        positions[i * 3 + 0] = (Math.random() - 0.5) * 20;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 4;

        // --- DEFAULT FORM: THE NUXX ENTITY (5-Node Core + Halo) ---
        let baseTx = 0, baseTy = 0, baseTz = 0;
        const nodeDist = 2.4; // Tighter cluster, bringing entities into the center
        const nodeRadius = 0.8; // Compacted nodes
        
        if (i < 3000) {
            const nodeIndex = i % 5;
            // The core nodes form a strict "X" pattern, popping slightly forward
            if (nodeIndex === 0) { baseTx = 0; baseTy = 0; baseTz = 1.0; } 
            if (nodeIndex === 1) { baseTx = -nodeDist; baseTy = nodeDist; baseTz = -0.5; } 
            if (nodeIndex === 2) { baseTx = nodeDist; baseTy = nodeDist; baseTz = -0.5; } 
            if (nodeIndex === 3) { baseTx = -nodeDist; baseTy = -nodeDist; baseTz = -0.5; } 
            if (nodeIndex === 4) { baseTx = nodeDist; baseTy = -nodeDist; baseTz = -0.5; } 

            const pointIndex = Math.floor(i / 5);
            const totalInNode = 600;
            const phi = Math.acos(1 - 2 * (pointIndex + 0.5) / totalInNode);
            const theta = Math.PI * (1 + Math.sqrt(5)) * pointIndex; 
            const rn = nodeRadius * (0.85 + 0.15 * Math.random()); 
            
            baseTx += rn * Math.sin(phi) * Math.cos(theta);
            baseTy += rn * Math.sin(phi) * Math.sin(theta);
            baseTz += rn * Math.cos(phi);
        } else {
            // Ethereal Halo encompassing the central structure tightly
            const ringIndex = i - 3000;
            const totalRing = 1500;
            const angle = (ringIndex / totalRing) * Math.PI * 2;
            const ringRadius = 5.0 + (Math.random() - 0.5) * 1.2; // tighter radius (from 7.5 to 5)
            
            baseTx = Math.cos(angle) * ringRadius;
            baseTy = Math.sin(angle) * ringRadius;
            baseTz = Math.sin(angle * 4) * 1.5 + (Math.random() - 0.5);
        }
        
        // Slightly disrupt perfect symmetry to feel natural
        positions[i * 3 + 0] = baseTx + (Math.random() - 0.5) * 0.1;
        positions[i * 3 + 1] = baseTy + (Math.random() - 0.5) * 0.1;
        positions[i * 3 + 2] = baseTz + (Math.random() - 0.5) * 0.1;

        // --- TARGET FORM: 3D TORUS KNOT (Sacred Geometry) ---
        const t2 = (i / particleCount) * Math.PI * 2 * 10; // 10 loops
        const p2 = 3;
        const q2 = 4;
        const R2 = 3.5; 
        const r2 = 1.2; 
        
        const jitter = 0.15;
        const jx = (Math.random() - 0.5) * jitter;
        const jy = (Math.random() - 0.5) * jitter;
        const jz = (Math.random() - 0.5) * jitter;

        targetPositions[i * 3 + 0] = (R2 + r2 * Math.cos(q2 * t2)) * Math.cos(p2 * t2) * 0.6 + jx;
        targetPositions[i * 3 + 1] = (R2 + r2 * Math.cos(q2 * t2)) * Math.sin(p2 * t2) * 0.6 + jy;
        targetPositions[i * 3 + 2] = (r2 * Math.sin(q2 * t2)) * 0.6 + jz;

        // Random values for individualized motion
        randoms[i * 3 + 0] = Math.random();
        randoms[i * 3 + 1] = Math.random();
        randoms[i * 3 + 2] = Math.random();

        // Scale variations mostly small with occasional larger dots
        scales[i] = 1.0 + Math.random() * 2.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aTargetPos', new THREE.BufferAttribute(targetPositions, 3));
    geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 3));
    geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

    const material = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uScrollOffset: { value: 0 }, 
            uMouse: { value: new THREE.Vector3(9999, 9999, 9999) },
            uIsMouseDown: { value: 0.0 }, 
            uMorphFactor: { value: 0.0 }, 
            uIntroProgress: { value: 0.0 }, // Governs smooth transition
            uColor1: { value: new THREE.Color('#BFFD00') },
            uColor2: { value: new THREE.Color('#c3fe0c') },
            uPixelRatio: { value: renderer.getPixelRatio() }
        },
        vertexShader: `
            uniform float uTime;
            uniform float uPixelRatio;
            uniform vec3 uMouse;
            uniform float uScrollOffset;
            uniform float uIsMouseDown;
            uniform float uMorphFactor;
            uniform float uIntroProgress;
            
            attribute vec3 aTargetPos;
            attribute vec3 aRandom;
            attribute float aScale;
            
            varying vec3 vRandom;
            varying float vScale;
            varying float vDepth; 

            void main() {
                vRandom = aRandom;
                vScale = aScale;

                vec3 entityPos = position;
                vec3 knotPos = aTargetPos;

                // --- GLOBAL ANIMATION SEQUENCES ---
                float st = uTime * 0.4;
                
                // Entity Animation (Slow majestic rotation)
                mat2 rotEntityXZ = mat2(cos(st * 0.8), -sin(st * 0.8), sin(st * 0.8), cos(st * 0.8));
                mat2 rotEntityXY = mat2(cos(st * 0.4), -sin(st * 0.4), sin(st * 0.4), cos(st * 0.4));
                entityPos.xz *= rotEntityXZ;
                entityPos.xy *= rotEntityXY;
                
                float nodePulse = 1.0 + sin(uTime * 2.0 + vRandom.x * 3.14) * 0.05;
                entityPos *= nodePulse;
                entityPos.y += sin(uTime * 1.5 + position.x * 0.2) * 0.3; // Gentle wave

                // Knot Animation (Tighter spin to contrast the massive entity)
                mat2 rotKnotY = mat2(cos(st * 1.5), -sin(st * 1.5), sin(st * 1.5), cos(st * 1.5));
                knotPos.xz *= rotKnotY;
                knotPos.y += sin(uTime * 2.0 + aTargetPos.y * 0.5) * 0.2;

                // --- MORPHING MIX ---
                float morphEase = smoothstep(0.0, 1.0, uMorphFactor);
                // Elastic snap based on particle randomness for visual flair
                float elasticMorph = mix(morphEase, smoothstep(0.0, 1.2, uMorphFactor * (1.0 + aRandom.y * 0.5)), morphEase);
                
                vec3 finalPos = mix(entityPos, knotPos, elasticMorph);

                // --- INTERACTION / VORTEX ---
                // Vortex is always active, allowing users to disrupt both the entity and the knot
                float dist = distance(finalPos.xy, uMouse.xy);
                float influenceRadius = mix(4.0, 8.0, uIsMouseDown); 
                
                float influence = smoothstep(influenceRadius, 0.0, dist);
                if (influence > 0.0) {
                    vec2 dir = normalize(finalPos.xy - uMouse.xy + 0.001);
                    float pushFactor = mix(0.5, -2.5, uIsMouseDown * influence);
                    vec2 swirlDir = vec2(-dir.y, dir.x); 
                    float swirlFactor = mix(0.8, 8.0, uIsMouseDown * influence); // Intense spinning
                    
                    finalPos.xy += dir * influence * pushFactor;
                    finalPos.xy += swirlDir * influence * swirlFactor;
                    float depthPush = mix(1.0, -3.0, uIsMouseDown);
                    finalPos.z -= influence * depthPush; 
                }

                // Add scroll parallax naturally
                finalPos.y += uScrollOffset * 0.5;

                // Intro Spatial Bloom (Particles drift in elegantly from a scattered burst)
                float introScale = mix(2.2, 1.0, smoothstep(0.0, 1.0, uIntroProgress));
                finalPos *= introScale;

                // Add slight intro rotation so it settles elegantly
                float introRot = mix(1.0, 0.0, smoothstep(0.0, 1.0, uIntroProgress)) * 0.5;
                mat2 rotIntro = mat2(cos(introRot), -sin(introRot), sin(introRot), cos(introRot));
                finalPos.xz *= rotIntro;

                vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
                vDepth = -mvPosition.z; 
                
                float baseSize = mix(9.0, 11.0, morphEase); 
                baseSize += uIsMouseDown * influence * 12.0; 
                
                gl_PointSize = aScale * baseSize * uPixelRatio * (1.0 / vDepth);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform float uTime;
            uniform float uIntroProgress;
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
                
                // Majestic Intro fade
                float introFade = smoothstep(0.1, 0.9, uIntroProgress);

                gl_FragColor = vec4(finalColor, alpha * pulse * depthFade * introFade);
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
        // PERFORMANCE: If container is gone or we paused manually, shut down the loop entirely 
        // to save CPU/GPU overhead on other pages. Memory is preserved.
        if (!document.getElementById('webgl-container') || !window.isWebGLRunning) {
            window.isWebGLRunning = false; 
            return; 
        }

        requestAnimationFrame(animate);
        
        // Skip all math and GPU rendering if the canvas is off-screen
        if (!isVisible) return;

        // Limit delta so pausing tabs doesn't break the animation mathematically
        const dt = Math.min(clock.getDelta(), 0.1);

        // 1. MAJESTIC INTRO ANIMATION 
        // Elegant ease-out over roughly 2.5 seconds
        window.introProgress += (1.0 - window.introProgress) * 0.8 * dt;
        material.uniforms.uIntroProgress.value = window.introProgress;

        window.accumTime += dt * 0.8; // Stable, continuous time without the initial violent burst
        material.uniforms.uTime.value = window.accumTime;

        // 2. PARALLAX SCROLL LOGIC
        const targetScrollY = window.scrollY || document.documentElement.scrollTop || 0;
        window.smoothedScrollY += (targetScrollY - window.smoothedScrollY) * 5.0 * dt;
        material.uniforms.uScrollOffset.value = window.smoothedScrollY * 0.015;

        // 3. ENHANCED VORTEX LOGIC
        let targetMouseDown = isMouseDown && !isMorphing ? 1.0 : 0.0;
        let vortexEase = targetMouseDown === 1.0 ? 0.2 : 0.05;
        material.uniforms.uIsMouseDown.value += (targetMouseDown - material.uniforms.uIsMouseDown.value) * vortexEase;

        // 3.5 MORPHING LOGIC
        let morphEase = isMorphing ? 0.03 : 0.02; 
        material.uniforms.uMorphFactor.value += (targetMorphFactor - material.uniforms.uMorphFactor.value) * morphEase;

        // 4. ELEGANT CAMERA TRACKING
        let targetCameraZ = 6.0; // Fixed elegant distance to wrap the centered entity perfectly
        camera.position.z += (targetCameraZ - camera.position.z) * 5.0 * dt;

        let baseCameraY = Math.cos(window.accumTime * 0.05) * 0.2; // Slow gentle floating observation
        camera.position.y = baseCameraY - (window.smoothedScrollY * 0.001);
        camera.position.x = Math.sin(window.accumTime * 0.06) * 0.3;
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

    window.animateWebGL = animate; // Store globally to allow restart
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

    if (!globalListenersBound) {
        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        window.addEventListener('mouseleave', handleMouseLeave, { passive: true });
        
        // Vortex Trigger Listeners (Vortex triggers on down, Morph toggles on click)
        const handleDown = () => { isMouseDown = true; };
        const handleUp = () => { isMouseDown = false; };
        
        // The Morph Toggle
        const toggleMorph = (e) => {
            // Prevent morph when interacting with links or buttons
            if (e && e.target && (e.target.closest('a') || e.target.closest('button'))) return;
            
            isMorphing = !isMorphing;
            targetMorphFactor = isMorphing ? 1.0 : 0.0;
        };

        window.addEventListener('click', toggleMorph, { passive: true });
        
        window.addEventListener('mousedown', handleDown, { passive: true });
        window.addEventListener('mouseup', handleUp, { passive: true });
        window.addEventListener('touchstart', (e) => { 
            handleMouseMove(e); 
            handleDown(); 
        }, { passive: true });
        window.addEventListener('touchend', handleUp, { passive: true });
        
        window.addEventListener('resize', () => {
            if (window.updateWebGLSize) window.updateWebGLSize();
        });

        globalListenersBound = true;
    }

    isInitialized = true;
};

// Lifecycle management for Barba.js
window.initPage = () => {
    if (document.getElementById('webgl-container')) {
        // Reset animation state for a fresh intro burst every visit
        window.introProgress = 0.0;
        initWebGL();
    } else {
        // Cleanup on pages without webgl
        window.isWebGLRunning = false;
    }
};

// Expose globally
window.initWebGL = initWebGL;

// Run if on homepage initially
if (document.getElementById('webgl-container')) {
    initWebGL();
}
