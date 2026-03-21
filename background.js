// WebGL Background with Three.js

const container = document.getElementById('webgl-container');
const reticle = document.getElementById('cursor-reticle');

// ─────────────────────────────────────────────────────────────

// Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 2.5;

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
// Use container size
const updateSize = () => {
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
};
updateSize();
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// Load Face Depth Texture
const textureLoader = new THREE.TextureLoader();
const displacementMap = textureLoader.load('face_depth.png');

// Raycaster
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Interaction State
let isFace = false;

// Custom Geometry Generation
function createMorphGeometry(particleCount) {
    const geometry = new THREE.BufferGeometry();
    const spherePositions = [];
    const facePositions = [];
    const uvs = [];
    const randoms = []; // For noise offsets

    // Grid dimensions for Face (must be square to match texture UVs roughly)
    const gridSize = Math.floor(Math.sqrt(particleCount));
    const count = gridSize * gridSize;

    for (let i = 0; i < count; i++) {
        // --- 1. Sphere Position (Standard) ---
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);

        // Increased Radius to fill more space (was 1.32)
        const r = 2.2;

        const sx = r * Math.sin(phi) * Math.cos(theta);
        const sy = r * Math.sin(phi) * Math.sin(theta);
        const sz = r * Math.cos(phi);
        spherePositions.push(sx, sy, sz);

        // --- 2. Face Position (Grid Plane) ---
        // We generate a flat plane. The Z-displacement happens in the vertex shader via texture.
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;

        const uPlane = col / (gridSize - 1);
        const vPlane = row / (gridSize - 1);

        // Increase plane size to fill hero section width (was 3.3)
        const tx = (uPlane - 0.5) * 6.0;
        const ty = (vPlane - 0.5) * 4.0;
        const tz = 0; // Flat base

        facePositions.push(tx, ty, tz);

        // UVs for texture sampling
        uvs.push(uPlane, vPlane);

        // Random attribute for varying animation per particle
        randoms.push(Math.random());
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(spherePositions, 3));
    geometry.setAttribute('aTargetPos', new THREE.Float32BufferAttribute(facePositions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setAttribute('aRandom', new THREE.Float32BufferAttribute(randoms, 1));

    return geometry;
}

// Increased Particle Count to 60,000 to maintain density over larger area
const particleCount = 60000;
const geometry = createMorphGeometry(particleCount);

const material = new THREE.ShaderMaterial({
    uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#0d1327') },
        uMouse: { value: new THREE.Vector3(9999, 9999, 9999) },
        uMorphFactor: { value: 0.0 }, // 0=Sphere, 1=Face
        uDisplacementTexture: { value: displacementMap }
    },
    vertexShader: `
        uniform float uTime;
        uniform vec3 uMouse;
        uniform float uMorphFactor;
        uniform sampler2D uDisplacementTexture;
        
        attribute vec3 aTargetPos;
        attribute float aRandom;
        
        varying vec2 vUv;
        varying float vDist;

        void main() {
            vUv = uv;
            vec3 spherePos = position;
            vec3 faceBasePos = aTargetPos;

            // --- Sphere State Animation ---
            float frequency = 4.0; 
            float amplitude = 0.1; 
            float waveSpeed = uTime * 1.2; 

            float wave = sin(spherePos.y * frequency + waveSpeed) * amplitude + 
                         cos(spherePos.x * frequency + waveSpeed * 0.8) * amplitude;
            
            float jitter = sin(spherePos.z * 10.0 + uTime * 3.0) * 0.02;

            vec3 animatedSpherePos = spherePos + normalize(spherePos) * (wave + jitter);


            // --- Face State Animation ---
            vec4 displacement = texture2D(uDisplacementTexture, uv);
            float faceHeight = displacement.r; 
            
            float depthScale = 1.5; 
            vec3 facePos = faceBasePos;
            // Move face back slightly so it's not too close to the camera (Camera Z=2.5)
            // Face Base is at Z=0? No, in createMorphGeometry tz=0.
            // So face starts at 0.
            facePos.z = -1.0 + faceHeight * depthScale;

            // Procedural Smile
            vec2 mouthCenter = vec2(0.5, 0.33); 
            float xDist = abs(uv.x - mouthCenter.x);
            float yDist = abs(uv.y - mouthCenter.y);
            
            if (yDist < 0.15 && xDist < 0.25) {
                float smile = pow(xDist * 4.0, 2.0) * 0.5; 
                float blend = smoothstep(0.15, 0.0, yDist) * smoothstep(0.25, 0.1, xDist);
                facePos.y += smile * blend;
                facePos.z += smile * blend * 0.3;
            }

            // Gentle Sway
            float swayAngle = sin(uTime * 0.5) * 0.08; 
            float cx = cos(swayAngle);
            float sx = sin(swayAngle);
            float tx = facePos.x * cx - facePos.z * sx;
            float tz = facePos.x * sx + facePos.z * cx;
            facePos.x = tx;
            facePos.z = tz;
            

            // --- Linear Morph Logic with Simple Noise ---
            float t = uMorphFactor;
            float easeT = t * t * (3.0 - 2.0 * t); // Smoothstep curve
            
            vec3 mixPos = mix(animatedSpherePos, facePos, easeT);
            
            // Simple Trig Noise for Fluidity (Peak at t=0.5)
            float noiseStrength = sin(t * 3.14159) * 0.2; // 0.2 displacement
            vec3 noiseOffset = vec3(
                sin(position.y * 10.0 + uTime * 2.0),
                cos(position.z * 10.0 + uTime * 2.0),
                sin(position.x * 10.0 + uTime * 2.0)
            ) * noiseStrength;
            
            vec3 finalPos = mixPos + noiseOffset;

            // --- Unified Interaction: Ocean Wave (Both Stages) ---
            // "onhover state particles should sway in a fluid and smood manner, simulating the waves of the osean"
            
            float dist = distance(finalPos, uMouse);
            vDist = dist;
            float interactionRadius = 2.2; // Scaled with larger forms
            
            // Interaction Influence with smooth falloff
            float mouseInfluence = smoothstep(interactionRadius, 0.0, dist);
            
            if (mouseInfluence > 0.001) {
                // Unified Interaction: Ocean Wave (Delicate Refinement - VISIBLE)
                // "Fluid, delicate, slow, natural" - simulating slow ocean movement
                
                // 1. Slow, "Breathing" Swell
                // Freq 3.0, Speed 0.8 (Slow). 
                // AMPLITUDE INCREASED (0.15 -> 0.4) to ensure visibility.
                float slowSwell = sin(dist * 3.0 - uTime * 0.8) * 0.4;
                
                // 2. Gentle Drift (Lateral)
                // Amplitude 0.1 for visible floating
                float drift = sin(finalPos.x * 1.5 + uTime * 0.5) * 0.1;
                
                // 3. Soft Falloff
                float delicateInfluence = pow(mouseInfluence, 2.0);
                
                // Combine forces
                vec3 waveOffset = vec3(
                    drift, 
                    drift * 0.5, 
                    slowSwell
                ) * delicateInfluence;
                
                finalPos += waveOffset;
            }

            vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
            
            // Adjust size. Sphere down 25% (7.2 -> 5.4), Face down 25% (9.6 -> 7.2)
            float baseSize = mix(5.4, 7.2, uMorphFactor); 
            gl_PointSize = baseSize * (1.0 / -mvPosition.z); 
            gl_Position = projectionMatrix * mvPosition;
        }
    `,
    fragmentShader: `
        uniform vec3 uColor;
        
        void main() {
            vec2 cxy = 2.0 * gl_PointCoord - 1.0;
            float r = dot(cxy, cxy);
            if (r > 1.0) discard;

            // Opacity 0.7 (70%)
            gl_FragColor = vec4(uColor, 0.7);
        }
    `,
    transparent: true,
    depthWrite: false
});

const particles = new THREE.Points(geometry, material);
scene.add(particles);

// Invisible Hit Sphere for reliable raycasting
// Radius matched to new sphere size (2.2)
const hitGeometry = new THREE.SphereGeometry(2.2, 32, 32);
const hitMaterial = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }); 
const hitSphere = new THREE.Mesh(hitGeometry, hitMaterial);
scene.add(hitSphere);

// Invisible Hit Plane for Face state 
const hitPlaneGeometry = new THREE.PlaneGeometry(12, 12);
const hitPlane = new THREE.Mesh(hitPlaneGeometry, hitMaterial);
hitPlane.position.z = -0.5;
scene.add(hitPlane);

// Animation Loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const time = clock.getElapsedTime();
    material.uniforms.uTime.value = time;

    // Morph Transition
    const targetMorph = isFace ? 1.0 : 0.0;
    const currentMorph = material.uniforms.uMorphFactor.value;

    // Slow down the morph slightly to appreciate the fluid effect
    material.uniforms.uMorphFactor.value += (targetMorph - currentMorph) * 0.03;

    // Sphere Rotation
    if (material.uniforms.uMorphFactor.value < 0.99 && !isFace) {
        const rotSpeed = 0.05;
        particles.rotation.y -= rotSpeed * 0.016;
        hitSphere.rotation.y -= rotSpeed * 0.016;
    } else {
        particles.rotation.y = THREE.MathUtils.lerp(particles.rotation.y, 0, 0.1);
        hitSphere.rotation.y = THREE.MathUtils.lerp(hitSphere.rotation.y, 0, 0.1);
    }

    // Raycasting
    raycaster.setFromCamera(mouse, camera);

    let intersects;
    if (isFace) {
        // Raycast against the Plane for the Face
        intersects = raycaster.intersectObject(hitPlane);
    } else {
        // Raycast against the Sphere
        intersects = raycaster.intersectObject(hitSphere);
    }

    if (intersects.length > 0) {
        const worldPoint = intersects[0].point;
        const localPoint = worldPoint.clone();

        // Convert to local space of the respective object
        if (isFace) {
            hitPlane.worldToLocal(localPoint);
        } else {
            hitSphere.worldToLocal(localPoint);
        }

        material.uniforms.uMouse.value.lerp(localPoint, 0.15);

        reticle.style.transform = `translate(-50%, -50%) scale(2.5)`;
        reticle.style.borderColor = 'rgba(13, 19, 39, 0.5)';
        reticle.style.borderWidth = '2px';
    } else {
        material.uniforms.uMouse.value.lerp(new THREE.Vector3(9999, 9999, 9999), 0.1);
        reticle.style.transform = `translate(-50%, -50%) scale(1)`;
        reticle.style.borderColor = 'rgba(13, 19, 39, 1)';
        reticle.style.borderWidth = '1px';
    }

    renderer.render(scene, camera);
}

animate();

// Resizing
window.addEventListener('resize', updateSize);

// Mouse Movement
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

document.addEventListener('mousemove', (e) => {
    if (isTouchDevice || !container) return;
    const rect = container.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    reticle.style.left = `${e.clientX}px`;
    reticle.style.top = `${e.clientY}px`;
});

// Click Interaction
const toggleMorph = () => {
    isFace = !isFace;
    console.log("Morph toggled. isFace:", isFace);
};

document.addEventListener('click', toggleMorph);
document.addEventListener('touchstart', toggleMorph);
