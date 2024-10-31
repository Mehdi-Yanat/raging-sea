import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';
import fragmentShader from './shaders/fragment.glsl';
import vertexShader from './shaders/vertex.glsl';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

/**
 * Scene
 */
const scene = new THREE.Scene();

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.set(1, 1, 1);
scene.add(camera);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('canvas.webgl')
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Orbit Controls
 */
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // an animation effect
controls.dampingFactor = 0.25; // adjust the damping factor as needed
controls.minPolarAngle = Math.PI / 4; // limit vertical angle to 45 degrees (looking down)
controls.maxPolarAngle = Math.PI / 2; // limit vertical angle to 90 degrees (looking straight up)
controls.minDistance = 1; // minimum distance to the target
controls.maxDistance = 2; // maximum distance to the target

/**
 * Base
 */
// Debug
const gui = new GUI({ width: 340 });

let envMap;

// Load HDR as an environment map
const rgbeLoader = new RGBELoader();
rgbeLoader.load('/autumn_field_puresky_1k.hdr', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;

    envMap = texture;

    // Apply the HDR texture as the scene's environment map
    scene.environment = texture;
    scene.background = texture;  // Optional: to set it as the background as well

    // Material
    const waterMaterial = new THREE.ShaderMaterial({
        fragmentShader: fragmentShader,
        vertexShader: vertexShader,
        uniforms: {
            uTime: { value: 0 },
            uBigWavesElevation: { value: 0.2 },
            uBigWavesFrequency: { value: new THREE.Vector2(1.2, 1.5) },
            uBigWavesSpeed: { value: 1.0 },
            uDepthColor: { value: new THREE.Color(color.depthColor) },
            uSurfaceColor: { value: new THREE.Color(color.surfaceColor) },
            uSmallWavesElevation: { value: 0.15 },
            uSmallWavesFrequency: { value: 3 },
            uSmallWavesSpeed: { value: 0.2 },
            uSmallIterations: { value: 4 },
            envMap: { value: texture },
            fogColor: { value: new THREE.Color('red') }, // Light blue fog color
            fogNear: { value: 30.0 }, // Distance where fog starts
            fogFar: { value: 100.0 }  // Distance where fog reaches full opacity
        }
    });

    gui.add(waterMaterial.uniforms.uBigWavesElevation, 'value').min(0).max(1).step(0.001).name("uBigWavesElevation");
    gui.add(waterMaterial.uniforms.uBigWavesFrequency.value, 'x').min(0).max(10).step(0.001).name("uBigWavesFrequencyX");
    gui.add(waterMaterial.uniforms.uBigWavesFrequency.value, 'y').min(0).max(10).step(0.001).name("uBigWavesFrequencyY");
    gui.add(waterMaterial.uniforms.uBigWavesSpeed, 'value').min(0).max(10).step(0.001).name("uBigWavesSpeed");
    gui.addColor(color, 'depthColor').name("uDepthColor")
        .onChange(value => waterMaterial.uniforms.uDepthColor.value.set(color.depthColor));
    gui.addColor(color, 'surfaceColor').name("uSurfaceColor")
        .onChange(value => waterMaterial.uniforms.uSurfaceColor.value.set(color.surfaceColor));
    gui.add(waterMaterial.uniforms.uSmallWavesElevation, 'value').min(0).max(1).step(0.001).name('uSmallWavesElevation');
    gui.add(waterMaterial.uniforms.uSmallWavesFrequency, 'value').min(0).max(30).step(0.001).name('uSmallWavesFrequency');
    gui.add(waterMaterial.uniforms.uSmallWavesSpeed, 'value').min(0).max(4).step(0.001).name('uSmallWavesSpeed');
    gui.add(waterMaterial.uniforms.uSmallIterations, 'value').min(0).max(5).step(1).name('uSmallIterations');

    // Mesh
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI * 0.5;
    water.position.y = -0.1;
    scene.add(water);

    /**
     * Animate
     */
    const clock = new THREE.Clock();

    const tick = () => {
        const elapsedTime = clock.getElapsedTime();
        waterMaterial.uniforms.uTime.value = elapsedTime;

        // Update controls
        controls.update();

        // Render
        renderer.render(scene, camera);

        // Call tick again on the next frame
        window.requestAnimationFrame(tick);
    };

    tick();
});

// Water Geometry
const waterGeometry = new THREE.PlaneGeometry(20, 20, 512, 512);

const color = {
    depthColor: "#003366",   // Dark ocean blue for depth
    surfaceColor: "#4ca1af", // Soft aqua blue for the surface
};

/**
 * Audio
 */
// Set up audio listener
const listener = new THREE.AudioListener();
camera.add(listener);

// Create the audio object
const sound = new THREE.Audio(listener);

// Create an audio loader
const audioLoader = new THREE.AudioLoader();

// Load the audio file
audioLoader.load('/Sea Waves - Sound Effect.mp3', function (buffer) {
    sound.setBuffer(buffer);
    sound.setLoop(true); // Set the audio to loop
    sound.setVolume(0.5); // Set volume (0 to 1)
    sound.play(); // Play the audio

    // GUI for audio controls
    const audioFolder = gui.addFolder('Audio Controls');

    const audioControls = {
        play: function () {
            sound.play();
        },
        pause: function () {
            sound.pause();
        },
        stop: function () {
            sound.stop(); // Stop the audio
        },
    };

    // Add buttons for play, pause, and stop
    audioFolder.add(audioControls, 'play').name('Play');
    audioFolder.add(audioControls, 'pause').name('Pause');
    audioFolder.add(audioControls, 'stop').name('Stop');

    // Add volume control
    audioFolder.add(sound, 'volume', 0, 1).name('Volume').step(0.01);
    audioFolder.open();

}, undefined, function (err) {
    console.error('An error occurred while loading the audio:', err);
});
