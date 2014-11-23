var camera;
var scene;
var renderer;

var geometry;
var material;
var meshes = [];
var SPHERE_WIDTH = 20;

var bars = 64;
var barWidth = 8;

var PARTICLES_COUNT = 15;
var particles;
var particlesMaterial;
var particlesHue = 0;

var audioContext = new AudioContext();
var SAMPLES = 128;
var fft =  audioContext.createAnalyser();
fft.fftSize = SAMPLES;

// var fft =  audioContext.createAnalyser();
// fft.fftSize = SAMPLES;

// Will contain amplitude data of our harmonics.
var buffer = new Uint8Array(SAMPLES);
var req = new XMLHttpRequest();

var x = 30, y = 0, z = 0;
var vertex;

// Clock to keep track of time
var clock = new THREE.Clock();

// Scene setup
function init() {
  freqByteData = new Uint8Array(fft.frequencyBinCount);
  timeByteData = new Uint8Array(fft.frequencyBinCount);


  var sceneWidth = window.innerWidth;
  var sceneHeight = window.innerHeight;
  var leftMost = -(sceneWidth / 2);
  var topMost = -(sceneHeight / 2);

  // Initialize renderer
  renderer = new THREE.WebGLRenderer({
    alpha: true
  });

  // Set size of renderer
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0xffffff, 1);
  renderer.autoClear = false;
  document.body.appendChild( renderer.domElement );

  // Allow for window resizing
  window.addEventListener( 'resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
 
    renderer.setSize( window.innerWidth, window.innerHeight );
  }, false );

  // Initialize camera
  camera = new THREE.PerspectiveCamera(
    40,
    window.innerWidth / window.innerHeight,
    1,
    100000
  );

  // The position of the camera in our scene.
  camera.position.z = 2000;
  camera.position.y = 0;

  // Initialize scene
  scene = new THREE.Scene();

  THREE.AdditiveBlending = 2;


  for (var i = 0; i < 10 ; i++) {
    var geometry = new THREE.Geometry();
    x = window.innerWidth/2;
    y = window.innerHeight/2;
    z = 1;
    vertex = new THREE.Vector3(x, y, z);

    geometry.vertices.push(vertex);

    var material = new THREE.MeshNormalMaterial({
      color: 0xFFFFFF,
      blending: THREE.AdditiveBlending,
      opacity: 0.5,
      transparent: true
    });
    var mesh = new THREE.Mesh(geometry, material);

    // Set position of spheres on canvas
    mesh.position.x = i;

    mesh.position.y = Math.random() * sceneHeight + topMost;

    // Add sphere meshes to array and scene
    meshes.push(mesh);
    scene.add(mesh);
  }

  // Ambient lighting
  var ambientLight = new THREE.AmbientLight(0x333333);
  scene.add(ambientLight);

  // Blue directional light
  directionalLight = new THREE.DirectionalLight(0x000066);
  directionalLight.position.set(100, 100, 1000).normalize();
  scene.add(directionalLight);

  // Red directional light
  directionalLight2 = new THREE.DirectionalLight(0xaa0000);
  directionalLight2.position.set(1, 1, 800).normalize();
  scene.add(directionalLight2);

  // Orange directional light
  directionalLight3 = new THREE.DirectionalLight(0x995500);
  directionalLight3.position.set(-200, -1000, 100).normalize();
  scene.add(directionalLight3);

  // Request audio file
  req.open('GET', 'xx.mp3', true);
  req.responseType = 'arraybuffer';

  req.onload = function () {
    // Tell the browser to decode the MP3 data, as PCM data.
    audioContext.decodeAudioData(req.response, function (data) {
      // Create an audio source, based on our PCM.
      var src = audioContext.createBufferSource();
      src.buffer = data;

      src.connect(fft);
      fft.connect(audioContext.destination);

      src.start();
      animate();
    });
  }
  // Tell request object to download audio file
  req.send();
}

var theta = 0;

function animate() {
  fft.getByteFrequencyData(freqByteData);
  fft.getByteTimeDomainData(timeByteData);

  fft.getByteFrequencyData(buffer);
  var time = clock.getDelta();

  requestAnimationFrame(animate);

  theta += time * 0.1;

  
  // for (var i = 0; i < meshes.length; i++) {
 
  //   // Assign 3D coordinates of particles
  //   x = i;
  //   y = freqByteData[i];
  //   z = 10;
 
  //   // Push coordinates to vector
  //   var vertex = new THREE.Vector3(x, y, z);
  //   meshes[i].vertices.push( vertex );
  // }


  for (var i = 0; i < meshes.length; i++) {
      // Scale spheres based on audio input
      // meshes[i].scale.x = freqByteData[i]/30;
      meshes[i].scale.y = freqByteData[i]/30;
      // meshes[i].scale.z = freqByteData[i]/30;

      // Move spheres around window based on audio input
      // meshes[i].position.z = freqByteData[i];
      // meshes[i].position.y = Math.sin(theta+i*5) * window.innerHeight/3;
      meshes[i].position.x += 1;

      console.log(meshes[i]);

      // Alter light intensity and colour
      directionalLight.intensity2 = meshes[i].position.z/200;   
      directionalLight.color.setRGB(0,0,(freqByteData[i]/70)%1);
  }
  camera.lookAt(scene.position);

  renderer.render(scene, camera);
}

init();