//import './style.css'
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
//import vertexShader from './shaders/vertex.glsl'
//import fragmentShader from './shaders/fragment.glsl'
import { SphereGeometry } from "https://unpkg.com/three@0.157.0/build/three.module.js";
import { Reflector } from "three/addons/objects/Reflector.js";
import { Refractor } from "three/addons/objects/Refractor.js";

//console.log(Refractor)

const scene = new THREE.Scene();

/**
 * Shaders
 */

// Vertex Shader
const vertexShader = `
uniform mat4 textureMatrix;
		varying vec4 vUv;

		#include <common>
		#include <logdepthbuf_pars_vertex>

		void main() {

			vUv = textureMatrix * vec4( position, 1.0 );

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

			#include <logdepthbuf_vertex>

		}
`;

// Fragment Shader
const fragmentShader = `
  

   uniform vec3 color;
   uniform sampler2D tDiffuse;
   varying vec4 vUv;
   uniform sampler2D tDudv;
   uniform float time;
   uniform float waveStrength;
   uniform float waveSpeed;

   #include <logdepthbuf_pars_fragment>

   void main() {

       #include <logdepthbuf_fragment>

       float waveStrength = 0.09;
       float waveSpeed = 0.02;
  
        vec2 distortedUv = texture2D( tDudv, vec2( vUv.x + time * waveSpeed, vUv.y ) ).rg * waveStrength;
        distortedUv = vUv.xy + vec2( distortedUv.x, distortedUv.y + time * waveSpeed );
        vec2 distortion = ( texture2D( tDudv, distortedUv ).rg * 2.0 - 1.0 ) * waveStrength;
  
        // new uv coords
  
        vec4 uv = vec4( vUv );
        uv.xy += distortion;

       vec4 base = texture2DProj( tDiffuse, uv );
       gl_FragColor = vec4( mix( base.rgb, color, 0.9 ), 1.0 );

       #include <tonemapping_fragment>
       #include <colorspace_fragment>

   }
`;

// Vertex Shader
const vertexShaderGrad = `
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
// Fragment Shader
const fragmentShaderGrad = `
uniform vec2 u_resolution;
void main() {
  vec2 uv = gl_FragCoord.xy / vec2(${window.innerWidth}, ${window.innerHeight});
  vec3 col = 0.42 + 1.19 * cos(uv.y + vec3(0.5, 0.6, 0.552));
  gl_FragColor = vec4(col, 1.0);
}

`;

const camera = new THREE.PerspectiveCamera(
  162,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

//Sunset gradient Lights
const directionalLight = new THREE.DirectionalLight(0xffeec66, 40);
scene.add(directionalLight);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

//const controls = new OrbitControls(camera, renderer.domElement);

camera.position.set(0, 0, 5.9);

//controls.update();

/**
 * Lights
 */

// Equals
const light = new THREE.AmbientLight(0xffffff); // soft white light
light.intensity = 40;
scene.add(light);

/**
 * Sky for reflection
 */

const planeGeometrySky = new THREE.PlaneGeometry(600, 600);
const planeMaterialSky = new THREE.ShaderMaterial({
  vertexShader: vertexShaderGrad,
  fragmentShader: fragmentShaderGrad,
});
const planeSky = new THREE.Mesh(planeGeometrySky, planeMaterialSky);

//planeSky.rotation.x = -Math.PI * 0.5;
planeSky.position.y = 10;
planeSky.rotation.y = 0;
scene.add(planeSky);

const coverSphereGeometry = new THREE.SphereGeometry(1.7, 14, 9);
const coverSphereMaterial = new THREE.MeshStandardMaterial({ color: 0x663832 });
const coverSphere = new THREE.Mesh(coverSphereGeometry, coverSphereMaterial);
coverSphere.position.y = -1;
coverSphere.position.z = -1;
coverSphere.position.x = 0.95;
scene.add(coverSphere);

const upSphereGeometry = new THREE.TorusGeometry(10.9, 8, 4);
const upSphereMaterial = new THREE.MeshStandardMaterial({ color: 0xffedaba }); //yellow 0xffedaba
const upSphere = new THREE.Mesh(upSphereGeometry, upSphereMaterial);
upSphere.position.y = -1.8;
upSphere.position.z = -2.3;
upSphere.position.x = 0;
upSphere.rotation.x = 20;
scene.add(upSphere);

const sphereGeometry = new THREE.TorusGeometry(10.9, 8, 4);
const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0xffaaaa }); //pink 0xffaaaa
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.position.y = -1.8;
sphere.position.z = -2.1;
sphere.position.x = 0;
sphere.rotation.x = 20;
scene.add(sphere);

/**
 * Texture
 */

const mirrorShader = Reflector.ReflectorShader;
mirrorShader.vertexShader = vertexShader;
mirrorShader.fragmentShader = fragmentShader;

const dudvMap = new THREE.TextureLoader().load(
  "src/waterdudv.jpg",
  function () {
    animate();
  }
);

mirrorShader.uniforms.tDudv = { value: dudvMap };
mirrorShader.uniforms.time = { value: 0 };

console.log(mirrorShader.uniforms.tDudv.value);
console.log(mirrorShader.uniforms.time.value);

dudvMap.wrapS = dudvMap.wrapT = THREE.RepeatWrapping;

let geometry, groundMirror, material, mirrorOptions;

const planeGeometry2 = new THREE.PlaneGeometry(2500, 2500);
mirrorOptions = {
  shader: mirrorShader,
  clipBias: 0.003,
  textureWidth: window.innerWidth,
  textureHeight: window.innerHeight,
  color: 0x495972,
  //textureWidth: window.innerWidth * window.devicePixelRatio,
  //textureHeight: window.innerHeight * window.devicePixelRatio,
};

groundMirror = new Reflector(planeGeometry2, mirrorOptions);
groundMirror.position.y = -2;
groundMirror.rotation.x = -Math.PI * 0.5;
scene.add(groundMirror);

//console.log(groundMirror.material.uniforms.time.value);

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  coverSphere.rotation.x += 0.01;
  coverSphere.rotation.y += 0.01;

  mirrorShader.uniforms.time.value += 0.503;
  groundMirror.material.uniforms.time.value += 0.0503;
}
animate();
