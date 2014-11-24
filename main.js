var camera;
var scene;
var renderer;

var geometry;
var material;
var meshes = [];

var BIN_COUNT = 512;
var beatThresh = 0;
var onBeat = false;

var audioContext = new AudioContext();
var SAMPLES = 1024;
var fft =  audioContext.createAnalyser();
fft.fftSize = SAMPLES;

// Will contain amplitude data of our harmonics.
var buffer = new Uint8Array(SAMPLES);
var req = new XMLHttpRequest();

var x = 30, y = 0, z = 0;
var vertex;

// Clock to keep track of time
var clock = new THREE.Clock();

var sceneWidth = window.innerWidth;
var sceneHeight = window.innerHeight;
var leftMost = -(sceneWidth / 2);
var topMost = -(sceneHeight / 2);

// Scene setup
function init() {
  freqByteData = new Uint8Array(fft.frequencyBinCount);
  timeByteData = new Uint8Array(fft.frequencyBinCount);

  // Initialize renderer
  renderer = new THREE.WebGLRenderer({
    alpha: true
  });

  // Set size of renderer
  renderer.setSize(sceneWidth, sceneHeight);
  renderer.setClearColor(0xffffff, 1);
  renderer.autoClear = false;
  document.body.appendChild( renderer.domElement );

  // Allow for window resizing
  window.addEventListener( 'resize', function () {
    camera.aspect = sceneWidth / sceneHeight;
    camera.updateProjectionMatrix();
 
    renderer.setSize( sceneWidth, sceneHeight );
  }, false );

  // Initialize camera
  camera = new THREE.PerspectiveCamera(
    40,
    sceneWidth / sceneHeight,
    1,
    100000
  );

  // The position of the camera in our scene.
  camera.position.z = 1000;
  camera.position.y = 0;

  // Initialize scene
  scene = new THREE.Scene();

  THREE.AdditiveBlending = 2;


  for (var i = 0; i < 6 ; i++) {
    var geometry = new THREE.Geometry();

    var v1 = new THREE.Vector3(-30, 0, 0);
    var v2 = new THREE.Vector3(0, 60, 0);
    var v3 = new THREE.Vector3(30, 0, 0);

    geometry.vertices.push(v1);
    geometry.vertices.push(v2);
    geometry.vertices.push(v3);

    geometry.faces.push(new THREE.Face3(0, 1, 2));

    var material = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      blending: THREE.AdditiveBlending,
      opacity: 1,
      transparent: true,
      wireframe: true
    });
    var mesh = new THREE.Mesh(geometry, material);

    // Set position of spheres on canvas
    // mesh.position.x = Math.random() * sceneWidth + leftMost;
    // mesh.position.y = Math.random() * sceneHeight + topMost;

    mesh.rotation.z = Math.sin(Math.PI) * i;

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
var scaleFactor = 0;

function animate() {
  fft.getByteFrequencyData(freqByteData);
  fft.getByteTimeDomainData(timeByteData);

  fft.getByteFrequencyData(buffer);
  var time = clock.getDelta();

  requestAnimationFrame(animate);

  theta += time * 0.1;

  // scaleFactor += time * 2;


  // Determine volume
  var volume = 0;
  for (var i = 0; i < BIN_COUNT; i++) {
    volume += freqByteData[i];
  }
  volAvg = volume / BIN_COUNT;
  // console.log(volAvg);


  for (var i = 0; i < meshes.length; i++) {
      // Scale triangles based on audio input
      meshes[i].scale.y = volAvg/30;
      meshes[i].scale.x = volAvg/30;

      meshes[i].position.z = 20*Math.sin(theta) + 0;


      // Detect a beat DOESN'T REALLY WORK PROPERLY
      // if (volAvg > beatThresh) {
      //   onBeat = true;
      //   beatThresh = volAvg * 1.1;
      // } else {
      //   onBeat = false;
      //   beatThresh *= 0.9;
      // }
      // console.log(beatThresh);

      // if the volume is above 40, there's a beat, so move the camera back 
      // and generate new triangles
      if (volAvg > 40) {
        var newTriangle = new THREE.Geometry();

        var v1 = new THREE.Vector3(-30, 0, 0);
        var v2 = new THREE.Vector3(0, 60, 0);
        var v3 = new THREE.Vector3(30, 0, 0);

        newTriangle.vertices.push(v1);
        newTriangle.vertices.push(v2);
        newTriangle.vertices.push(v3);

        newTriangle.faces.push(new THREE.Face3(0, 1, 2));

        var material = new THREE.MeshBasicMaterial({
          color: 0xFFFFFF,
          blending: THREE.AdditiveBlending,
          opacity: 0.5,
          transparent: true,
          wireframe: true
        });
        var newMesh = new THREE.Mesh(newTriangle, material);

        // Set position of triangles on canvas
        newMesh.position.x = Math.random() * sceneWidth + leftMost;
        newMesh.position.y = Math.random() * sceneHeight + topMost;
        // newMesh.scale.x += theta;
        // newMesh.scale.y += theta;

        camera.position.z += 4;

        sceneWidth += 10;
        sceneHeight += 10;
        leftMost = -(sceneWidth / 2);
        topMost = -(sceneHeight / 2);

        scene.add(newMesh);
      }
  }
  camera.lookAt(scene.position);

  renderer.render(scene, camera);
}

init();