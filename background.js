// WebGL Background with Three.js - True Continuous Vector Lines (Nature & Toucan Topography)
let renderer, scene, camera, clock, raycaster, hitPlane;
let linesArray = []; // Stores our true THREE.Line objects
let isInitialized = false;

// Global State
window.accumTime = 0;
window.smoothedScrollY = 0;
window.introProgress = 0.0;
window.isWebGLRunning = true;
let isVisible = true;

// Interaction State
let currentState = 0; 
let dogMorphFactor = 0.0;
let frogMorphFactor = 0.0;
let humanMorphFactor = 0.0;
let cameraSweep = 0.0;
let targetCameraSweep = 0.0;
let mouse2D = new THREE.Vector2(-9999, -9999);
let targetMouse = new THREE.Vector3(9999, 9999, 9999);
let currentMouse = new THREE.Vector3(9999, 9999, 9999);
let isMouseDown = false;

// Theme State Variables
let isDarkMode = false;
let rippleTime = 999.0; // Dynamic theme transition physical ripple timer
const lightBgColor = new THREE.Color(0xF7FBF8);
const darkBgColor = new THREE.Color(0x1E1E1E);
const lightLineColor = new THREE.Color(0x1E1E1E);
const darkLineColor = new THREE.Color(0xF7FBF8);

let smoothMouseDown = 0.0;
let globalListenersBound = false;

// Fabric Grid Data
// Dynamically reduce geometry on mobile to drastically improve CPU performance
const isMobileDevice = window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent);
const numLines = isMobileDevice ? 55 : 110;
const pointsPerLine = isMobileDevice ? 120 : 250; // High resolution on desktop, optimized on mobile

const initWebGL = (explicitContainer) => {
    const container = explicitContainer || document.getElementById('webgl-container');
    if (!container) return;

    if (isInitialized) {
        if (renderer.domElement.parentElement) renderer.domElement.parentElement.removeChild(renderer.domElement);
        container.appendChild(renderer.domElement);
        if (window.updateWebGLSize) window.updateWebGLSize();
        window.introProgress = 0.0; 
        isVisible = true; 
        window.isWebGLRunning = false; 
        setTimeout(() => { window.isWebGLRunning = true; if (window.animateWebGL) window.animateWebGL(); }, 50);
        return;
    }

    // --- Scene Setup (Light Theme) ---
    scene = new THREE.Scene();
    const bgColor = '#F7FBF8'; 
    scene.background = new THREE.Color(bgColor);
    // Pulled fog closer to create a smooth horizon fade for the fabric lines.
    // Animals sit at Z=0 (distance 6). Wide sketches can have a diagonal distance up to ~14.
    // Starting fog at 16.0 guarantees the entire sketch remains intensely contrasted!
    scene.fog = new THREE.Fog(bgColor, 16.0, 32.0); 
    
    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 3.5, 6);

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    // Cap pixel ratio to 1 on mobile to save GPU fill-rate, max 2 on desktop
    renderer.setPixelRatio(isMobileDevice ? 1 : Math.min(window.devicePixelRatio, 2));

    const updateSize = () => {
        const currentContainer = document.getElementById('webgl-container');
        if (!currentContainer) return;
        renderer.setSize(currentContainer.clientWidth, currentContainer.clientHeight);
        camera.aspect = currentContainer.clientWidth / currentContainer.clientHeight;
        camera.updateProjectionMatrix();
    };
    updateSize();
    container.appendChild(renderer.domElement);
    window.updateWebGLSize = updateSize;

    // --- Interaction Setup ---
    raycaster = new THREE.Raycaster();
    hitPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200), 
        new THREE.MeshBasicMaterial({ visible: false })
    );
    hitPlane.rotation.x = -Math.PI / 2;
    scene.add(hitPlane);

    // --- Generate True Continuous Lines ---
    const material = new THREE.LineBasicMaterial({
        color: 0x1E1E1E, 
        transparent: true,
        opacity: 0.0,
        linewidth: 1 
    });

    for (let r = 0; r < numLines; r++) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(pointsPerLine * 3);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const line = new THREE.Line(geometry, material);
        scene.add(line);
        linesArray.push(line);
    }

    clock = new THREE.Clock();
    isVisible = true;

    const observer = new IntersectionObserver((entries) => { isVisible = entries[0].isIntersecting; }, { rootMargin: "100px" });
    observer.observe(container);

// Spline logic for Continuous Line Art
function getCatmullRomPoint(t, points) {
    const p = points.length - 1;
    const tScaled = t * p;
    const i = Math.floor(tScaled);
    const frac = tScaled - i;
    
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[Math.min(p, i + 1)];
    const p3 = points[Math.min(p, i + 2)];
    
    const t2 = frac * frac;
    const t3 = t2 * frac;
    
    const x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * frac + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
    const z = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * frac + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
    
    return {x, z};
}

// The detailed, cute sitting puppy path with floppy ear and wagging tail
const animalSpline = [
    [-20, -7.2],  // Enter from sky
    [-8, -7.2],   // Approach nose horizontally
    
    // --- Head & Nose ---
    [-4.5, -7.2], // Nose tip
    [-4.0, -7.5], // Bridge
    [-3.0, -8.0], // Forehead
    [-2.0, -8.5], // Head top
    
    // --- Ear ---
    [-1.5, -8.5], // Ear front base
    [-1.0, -5.0], // Ear tip (long drop)
    [-0.5, -5.0], // Ear tip back
    [-0.8, -8.0], // Ear back base
    
    // --- Back ---
    [0.0, -6.5],  // Upper back
    [1.5, -4.0],  // Mid back
    [2.5, -2.0],  // Lower back / Butt
    
    // --- Tail ---
    [3.5, -2.0],  // Tail sweep right
    [4.5, -4.5],  // Tail up
    [4.0, -5.5],  // Tail tip
    [3.5, -4.5],  // Tail down
    [2.8, -2.0],  // Tail base
    
    // --- Sitting Back Leg ---
    [1.0, -2.0],  // Back toe (moving left)
    
    // --- High Knee & Belly ---
    [0.5, -3.0],  // Shin
    [-0.2, -4.8], // Knee peak (high and rounded)
    [-1.0, -4.0], // Belly curve
    [-1.5, -2.8], // Belly lowest point
    
    // --- Chest to Throat ---
    [-2.2, -4.5], // Chest up
    [-2.6, -6.5], // Throat peak
    
    // --- Front Leg ---
    [-3.0, -4.0], // Leg down
    [-3.5, -2.0], // Front toe
    [-2.5, -2.0], // Front heel
    
    // --- Exit ---
    [0.0, -2.0],  // Sweep right along floor
    [8, -2.0],
    [20, -2.0]
];

// The elegant single-stroke Frog path
const frogSpline = [
    [-20, -5],
    [-8, -5],
    // Long back leg extending down-left
    [-5, -2],    // Toe
    [-4, -2.5],
    [-2, -4],    // Knee
    [-3, -5],    // Hip
    // Arched back
    [-1, -7],
    [1, -7.5],   // Neck
    // Eye
    [1.5, -8.5],
    [2, -7.5],
    // Snout
    [3.5, -6.5],
    [2.5, -5],   // Throat
    // Front Legs tucked
    [1.5, -4],
    [1, -2],     // Paw 1
    [1.5, -2.5],
    [2, -4],
    [2.5, -3],   // Paw 2
    // Belly
    [1, -4.5],
    [-1, -5],
    [-2, -5],    // Meet hip
    [8, -5],
    [20, -5]
];

// The stunning single-stroke Optical Illusion Faces (Horizontal Arrangement)
const humanSpline = [
    // Enter from far left
    [-20.0, -7.0],
    [-12.0, -7.0],
    [-9.0,  -5.0],
    
    // --- LEFT FACE (Looking Down/Right) ---
    [-6.5, -3.3], // Forehead
    [-5.0, -2.1], // Brow ridge
    [-4.5, -2.4], // Eye socket
    [-4.0, -2.1], // Nose bridge
    [-3.5, -1.5], // Nose tip
    [-3.0, -1.9], // Under nose
    [-2.8, -1.7], // Upper lip
    [-2.5, -2.0], // Mouth line
    [-2.2, -1.8], // Lower lip
    [-1.7, -2.2], // Under lip
    [-1.0, -1.7], // Chin
    
    // --- TRANSITION (Neck / Space) ---
    [-0.5, -3.0], // Center point
    
    // --- RIGHT FACE (Looking Up/Left) ---
    [ 0.0, -4.3], // Chin
    [ 0.7, -3.8], // Under lip
    [ 1.2, -4.2], // Lower lip
    [ 1.5, -4.0], // Mouth line
    [ 1.8, -4.3], // Upper lip
    [ 2.0, -4.1], // Under nose
    [ 2.5, -4.5], // Nose tip
    [ 3.0, -3.9], // Nose bridge
    [ 3.5, -3.6], // Eye socket
    [ 4.0, -3.9], // Brow ridge
    [ 5.5, -2.7], // Forehead
    
    // Exit far right
    [ 8.0, -1.0],
    [11.0,  1.0],
    [20.0,  1.0]
];

        // Theme Toggle Listener
        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent morph toggle from triggering
                isDarkMode = !isDarkMode;
                themeBtn.classList.toggle('is-dark', isDarkMode);
                
                // Trigger a physical dynamic wave ripple across the fabric mesh
                rippleTime = 0.0;
                
                // Toggle a specific class on the body to style the header appropriately in the Dark Hero
                document.body.classList.toggle('hero-dark-mode', isDarkMode);
            });
        }

    const animate = () => {
        if (!document.getElementById('webgl-container') || !window.isWebGLRunning) {
            window.isWebGLRunning = false; return; 
        }
        requestAnimationFrame(animate);
        if (!isVisible) return;

        const dt = Math.min(clock.getDelta(), 0.1);
        window.introProgress += (1.0 - window.introProgress) * 0.8 * dt;
        
        // Progress the physical theme-change ripple timer
        if (rippleTime < 5.0) rippleTime += dt;
        
        material.opacity = window.introProgress * 1.0;
        
        window.accumTime += dt * 0.8; 

        const targetScrollY = window.scrollY || document.documentElement.scrollTop || 0;
        window.smoothedScrollY += (targetScrollY - window.smoothedScrollY) * 5.0 * dt;

        let targetMouseDown = isMouseDown ? 1.0 : 0.0;
        smoothMouseDown += (targetMouseDown - smoothMouseDown) * 0.1;
        
        // Dynamic Brush Speed (Ease-In / Ease-Out)
        const getSpeed = (factor) => {
            const progress = Math.max(0, Math.min(1, factor / 1.2));
            // Slowed down by ~5% for an even more deliberate, majestic pace
            return 0.003 + Math.sin(progress * Math.PI) * 0.016; 
        };

        if (currentState === 1) dogMorphFactor = Math.min(1.2, dogMorphFactor + getSpeed(dogMorphFactor));
        else dogMorphFactor = Math.max(0.0, dogMorphFactor - getSpeed(dogMorphFactor));

        if (currentState === 2) frogMorphFactor = Math.min(1.2, frogMorphFactor + getSpeed(frogMorphFactor));
        else frogMorphFactor = Math.max(0.0, frogMorphFactor - getSpeed(frogMorphFactor));

        if (currentState === 3) humanMorphFactor = Math.min(1.2, humanMorphFactor + getSpeed(humanMorphFactor));
        else humanMorphFactor = Math.max(0.0, humanMorphFactor - getSpeed(humanMorphFactor));

        const introRise = (1.0 - Math.min(Math.max(window.introProgress, 0), 1)) * -4.0;
        // Apply a downward shift of ~10% on desktop specifically for the fabric wave state
        const winW = window.innerWidth;
        const desktopFabricOffset = winW >= 1025 ? -1.0 : 0.0; 
        const influenceRadius = 4.5 + 2.0 * smoothMouseDown;

        // Evaluate viewport scales ONCE per frame instead of 27,500 times inside the loop
        const isMobile = winW < 768;
        const isTablet = winW >= 768 && winW <= 1024;
        const scale = isMobile ? 0.55 : (isTablet ? 0.75 : 1.0); 
        let mY = 0.0, mX = 0.0;
        if (isMobile) {
            mY = 3.5;  mX = -0.5;
        } else if (isTablet) {
            mY = 2.8;  mX = 0.0;
        }

        for (let r = 0; r < numLines; r++) {
            const line = linesArray[r];
            const positions = line.geometry.attributes.position.array;
            
            const zBase = 4.0 - (r / numLines) * 32.0; 
            
            for (let c = 0; c < pointsPerLine; c++) {
                const xBase = -20.0 + (c / pointsPerLine) * 40.0; 
                
                let fX = xBase;
                let fZ = zBase;
                let fY = 0;

                // --- STATE 0: Lifeless Waves (Abstract Silk Ocean) ---
                const wave1 = Math.sin(fX * 0.3 + window.accumTime * 0.8 + fZ * 0.15);
                const wave2 = Math.cos(fZ * 0.4 - window.accumTime * 0.5 + fX * 0.1);
                let silkY = ((wave1 + wave2) * 0.5) + desktopFabricOffset;

                // --- STATE 1: Continuous Line Animal (Upright facing camera) ---
                const t = c / (pointsPerLine - 1);
                const splinePt = getCatmullRomPoint(t, animalSpline);
                
                // Tighter noise (reduced by 10%) for a crisper sketch line
                const sketchNoiseX = Math.sin(r * 12.3 + c * 0.1) * 0.135;
                const sketchNoiseY = Math.cos(r * 8.7 - c * 0.1) * 0.135;
                const sketchNoiseZ = Math.sin(r * 5.1 + c * 0.05) * 0.27; // 3D depth volume



                // --- STATE 1: Continuous Line Animal (Dog) ---
                const splinePt1 = getCatmullRomPoint(t, animalSpline);
                const anim1X = (splinePt1.x * scale) + 1.0 + mX + sketchNoiseX;
                const anim1Y = (-splinePt1.z * scale) - 2.5 + mY + sketchNoiseY;  
                const anim1Z = 0 + sketchNoiseZ; 

                // --- STATE 2: Continuous Line Animal (Frog) ---
                const splinePt2 = getCatmullRomPoint(t, frogSpline);
                const anim2X = (splinePt2.x * scale) + 1.0 + mX + sketchNoiseX;
                const anim2Y = (-splinePt2.z * scale) - 2.5 + mY + sketchNoiseY; 
                const anim2Z = 0 + sketchNoiseZ; 

                // --- STATE 3: Continuous Line Human (Optical Illusion) ---
                const splinePt3 = getCatmullRomPoint(t, humanSpline);
                const anim3X = (splinePt3.x * scale) + 1.0 + mX + sketchNoiseX;
                // Shifted Y up by an additional 2.0 units (10%) specifically for the Human sketch
                const anim3Y = (-splinePt3.z * scale) - 0.5 + mY + sketchNoiseY; 
                const anim3Z = 0 + sketchNoiseZ;

                // Convert global linear weights into a tighter, deliberate "Brush Stroke" effect
                let rawDog = Math.max(0, Math.min(1, (dogMorphFactor - t * 0.8) / 0.4));
                let rawFrog = Math.max(0, Math.min(1, (frogMorphFactor - t * 0.8) / 0.4));
                let rawHuman = Math.max(0, Math.min(1, (humanMorphFactor - t * 0.8) / 0.4));

                // Apply Quintic "Smootherstep" easing to the vertices. 
                // This curve has zero acceleration at start/end, making the motion incredibly buttery and fluid.
                const smootherstep = (x) => x * x * x * (x * (x * 6 - 15) + 10);
                
                const localDogMorph = smootherstep(rawDog);
                const localFrogMorph = smootherstep(rawFrog);
                const localHumanMorph = smootherstep(rawHuman);

                // Prevent coordinate addition glitches by normalizing overlapping weights
                let wDog = localDogMorph;
                let wFrog = localFrogMorph;
                let wHuman = localHumanMorph;
                const totalAnimalWeight = wDog + wFrog + wHuman;

                if (totalAnimalWeight > 1.0) {
                    wDog /= totalAnimalWeight;
                    wFrog /= totalAnimalWeight;
                    wHuman /= totalAnimalWeight;
                }

                // Blend between all states based on normalized staggered weights
                const waveWeight = Math.max(0, 1.0 - (wDog + wFrog + wHuman));
                
                fX = fX * waveWeight + anim1X * wDog + anim2X * wFrog + anim3X * wHuman;
                fZ = fZ * waveWeight + anim1Z * wDog + anim2Z * wFrog + anim3Z * wHuman;
                fY = silkY * waveWeight + anim1Y * wDog + anim2Y * wFrog + anim3Y * wHuman;

                // Organic Idle Breathing for Animals
                const breathingY = Math.sin(window.accumTime * 2.0 + t * Math.PI) * 0.2 * (1.0 - waveWeight);
                
                // Expanding physical radial ring ripple when theme is toggled
                let themeRipple = 0;
                if (rippleTime < 4.0) {
                    const distToCenter = Math.sqrt(fX*fX + fZ*fZ);
                    const waveSpeed = 8.0;
                    const waveFrequency = 1.0;
                    const decay = Math.exp(-rippleTime * 1.5);
                    themeRipple = Math.sin(distToCenter * waveFrequency - rippleTime * waveSpeed) * decay * 1.2;
                }
                
                fY += breathingY + themeRipple;
                
                // Shift the sketches upwards by ~10% (1.0 unit) specifically on desktop when in a sketching state
                const desktopSketchOffset = (winW >= 1025) ? 1.0 : 0.0;
                fY += desktopSketchOffset * (1.0 - waveWeight);
                
                fY += introRise;

                // --- INTERACTION: Soft Magnetic Lift (Hover) ---
                if (currentMouse.x !== 9999) {
                    const dx = fX - currentMouse.x;
                    const dz = fZ - currentMouse.z;
                    const distSq = dx*dx + dz*dz;
                    const radiusSq = influenceRadius * influenceRadius;

                    if (distSq < radiusSq) {
                        // Smooth bell curve (Gaussian) to prevent jagged line distortion
                        const inf = Math.exp(-distSq / (radiusSq * 0.15)); 
                        
                        // Gently lift the lines UP to meet the cursor, like plucking a string
                        // Multiply by (1.0 - waveWeight) so hover ONLY works on the animal states, skipping the fabric lines
                        const liftHeight = (2.5 + smoothMouseDown * 2.0) * (1.0 - waveWeight);
                        fY += inf * liftHeight;
                    }
                }

                fY -= window.smoothedScrollY * 0.005;

                positions[c * 3] = fX;
                positions[c * 3 + 1] = fY;
                positions[c * 3 + 2] = fZ;
            }
            line.geometry.attributes.position.needsUpdate = true;
        }

        // --- CAMERA CINEMATICS ---
        // State 0: High up, looking down at the horizon
        const camY_0 = 3.5;
        const camZ_0 = 6.0;
        const lookY_0 = 0.0;
        const lookZ_0 = -5.0;

        // State 1: Eye-level, pulled back to see the entire sweeping sketch
        const camY_1 = 0.5;
        const camZ_1 = 22.0; 
        const lookY_1 = 0.0;
        const lookZ_1 = 0.0;

        // Both animal states use the same camera framing
        const animalWeight = Math.min(1.0, dogMorphFactor + frogMorphFactor + humanMorphFactor);
        const currentCamY = camY_0 * (1.0 - animalWeight) + camY_1 * animalWeight;
        const currentCamZ = camZ_0 * (1.0 - animalWeight) + camZ_1 * animalWeight;
        const currentLookY = lookY_0 * (1.0 - animalWeight) + lookY_1 * animalWeight;
        const currentLookZ = lookZ_0 * (1.0 - animalWeight) + lookZ_1 * animalWeight;

        // Smooth camera velocity: ease outward smoothly, then drift back gracefully
        cameraSweep += (targetCameraSweep - cameraSweep) * 0.06;
        targetCameraSweep += (0.0 - targetCameraSweep) * 0.02;

        camera.position.x = Math.sin(window.accumTime * 0.1) * 0.4 + cameraSweep;
        camera.position.y = currentCamY + Math.cos(window.accumTime * 0.1) * 0.2;
        camera.position.z = currentCamZ;
        camera.lookAt(0, currentLookY, currentLookZ);

        // Smoothly interpolate theme colors
        const targetBgColor = isDarkMode ? darkBgColor : lightBgColor;
        const targetLineColor = isDarkMode ? darkLineColor : lightLineColor;
        
        scene.background.lerp(targetBgColor, 0.05);
        scene.fog.color.copy(scene.background);
        material.color.lerp(targetLineColor, 0.05);

        if (mouse2D.x !== -9999) {
            raycaster.setFromCamera(mouse2D, camera);
            const intersects = raycaster.intersectObject(hitPlane);
            if (intersects.length > 0) targetMouse.copy(intersects[0].point);
            else targetMouse.set(9999, 9999, 9999);
        } else {
            targetMouse.set(9999, 9999, 9999);
        }

        currentMouse.lerp(targetMouse, 0.08);
        renderer.render(scene, camera);
    };

    window.animateWebGL = animate;
    animate();

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

    const handleMouseLeave = () => { mouse2D.set(-9999, -9999); isMouseDown = false; };

    if (!globalListenersBound) {
        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        window.addEventListener('mouseleave', handleMouseLeave, { passive: true });
        
        const handleDown = () => { isMouseDown = true; };
        const handleUp = () => { isMouseDown = false; };
        
        const toggleMorph = (e) => {
            if (e && e.target && (e.target.closest('a') || e.target.closest('button'))) return;
            currentState = (currentState + 1) % 4; // Toggle between 0 (Waves), 1 (Dog), 2 (Frog), 3 (Human)
            
            // Trigger cinematic camera sweep on click (eased outward)
            targetCameraSweep = 16.0; 
        };

        window.addEventListener('click', toggleMorph, { passive: true });
        window.addEventListener('mousedown', handleDown, { passive: true });
        window.addEventListener('mouseup', handleUp, { passive: true });
        window.addEventListener('touchstart', (e) => { handleMouseMove(e); handleDown(); }, { passive: true });
        window.addEventListener('touchend', handleUp, { passive: true });
        window.addEventListener('resize', () => { if (window.updateWebGLSize) window.updateWebGLSize(); });

        globalListenersBound = true;
    }

    isInitialized = true;
};

window.initPage = (containerParent) => {
    const context = containerParent || document;
    const container = context.querySelector('#webgl-container');
    if (container) {
        window.introProgress = 0.0;
        initWebGL(container);
    } else {
        window.isWebGLRunning = false;
    }
};

window.initWebGL = initWebGL;

if (document.getElementById('webgl-container')) {
    initWebGL();
}
