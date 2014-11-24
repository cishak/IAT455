var camera;
var scene;
var renderer;

var geometry;
var material;
var meshes = [];

var BIN_COUNT = 512;
var beatThresh = 30;
var onBeat = false;
var beatTime = 0;
var beatHold = 1;
var beatcount = 0;
var change = 0;

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
      color: 0xf35149,
      // blending: THREE.AdditiveBlending,
      opacity: 1,
      // transparent: true,
      wireframe: true,
      wireframeLinewidth: 5
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

  change++;
  // scaleFactor += time * 2;
  // camera.position.z -= 1;
  // camera.rotation.y = 90 * Math.PI / 180;

  // Determine volume
  var volume = 0;
  for (var i = 0; i < BIN_COUNT; i++) {
    volume += freqByteData[i];
  }
  volAvg = volume / BIN_COUNT;
  // console.log(volAvg);


  if (change % 3 == 0) {
    // console.log(change%2);
    if (volAvg > 40) {
      beatcount++;
      console.log(beatcount);



      if (volAvg > 40) {
        var newTriangle = new THREE.Geometry();

        var v1 = new THREE.Vector3(-30, 0, 0);
        var v2 = new THREE.Vector3(0, 60, 0);
        var v3 = new THREE.Vector3(30, 0, 0);

        newTriangle.vertices.push(v1);
        newTriangle.vertices.push(v2);
        newTriangle.vertices.push(v3);

        newTriangle.faces.push(new THREE.Face3(0, 1, 2));

        var newMaterial = new THREE.MeshBasicMaterial({
          color: 0xf35149,
          // blending: THREE.AdditiveBlending,
          opacity: 0.6,
          // transparent: true,
          wireframe: true,
          wireframeLinewidth: 5
        });
        var newMesh = new THREE.Mesh(newTriangle, newMaterial);

        // Set position of triangles on canvas
        newMesh.position.x = Math.random() * sceneWidth + leftMost;
        newMesh.position.y = Math.random() * sceneHeight + topMost;
        // newMesh.scale.x += theta;
        // newMesh.scale.y += theta;

        camera.position.z += 4;

        sceneWidth += 5;
        sceneHeight += 5;
        leftMost = -(sceneWidth / 2);
        topMost = -(sceneHeight / 2);

        scene.add(newMesh);
      }
    }

    // // Detect a beat
    // if (volAvg > beatThresh) {
    //   beatThresh = volAvg * 1.5;
    //   beatHold = 0;

    //   // camera.position.z += 4;

    //   beatcount ++
    //   console.log(beatThresh);
      
    // } else {
    //   if (beatTime <= beatHold) {
    //     beatTime ++;
    //     // beatThresh --;
    //     console.log("huh");
    //   } else {
    //     // beatTime *= 0.9;
    //     beatThresh *= 0.5;
    //   }
    // }
  }


  for (var i = 0; i < meshes.length; i++) {
      // Scale triangles based on audio input
      meshes[i].scale.y = volAvg/30;
      meshes[i].scale.x = volAvg/30;

      meshes[i].position.z = 20*Math.sin(theta) + 0;


      




      
  }
  camera.lookAt(scene.position);

  renderer.render(scene, camera);
}

init();