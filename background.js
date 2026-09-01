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
let glObserver = null;
let glReqId = null;
let dogMorphFactor = 0.0;
let birdMorphFactor = 0.0;
let humanMorphFactor = 0.0;
let cameraSweep = 0.0;
let targetCameraSweep = 0.0;
let mouse2D = new THREE.Vector2(-9999, -9999);
let targetMouse = new THREE.Vector3(9999, 9999, 9999);
let currentMouse = new THREE.Vector3(9999, 9999, 9999);
let isMouseDown = false;

// Theme State Variables
let isDarkMode = true;
Object.defineProperty(window, 'isDarkMode', {
    get: () => isDarkMode,
    set: (val) => { isDarkMode = val; }
});
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
const numLines = isMobileDevice ? 35 : 85;
// The animal splines run to ~50 segments, so 85 samples gave mobile only 1.7 samples
// per segment - not enough to hold a curve, which flattened the muzzle and the tail
// hook. 150 restores 3 per segment and still costs a third of the desktop budget
// (35 x 150 = 5,250 vertices per frame against 85 x 180 = 15,300).
const pointsPerLine = isMobileDevice ? 150 : 180;

// Height the camera sees at the sketch distance: 2 * 22 * tan(55deg / 2).
const SKETCH_VIEW_HEIGHT = 22.9;
// Widest extent of the sketches, ignoring the tails that run off frame.
// Dog spans 11.45, bird 11.9 - take the wider so neither crops.
const SKETCH_DESIGN_WIDTH = 11.9;
let sketchFit = 1.0; // Recomputed on every resize by updateSize().

const initWebGL = (explicitContainer) => {
    const container = explicitContainer || document.getElementById('webgl-container');
    if (!container) return;

    // Sync theme toggle button and body classes based on isDarkMode state
    const context = container.closest('[data-barba="container"]') || document;
    const themeBtn = context.querySelector('#theme-toggle');
    if (themeBtn) {
        themeBtn.classList.toggle('is-dark', isDarkMode);
    }
    document.body.classList.toggle('hero-dark-mode', isDarkMode);

    if (isInitialized) {
        window.resumeWebGL(container);
        return;
    }

    // --- Scene Setup ---
    scene = new THREE.Scene();
    const initialBgColor = isDarkMode ? darkBgColor : lightBgColor; 
    scene.background = initialBgColor.clone();
    // Pulled fog closer to create a smooth horizon fade for the fabric lines.
    // Animals sit at Z=0 (distance 6). Wide sketches can have a diagonal distance up to ~14.
    // Starting fog at 16.0 guarantees the entire sketch remains intensely contrasted!
    scene.fog = new THREE.Fog(initialBgColor.clone(), 16.0, 32.0); 
    
    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 3.5, 6);

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    // Cap pixel ratio to 1 on mobile to save GPU fill-rate, max 2 on desktop
    // Now that the mobile stroke is thin, rendering at 1 on a 3x phone screen left it
    // visibly aliased. 1.5 sharpens it while staying well under the desktop fill cost.
    renderer.setPixelRatio(isMobileDevice ? Math.min(window.devicePixelRatio, 1.5)
                                          : Math.min(window.devicePixelRatio, 2));

    const updateSize = () => {
        const currentContainer = document.getElementById('webgl-container');
        if (!currentContainer) return;
        const width = currentContainer.clientWidth || window.innerWidth;
        const height = currentContainer.clientHeight || window.innerHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        // How wide the sketch is allowed to be, worked out once per resize rather
        // than per frame (clientHeight forces layout). The camera sits 22 units
        // back with a 55 degree fov, so it always sees SKETCH_VIEW_HEIGHT of height
        // and that times the aspect of width. #webgl-container is tall and narrow
        // on phones - 375x1628 leaves barely 5 units of width against 26 on a
        // desktop - so a fixed scale crops the animal badly there.
        const visibleWidth = SKETCH_VIEW_HEIGHT * (width / height);
        sketchFit = Math.min(1.0, (visibleWidth * 0.86) / SKETCH_DESIGN_WIDTH);
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
    const initialLineColor = isDarkMode ? darkLineColor : lightLineColor;
    const material = new THREE.LineBasicMaterial({
        color: initialLineColor.clone(), 
        transparent: true,
        opacity: 0.0,
        linewidth: 1 
    });

    // Injects a custom GPU-accelerated spotlight gradient using onBeforeCompile.
    // This provides high-contrast, intense line lighting in the center of the stage
    // while beautifully fading the left and right edges of the lines into the background.
    material.onBeforeCompile = (shader) => {
        shader.vertexShader = 'varying vec3 vWorldPosition;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            `#include <begin_vertex>
            vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;`
        );

        shader.fragmentShader = 'varying vec3 vWorldPosition;\n' + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace(
            'vec4 diffuseColor = vec4( color, opacity );',
            `vec4 diffuseColor = vec4( color, opacity );
            // Calculate horizontal distance from center of composition (X=0)
            float distFromCenter = abs(vWorldPosition.x);
            // Spotlight is fully lit inside 16 units (covering the entire animal sketch area),
            // and fades out seamlessly towards 36 units at the far left/right edges of the screen.
            float spotlight = smoothstep(36.0, 16.0, distFromCenter);
            diffuseColor.a *= spotlight;`
        );
    };

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

    glObserver = new IntersectionObserver((entries) => { isVisible = entries[0].isIntersecting; }, { rootMargin: "100px" });
    glObserver.observe(container);

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

// Sitting dog, true profile, drawn as one unbroken contour.
// Proportions follow the reference line-art: long tapered muzzle, long neck,
// deep chest, belly tucked high. The ear is PRICKED rather than floppy - with a
// single unbroken line a floppy ear can only be a notch, and a notch in the top
// profile reads as a second head. As the highest point a pricked ear needs no
// doubling back at all.
// Three rules keep it legible once the 85 stacked lines are drawn:
//   1. The line bundle is ~0.3 units wide, so no enclosed gap goes below ~1.2.
//   2. One dominant peak (the ear), one dominant curve (the back), one dominant
//      hole (under the belly). Everything else stays subordinate.
//   3. Entry and exit share one baseline so the tails read as ground rather
//      than as a horizon cutting through the animal.
const animalSpline = [
    [-15.8, -0.3],  // Enter along the ground
    [-7.9, -0.3],
    [-3.63, -0.3],  // Front paw
    [-3.56, -1.72],
    [-3.56, -3.15],
    [-3.71, -4.25],  // Deep chest
    [-4.03, -5.36],
    [-4.42, -6.47],  // Long throat line
    [-4.74, -7.42],
    [-5.37, -7.89],  // Jaw
    [-6.16, -8.05],
    [-6.79, -8.21],  // Nose tip
    [-6.64, -8.68],
    [-5.85, -8.76],
    [-5.06, -8.84],  // Muzzle top
    [-4.74, -9.0],  // Stop
    [-4.42, -9.39],  // Forehead
    [-4.27, -9.63],  // Pricked ear: the single highest point
    [-3.87, -10.5],  // Ear tip
    [-3.0, -9.63],
    [-2.77, -9.16],  // Nape
    [-2.29, -8.44],
    [-1.82, -7.5],
    [-1.26, -6.78],  // Withers
    [-0.32, -6.31],  // Back: one gentle descending curve
    [0.79, -5.99],
    [1.74, -5.68],
    [2.69, -5.2],  // Croup
    [3.48, -5.36],  // Tail rises and curls, kept well below the ear
    [4.27, -6.15],
    [4.66, -7.02],
    [4.27, -7.5],  // Tail tip
    [3.71, -6.78],
    [3.4, -5.68],
    [3.24, -4.57],
    [3.16, -3.46],  // Rump down to the ground
    [3.0, -2.04],
    [2.69, -0.3],  // Hind heel
    [1.42, -0.3],  // Hind toe
    [0.95, -1.25],  // Thigh and stifle
    [0.63, -2.67],
    [0.47, -3.94],
    [-0.47, -3.78],  // Belly tucked high: the dominant negative space
    [-1.42, -3.62],
    [-2.05, -3.78],  // Elbow
    [-2.21, -2.51],  // Front leg, back edge
    [-2.29, -1.25],
    [-2.29, -0.3],
    [0.0, -0.3],  // Exit along the same ground line
    [7.9, -0.3],
    [15.8, -0.3]
];

// Dove in flight, one unbroken line, after the reference line-art.
// The entry and exit tails are a flight ribbon rather than the dog's ground line.
// Only one wing is drawn: the far wing is implied by the trailing edge, which dives
// back down across the body and tapers off frame. The scalloped feather loops in the
// reference are deliberately not attempted - each loop would be well under the ~1.2
// unit floor set by the width of the 85-line bundle, and would fill in to a smudge.
// The single crossing under the body is intentional and reads as depth.
const birdSpline = [
    [-20.3, -1.7],  // Entry ribbon flowing in from the far left
    [-13.3, -1.7],
    [-10.5, -1.8],
    [-9.1, -2.3],
    [-8.1, -2.9],
    [-7.1, -3.0],
    [-6.1, -2.6],
    [-5.1, -2.3],
    [-4.1, -2.4],
    [-3.2, -2.8],
    [-2.5, -3.3],  // Tail into the belly
    [-1.9, -3.7],
    [-0.7, -3.8],
    [0.5, -3.9],
    [1.5, -4.1],
    [2.3, -4.7],  // Breast
    [2.9, -5.4],
    [3.3, -6.0],
    [3.6, -6.5],  // Beak
    [4.8, -6.9],  // Beak tip
    [3.7, -7.3],
    [3.1, -7.7],  // Head
    [2.5, -7.8],  // Crown
    [1.9, -7.6],
    [1.4, -7.2],  // Nape
    [0.7, -7.7],  // Wing: leading edge sweeping up and back
    [-0.7, -8.5],
    [-2.3, -9.1],
    [-4.1, -9.4],
    [-5.7, -9.3],
    [-6.9, -8.8],  // Wing tip
    [-5.7, -8.2],  // Wing: trailing edge diving back down
    [-4.1, -7.5],
    [-2.5, -6.7],
    [-1.3, -5.7],
    [-0.3, -4.5],  // Crosses behind the body
    [0.5, -3.3],
    [1.5, -2.3],  // Tapers away as the far wing
    [2.7, -1.5],
    [4.1, -0.9],
    [6.1, -0.5],  // Exit ribbon
    [8.7, -0.2],
    [12.7, 0.0],
    [19.7, 0.2]
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

// Precomputed Spline Point Arrays for maximum rendering performance on mobile and desktop
const precomputedDog = [];
const precomputedBird = [];
const precomputedHuman = [];

function precomputeSplines() {
    precomputedDog.length = 0;
    precomputedBird.length = 0;
    precomputedHuman.length = 0;
    for (let c = 0; c < pointsPerLine; c++) {
        const t = c / (pointsPerLine - 1);
        precomputedDog.push(getCatmullRomPoint(t, animalSpline));
        precomputedBird.push(getCatmullRomPoint(t, birdSpline));
        precomputedHuman.push(getCatmullRomPoint(t, humanSpline));
    }
}
precomputeSplines();



    const animate = () => {
        if (!window.isWebGLRunning) return;
        const currentContainer = document.getElementById('webgl-container');
        if (!currentContainer) {
            glReqId = requestAnimationFrame(animate);
            return;
        }
        glReqId = requestAnimationFrame(animate);
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

        if (currentState === 2) birdMorphFactor = Math.min(1.2, birdMorphFactor + getSpeed(birdMorphFactor));
        else birdMorphFactor = Math.max(0.0, birdMorphFactor - getSpeed(birdMorphFactor));

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
        const isDesktopViewport = !isMobile && !isTablet;
        // Width-driven, so a narrow phone shrinks the sketch instead of cropping it.
        // Caps at 1.0, which is what every desktop width resolves to anyway.
        const scale = sketchFit;
        // mY lifts the sketch clear of the hero copy above and the about card below;
        // mX re-centres it, since the splines are drawn about x = -1.07.
        let mY = 0.0, mX = 0.0;
        if (isMobile) {
            mY = 4.8;
        } else if (isTablet) {
            mY = 4.95;
        }
        if (!isDesktopViewport) mX = 1.065 * scale - 1.0;

        // Pencil-bundle weight, per sketch. In the original artwork the bundle spanned
        // about 4.1% of the figure's height, and that ratio is the look. The redrawn
        // dog and bird are much taller than the sketches they replaced (10.2 and 9.6
        // units against 6.5), so their amplitudes have to grow to match; the two faces
        // were never resized and keep the original 0.135. Multiplied by scale so the
        // same weight holds on a phone as on a desktop.
        const strokeDog   = 0.21  * scale;
        const strokeBird  = 0.20  * scale;
        const strokeFaces = 0.135 * scale;

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
                
                // Unit-amplitude scatter. Multiplied per sketch below by its own stroke
                // weight, so each drawing keeps the pencil bundle at the same visual
                // heft regardless of how large the drawing itself is.
                const nX = Math.sin(r * 12.3 + c * 0.1);
                const nY = Math.cos(r * 8.7 - c * 0.1);
                const nZ = Math.sin(r * 5.1 + c * 0.05); // 3D depth volume

                // --- Fetch Precomputed Spline Coordinates (Fast Lookup) ---
                const splinePt1 = precomputedDog[c];
                const splinePt2 = precomputedBird[c];
                const splinePt3 = precomputedHuman[c];

                // --- STATE 1: Continuous Line Animal (Dog) ---
                const anim1X = (splinePt1.x * scale) + 1.0 + mX + nX * strokeDog;
                const anim1Y = (-splinePt1.z * scale) - 2.5 + mY + nY * strokeDog;
                const anim1Z = 0 + nZ * strokeDog * 2.0;

                // --- STATE 2: Continuous Line Animal (Bird) ---
                const anim2X = (splinePt2.x * scale) + 1.0 + mX + nX * strokeBird;
                const anim2Y = (-splinePt2.z * scale) - 2.5 + mY + nY * strokeBird;
                const anim2Z = 0 + nZ * strokeBird * 2.0;

                // --- STATE 3: Continuous Line Human (Optical Illusion) ---
                const anim3X = (splinePt3.x * scale) + 1.0 + mX + nX * strokeFaces;
                // Shifted Y up by an additional 2.0 units (10%) specifically for the Human sketch
                const anim3Y = (-splinePt3.z * scale) - 0.5 + mY + nY * strokeFaces;
                const anim3Z = 0 + nZ * strokeFaces * 2.0;

                // Convert global linear weights into a tighter, deliberate "Brush Stroke" effect
                let rawDog = Math.max(0, Math.min(1, (dogMorphFactor - t * 0.8) / 0.4));
                let rawBird = Math.max(0, Math.min(1, (birdMorphFactor - t * 0.8) / 0.4));
                let rawHuman = Math.max(0, Math.min(1, (humanMorphFactor - t * 0.8) / 0.4));

                // Apply Quintic "Smootherstep" easing to the vertices. 
                // This curve has zero acceleration at start/end, making the motion incredibly buttery and fluid.
                const smootherstep = (x) => x * x * x * (x * (x * 6 - 15) + 10);
                
                const localDogMorph = smootherstep(rawDog);
                const localBirdMorph = smootherstep(rawBird);
                const localHumanMorph = smootherstep(rawHuman);

                // Prevent coordinate addition glitches by normalizing overlapping weights
                let wDog = localDogMorph;
                let wBird = localBirdMorph;
                let wHuman = localHumanMorph;
                const totalAnimalWeight = wDog + wBird + wHuman;

                if (totalAnimalWeight > 1.0) {
                    wDog /= totalAnimalWeight;
                    wBird /= totalAnimalWeight;
                    wHuman /= totalAnimalWeight;
                }

                // Blend between all states based on normalized staggered weights
                const waveWeight = Math.max(0, 1.0 - (wDog + wBird + wHuman));
                
                fX = fX * waveWeight + anim1X * wDog + anim2X * wBird + anim3X * wHuman;
                fZ = fZ * waveWeight + anim1Z * wDog + anim2Z * wBird + anim3Z * wHuman;
                fY = silkY * waveWeight + anim1Y * wDog + anim2Y * wBird + anim3Y * wHuman;

                // Organic Idle Breathing for Animals
                const breathingY = Math.sin(window.accumTime * 2.0 + t * Math.PI) * 0.2 * (1.0 - waveWeight);
                
                // Expanding physical radial ring ripple when theme is toggled
                let themeRipple = 0;
                if (rippleTime < 4.0) {
                    const distToCenter = Math.sqrt(fX*fX + fZ*fZ);
                    const waveSpeed = 8.0;
                    const waveFrequency = 1.0;
                    const decay = Math.exp(-rippleTime * 1.5);
                    themeRipple = Math.sin(distToCenter * waveFrequency - rippleTime * waveSpeed) * decay * 0.6 * waveWeight;
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
        const animalWeight = Math.min(1.0, dogMorphFactor + birdMorphFactor + humanMorphFactor);
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
        
        // Dynamic fog boundaries based on state to ensure maximum animal contrast
        // As the sketch morphs in, we smoothly push the fog far away to restore 100% absolute, deep line contrast!
        const globalAnimalWeight = Math.min(1.0, Math.max(0.0, Math.max(dogMorphFactor, birdMorphFactor, humanMorphFactor)));
        const targetFogNear = (1.0 - globalAnimalWeight) * 16.0 + globalAnimalWeight * 100.0;
        const targetFogFar = (1.0 - globalAnimalWeight) * 32.0 + globalAnimalWeight * 200.0;
        
        scene.fog.near += (targetFogNear - scene.fog.near) * 0.1;
        scene.fog.far += (targetFogFar - scene.fog.far) * 0.1;

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
            if (e && e.target && (e.target.closest('a') || e.target.closest('button') || e.target.closest('#theme-toggle'))) return;
            currentState = (currentState + 1) % 4; // Toggle between 0 (Waves), 1 (Dog), 2 (Bird), 3 (Human)
            
            // Trigger cinematic camera sweep on click (eased outward)
            targetCameraSweep = 16.0; 
        };

        window.addEventListener('click', toggleMorph, { passive: true });
        window.addEventListener('mousedown', handleDown, { passive: true });
        window.addEventListener('mouseup', handleUp, { passive: true });
        window.addEventListener('touchstart', (e) => { handleMouseMove(e); handleDown(); }, { passive: true });
        window.addEventListener('touchend', handleUp, { passive: true });
        window.addEventListener('resize', () => { if (window.updateWebGLSize) window.updateWebGLSize(); });

        // Delegated theme toggle listener (survives page transitions)
        document.addEventListener('click', (e) => {
            const themeBtn = e.target.closest('#theme-toggle');
            if (themeBtn) {
                e.stopPropagation(); // Prevent morph toggle from triggering
                isDarkMode = !isDarkMode;
                themeBtn.classList.toggle('is-dark', isDarkMode);
                
                // Trigger a physical dynamic wave ripple across the fabric mesh
                rippleTime = 0.0;
                
                // Toggle a specific class on the body to style the header appropriately in the Dark Hero
                document.body.classList.toggle('hero-dark-mode', isDarkMode);
            }
        });

        globalListenersBound = true;
    }

    isInitialized = true;
};

window.pauseWebGL = () => {
    window.isWebGLRunning = false;
    if (glReqId) cancelAnimationFrame(glReqId);
    if (glObserver) glObserver.disconnect();
};

window.resumeWebGL = (container) => {
    if (container && renderer && renderer.domElement) {
        if (renderer.domElement.parentElement !== container) {
            if (renderer.domElement.parentElement) {
                renderer.domElement.parentElement.removeChild(renderer.domElement);
            }
            container.appendChild(renderer.domElement);
        }
        if (window.updateWebGLSize) window.updateWebGLSize();
        
        if (glObserver) {
            glObserver.disconnect();
            glObserver.observe(container);
        }
        
        isVisible = true;
        window.introProgress = 0.0;
        
        if (!window.isWebGLRunning) {
            window.isWebGLRunning = true;
            if (window.animateWebGL) window.animateWebGL();
        }
    }
};

window.initPage = (containerParent) => {
    const context = containerParent || document;
    const container = context.querySelector('#webgl-container');
    if (container) {
        window.introProgress = 0.0;
        if (isInitialized) {
            window.resumeWebGL(container);
        } else {
            initWebGL(container);
        }
    } else {
        if (window.pauseWebGL) window.pauseWebGL();
    }
};

window.initWebGL = initWebGL;

if (document.getElementById('webgl-container')) {
    initWebGL();
}
