var camera;
var scene;
var renderer;

var geometry;
var material;
var triangleMeshes = [];
var circleMeshes = [];
var boxMeshes = [];
var triangleFractal = [];

var BIN_COUNT = 512;
var beatThresh = 1;
var onBeat = false;
var beatTime = 0;
var beatHold = 1;
var beatcount = 0;
var change = 0;

var beatVals = [];
// var sum = 0;
var maxValue;
var minValue;

var audioContext = new AudioContext();
var SAMPLES = 1024;
var fft =  audioContext.createAnalyser();
fft.fftSize = SAMPLES;
var volAvg;
var pastDir;

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
  // console.log(freqByteData);
  // console.log(buffer);

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
    // draw triangle
    var triangleGeometry = new THREE.Geometry();

    var v1 = new THREE.Vector3(-30, 0, 0);
    var v2 = new THREE.Vector3(0, 60, 0);
    var v3 = new THREE.Vector3(30, 0, 0);

    triangleGeometry.vertices.push(v1);
    triangleGeometry.vertices.push(v2);
    triangleGeometry.vertices.push(v3);

    triangleGeometry.faces.push(new THREE.Face3(0, 1, 2));

    var triangleMaterial = new THREE.MeshBasicMaterial({
      color: 0xf35149,
      // blending: THREE.AdditiveBlending,
      opacity: 1,
      // transparent: true,
      wireframe: true,
      wireframeLinewidth: 3
    });
    var triangleMesh = new THREE.Mesh(triangleGeometry, triangleMaterial);

    // Set position of spheres on canvas
    // mesh.position.x = Math.random() * sceneWidth + leftMost;
    // mesh.position.y = Math.random() * sceneHeight + topMost;

    triangleMesh.rotation.z = Math.sin(Math.PI) ;

    triangleMeshes.push(triangleMesh);
    scene.add(triangleMesh);

    // draw circle
    var circleMaterial = new THREE.MeshBasicMaterial({
      color: 0x997825,
      wireframe: true,
      wireframeLinewidth: 3,
      opacity: 0.6
    })

    var radius = 35;
    var segments = 8;

    var circleGeometry = new THREE.CircleGeometry(radius, segments);
    var circleMesh = new THREE.Mesh(circleGeometry, circleMaterial);
    circleMesh.position.y = -150;
    circleMesh.position.x = -150;


    circleMeshes.push(circleMesh);
    scene.add(circleMesh);

    // draw circle2
    var boxMaterial = new THREE.MeshBasicMaterial({
      color: 0x15776E,
      wireframe: true,
      wireframeLinewidth: 3,
      opacity: 0.6
    })

    var boxGeometry = new THREE.BoxGeometry(30,30,30);
    var boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
    boxMesh.position.y = -150;
    boxMesh.position.x = 150;

    boxMeshes.push(boxMesh);
    scene.add(boxMesh);

    // tripinski(100,100);
    
  }

  // console.log(volAvg);

  // Ambient lighting
  var ambientLight = new THREE.AmbientLight(0x333333);
  scene.add(ambientLight);

  // Blue directional light
  // directionalLight = new THREE.DirectionalLight(0x000066);
  // directionalLight.position.set(100, 100, 1000).normalize();
  // scene.add(directionalLight);

  // Red directional light
  directionalLight2 = new THREE.DirectionalLight(0xaa0000);
  directionalLight2.position.set(1, 1, 800).normalize();
  scene.add(directionalLight2);

  // Orange directional light
  directionalLight3 = new THREE.DirectionalLight(0x995500);
  directionalLight3.position.set(-200, -1000, 100).normalize();
  scene.add(directionalLight3);

  // Request audio file
  req.open('GET', 'olafur.mp3', true);
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
var lineLength = 0;
var lineHeight = 0;
var currentMax = 0;
var previousMax = 0;
var x1 = 0, y1 = 0, x2 = 0, y2 = 0;

function animate() {
  // console.log(volAvg);
  fft.getByteFrequencyData(freqByteData);
  fft.getByteTimeDomainData(timeByteData);
  // console.log(freqByteData);

  fft.getByteFrequencyData(buffer);
  // console.log(buffer);
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

  beatVals.unshift(volAvg);

  // var start = new Date().getTime();
  // for (var i = 0; i < 1e7; i++) {
  // if (((new Date().getTime() - start) > 200) && (beatVals.length > 10)){
  //     break;
  //   }
  // }
  // console.log("waited");

  // var maxValue = 0;

  if ((change % 10 == 0) && (beatVals.length > 10)) {
    beatVals.length = 10;
    // console.log(beatVals);
    beatVals.pop();

    var sum = 0;

    for (var i = 0; i < beatVals.length; i++) {
      sum += beatVals[i];
    }

    var beatAvg = sum/beatVals.length;
    var start = new Date().getTime();

    if (beatAvg > beatThresh) {
      maxValue = beatVals[0];

      for(var i = 0; i < beatVals.length; i++) {
        if(beatVals[i] > maxValue) {
            maxValue = beatVals[i];
        }
      }
      currentMax = maxValue;

      minValue = beatVals[0];

      for(var i = 0; i < beatVals.length; i++) {
        if(beatVals[i] < minValue) {
            minValue = beatVals[i];
        }
      }

      // console.log("inside beat");
      beatThresh = beatAvg;
      

      

    } else {
      beatThresh *= 0.98; // gravity on threshold
    }
  }

  var material = new THREE.LineBasicMaterial({
      color: 0x000000,
      // blending: THREE.AdditiveBlending,
      opacity: 0.9,
      wireframe: true,
      wireframeLinewidth: 5
      // transparent: true,
  })

  // x1 = lineLength;
  // y2 = lineHeight;
  x2 = lineLength;
  y2 = lineHeight;

  var lineGeometry = new THREE.Geometry();
  lineGeometry.vertices.push(new THREE.Vector3(x1, y1, 0));
  // console.log(length);
  lineGeometry.vertices.push(new THREE.Vector3(x2, y2, 0));
  // lineGeometry.vertices.push(new THREE.Vector3(100, 0, 0));

  var line = new THREE.Line(lineGeometry, material);

  // Set position of lines on canvas
    // line.position.x = length;
    // line.position.y = Math.random() * sceneHeight + topMost;
  // line.rotation.z = lineHeight;

  scene.add(line); 
  // lineLength += 10; 
  

  var direction = Math.floor(Math.random()*5);

  switch (direction) {
    case 0:
      lineLength += volAvg*2;
      break;
    case 1:
      lineLength -= volAvg*2;
      break;
    case 2:
      lineHeight += volAvg*2;
      break;
    case 3:
      lineHeight -= volAvg*2;
      break;
    default:
      console.log("no direction");
  }

  // if(currentMax <= previousMax) {
  //   console.log("current smaller");
  //   lineLength -= Math.sin(volAvg);
  // } else if (currentMax > previousMax) {
  //   console.log("current bigger");
  //   lineHeight += volAvg;
  // } 


  previousMax = currentMax;
  x1 = x2;
  y1 = y2;
  

  for (var i = 0; i < circleMeshes.length; i++) {
      circleMeshes[i].scale.y = maxValue/20;
      circleMeshes[i].scale.x = maxValue/20;
      if(maxValue > 50) {
          circleMeshes[i].rotation.z +=  0.03;
      }

      boxMeshes[i].scale.y = minValue/20;
      boxMeshes[i].scale.x = minValue/20;
      if(minValue < 30) {
          boxMeshes[i].rotation.z -=  0.01;
      }
  }


  for (var i = 0; i < triangleMeshes.length; i++) {
      // Scale triangles based on audio input
      triangleMeshes[i].scale.y = volAvg/30;
      triangleMeshes[i].scale.x = volAvg/30;
  }

  camera.lookAt(scene.position);

  renderer.render(scene, camera);
}

init();