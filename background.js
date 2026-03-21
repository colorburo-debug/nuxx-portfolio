// WebGL Background with Three.js
let renderer, scene, camera, clock, material, particles, hitSphere, hitPlane, raycaster;
let isInitialized = false;
let mouse = new THREE.Vector2();

const initWebGL = () => {
    const container = document.getElementById('webgl-container');
    const reticle = document.getElementById('cursor-reticle');
    if (!container) return;

    // If already created, just re-append the renderer's DOM element
    if (isInitialized) {
        container.appendChild(renderer.domElement);
        if (window.updateWebGLSize) window.updateWebGLSize();
        return;
    }

    // ─── Scene Setup ──────────────────────────────────────────
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 2.5;

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

    // Make updateSize accessible
    window.updateWebGLSize = updateSize;

    // Load Face Depth Texture
    const textureLoader = new THREE.TextureLoader();
    const displacementMap = textureLoader.load('face_depth.png');

    // Raycaster
    raycaster = new THREE.Raycaster();

    // Interaction State
    let isFace = false;

    // Custom Geometry Generation
    function createMorphGeometry(particleCount) {
        const geometry = new THREE.BufferGeometry();
        const spherePositions = [];
        const facePositions = [];
        const uvs = [];
        const randoms = [];

        const gridSize = Math.floor(Math.sqrt(particleCount));
        const count = gridSize * gridSize;

        for (let i = 0; i < count; i++) {
            const u = Math.random();
            const v = Math.random();
            const theta = 2 * Math.PI * u;
            const phi = Math.acos(2 * v - 1);
            const r = 2.2;

            const sx = r * Math.sin(phi) * Math.cos(theta);
            const sy = r * Math.sin(phi) * Math.sin(theta);
            const sz = r * Math.cos(phi);
            spherePositions.push(sx, sy, sz);

            const row = Math.floor(i / gridSize);
            const col = i % gridSize;
            const uPlane = col / (gridSize - 1);
            const vPlane = row / (gridSize - 1);

            const tx = (uPlane - 0.5) * 6.0;
            const ty = (vPlane - 0.5) * 4.0;
            const tz = 0;

            facePositions.push(tx, ty, tz);
            uvs.push(uPlane, vPlane);
            randoms.push(Math.random());
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(spherePositions, 3));
        geometry.setAttribute('aTargetPos', new THREE.Float32BufferAttribute(facePositions, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setAttribute('aRandom', new THREE.Float32BufferAttribute(randoms, 1));

        return geometry;
    }

    const particleCount = 60000;
    const geometry = createMorphGeometry(particleCount);

    material = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color('#0d1327') },
            uMouse: { value: new THREE.Vector3(9999, 9999, 9999) },
            uMorphFactor: { value: 0.0 },
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

                float frequency = 4.0; 
                float amplitude = 0.1; 
                float waveSpeed = uTime * 1.2; 

                float wave = sin(spherePos.y * frequency + waveSpeed) * amplitude + 
                             cos(spherePos.x * frequency + waveSpeed * 0.8) * amplitude;
                
                float jitter = sin(spherePos.z * 10.0 + uTime * 3.0) * 0.02;
                vec3 animatedSpherePos = spherePos + normalize(spherePos) * (wave + jitter);

                vec4 displacement = texture2D(uDisplacementTexture, uv);
                float faceHeight = displacement.r; 
                
                float depthScale = 1.5; 
                vec3 facePos = faceBasePos;
                facePos.z = -1.0 + faceHeight * depthScale;

                vec2 mouthCenter = vec2(0.5, 0.33); 
                float xDist = abs(uv.x - mouthCenter.x);
                float yDist = abs(uv.y - mouthCenter.y);
                
                if (yDist < 0.15 && xDist < 0.25) {
                    float smile = pow(xDist * 4.0, 2.0) * 0.5; 
                    float blend = smoothstep(0.15, 0.0, yDist) * smoothstep(0.25, 0.1, xDist);
                    facePos.y += smile * blend;
                    facePos.z += smile * blend * 0.3;
                }

                float swayAngle = sin(uTime * 0.5) * 0.08; 
                float cx = cos(swayAngle);
                float sx = sin(swayAngle);
                float tx = facePos.x * cx - facePos.z * sx;
                float tz = facePos.x * sx + facePos.z * cx;
                facePos.x = tx;
                facePos.z = tz;
                
                float t = uMorphFactor;
                float easeT = t * t * (3.0 - 2.0 * t);
                
                vec3 mixPos = mix(animatedSpherePos, facePos, easeT);
                float noiseStrength = sin(t * 3.14159) * 0.2;
                vec3 noiseOffset = vec3(
                    sin(position.y * 10.0 + uTime * 2.0),
                    cos(position.z * 10.0 + uTime * 2.0),
                    sin(position.x * 10.0 + uTime * 2.0)
                ) * noiseStrength;
                
                vec3 finalPos = mixPos + noiseOffset;
                float dist = distance(finalPos, uMouse);
                vDist = dist;
                float interactionRadius = 2.2;
                float mouseInfluence = smoothstep(interactionRadius, 0.0, dist);
                
                if (mouseInfluence > 0.001) {
                    float slowSwell = sin(dist * 3.0 - uTime * 0.8) * 0.4;
                    float drift = sin(finalPos.x * 1.5 + uTime * 0.5) * 0.1;
                    float delicateInfluence = pow(mouseInfluence, 2.0);
                    vec3 waveOffset = vec3(drift, drift * 0.5, slowSwell) * delicateInfluence;
                    finalPos += waveOffset;
                }

                vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
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
                gl_FragColor = vec4(uColor, 0.7);
            }
        `,
        transparent: true,
        depthWrite: false
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);

    const hitGeometry = new THREE.SphereGeometry(2.2, 32, 32);
    const hitMaterial = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }); 
    hitSphere = new THREE.Mesh(hitGeometry, hitMaterial);
    scene.add(hitSphere);

    const hitPlaneGeometry = new THREE.PlaneGeometry(12, 12);
    hitPlane = new THREE.Mesh(hitPlaneGeometry, hitMaterial);
    hitPlane.position.z = -0.5;
    scene.add(hitPlane);

    clock = new THREE.Clock();

    const animate = () => {
        requestAnimationFrame(animate);
        const time = clock.getElapsedTime();
        material.uniforms.uTime.value = time;

        const targetMorph = isFace ? 1.0 : 0.0;
        const currentMorph = material.uniforms.uMorphFactor.value;
        material.uniforms.uMorphFactor.value += (targetMorph - currentMorph) * 0.03;

        if (material.uniforms.uMorphFactor.value < 0.99 && !isFace) {
            const rotSpeed = 0.05;
            particles.rotation.y -= rotSpeed * 0.016;
            hitSphere.rotation.y -= rotSpeed * 0.016;
        } else {
            particles.rotation.y = THREE.MathUtils.lerp(particles.rotation.y, 0, 0.1);
            hitSphere.rotation.y = THREE.MathUtils.lerp(hitSphere.rotation.y, 0, 0.1);
        }

        raycaster.setFromCamera(mouse, camera);
        let intersects = isFace ? raycaster.intersectObject(hitPlane) : raycaster.intersectObject(hitSphere);

        if (intersects.length > 0) {
            const worldPoint = intersects[0].point;
            const localPoint = worldPoint.clone();
            if (isFace) hitPlane.worldToLocal(localPoint);
            else hitSphere.worldToLocal(localPoint);
            material.uniforms.uMouse.value.lerp(localPoint, 0.15);
            if (reticle) reticle.style.transform = `translate(-50%, -50%) scale(3.5)`;
        } else {
            material.uniforms.uMouse.value.lerp(new THREE.Vector3(9999, 9999, 9999), 0.1);
            if (reticle) reticle.style.transform = `translate(-50%, -50%) scale(1)`;
        }

        renderer.render(scene, camera);
    };

    animate();

    // Click Interaction
    const toggleMorph = () => {
        isFace = !isFace;
    };

    document.addEventListener('click', toggleMorph);
    document.addEventListener('touchstart', toggleMorph);

    isInitialized = true;
};

// Expose globally
window.initWebGL = initWebGL;

// Handle Mouse Movement Globally
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
document.addEventListener('mousemove', (e) => {
    const container = document.getElementById('webgl-container');
    if (isTouchDevice || !container) return;
    const rect = container.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
});

window.addEventListener('resize', () => {
    if (window.updateWebGLSize) window.updateWebGLSize();
});

// Run if on homepage initially
if (document.getElementById('webgl-container')) {
    initWebGL();
}
