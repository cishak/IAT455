var camera;
var scene;
var renderer;

var triangleMeshes = [];
var lineSphereMeshes = [];

var colours = [];

var BIN_COUNT = 512;
var beatThresh = 1;
var change = 0;

var beatVals = [];
var maxValue;
var minValue;

var PARTICLES_COUNT = 15;
var particles;
var particlesMaterial;
var particlesHue = 0;

var audioContext = new AudioContext();
var SAMPLES = 1024;
var fft =  audioContext.createAnalyser();
fft.fftSize = SAMPLES;
var volAvg;
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

  // colours
  colours[0] = '0xFE4365';
  colours[1] = '0xFC9D9A';
  colours[2] = '0xF9CDAD';
  colours[3] = '0xC8C8A9';
  colours[4] = '0x83AF9B';

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
  camera.position.z = 1500;

  // Initialize scene
  scene = new THREE.Scene();

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



  // Draw center triangle
  var triangleGeometry = new THREE.Geometry();

  var v1 = new THREE.Vector3(-30, -30, 1000);
  var v2 = new THREE.Vector3(0, 30, 1000);
  var v3 = new THREE.Vector3(30, -30, 1000);

  triangleGeometry.vertices.push(v1);
  triangleGeometry.vertices.push(v2);
  triangleGeometry.vertices.push(v3);

  triangleGeometry.faces.push(new THREE.Face3(0, 1, 2));

  var triangleMaterial = new THREE.MeshBasicMaterial({
    color: 0xf35149,
    // blending: THREE.AdditiveBlending,
    opacity: 1,
    wireframe: true,
    wireframeLinewidth: 3
  });

  var triangleMesh = new THREE.Mesh(triangleGeometry, triangleMaterial);
  triangleMeshes.push(triangleMesh);
  scene.add(triangleMesh);



  /***********************************
   * Particle code by Salehen Rahman *
   ***********************************/

  particles = new THREE.Geometry();

  // Create new particle material
  particlesMaterial = new THREE.PointCloudMaterial( {
    size: 40,
    opacity: 0.4,
    map: THREE.ImageUtils.loadTexture(
      'orbs.png'
    ),
    transparent: true,
    depthWrite: false,
  } );
 
  // Add the particles to geometry
  for (var i = 0; i < PARTICLES_COUNT; i++) {
 
    // Assign 3D coordinates of particles
    var x = (Math.random()%50) * sceneWidth*2 + leftMost*2;
    var y = (Math.random()%50) * sceneHeight*2 + topMost*2;
    var z = 10;
 
    // Push coordinates to vector
    var vertex = new THREE.Vector3(x, y, z);
    particles.vertices.push( vertex );
  }
 
  // Initialize our mesh from our geometry and material.
  var pointCloud = new THREE.PointCloud( particles, particlesMaterial );
  scene.add( pointCloud );
}

var theta = 0;
var scaleFactor = 0;
var lineLength = 0;
var lineHeight = 0;
var currentMax = 0;
var previousMax = 0;
var x1 = 0, y1 = 0, x2, y2 = 0;
var petalMeshesLow = [];
var petalMeshesHigh = [];
var petalMeshesMedium = [];
var rotationAngle = 5;
var highestBeat = 0;


function animate() {
  requestAnimationFrame(animate);

  // Grabbing audio data
  fft.getByteFrequencyData(freqByteData);

  var time = clock.getDelta();
  theta += time * 0.1;
  change++;

  // Determine volume
  var volume = 0;
  for (var i = 0; i < BIN_COUNT; i++) {
    volume += freqByteData[i];
  }
  volAvg = volume / BIN_COUNT;

  beatVals.unshift(volAvg);


  if ((change % 9 == 0) && (beatVals.length > 9)) {
    beatVals.length = 9;
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

      // track highest beat
      if(highestBeat < maxValue) {
        highestBeat = maxValue;
      }
      // console.log(highestBeat);

      minValue = beatVals[0];

      for(var i = 0; i < beatVals.length; i++) {
        if(beatVals[i] < minValue) {
            minValue = beatVals[i];
        }
      }
      beatThresh = beatAvg;

      var divider = highestBeat/3;


      // Modify particle colours
      particlesHue = (particlesHue + time/10)%1;
      // particlesMaterial.color.setHSL( (particlesHue), 1, 0.7 );



      if(volAvg <= divider) {
        // console.log("low");
        drawFlower(volAvg, getLowHue(), petalMeshesLow);
      } else if(volAvg <= divider*2 && volAvg >= divider) {
        // console.log("medium");
        drawFlower(volAvg, getMedHue(), petalMeshesMedium);
      } else if(volAvg >= divider*2 && volAvg <= BIN_COUNT) {
        // console.log("high");
        drawFlower(volAvg, getHighHue(), petalMeshesHigh);
      }

      // Lines around border
      var lineSphereGeometry = new THREE.Geometry();

      var vector = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 -1, Math.random() * 2 - 1);
      vector.normalize();
      vector.multiplyScalar(450);

      lineSphereGeometry.vertices.push(vector);

      var vector2 = vector.clone();
      vector2.multiplyScalar(Math.random() * volAvg * 0.3 + 1);

      lineSphereGeometry.vertices.push(vector2);

      var lineMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        opacity: 0.08,
        transparent: true
      });
      var lineSphere = new THREE.Line(lineSphereGeometry, lineMaterial);
      lineSphereMeshes.push(lineSphere);
      scene.add(lineSphere);
    
    } else {
      beatThresh *= 0.95; // gravity on threshold
    }
  }

  previousMax = currentMax;
  x1 = x2;
  y1 = y2;
  

  for (var i = 0; i < triangleMeshes.length; i++) {
      // Scale triangles based on audio input
      triangleMeshes[i].scale.y = volAvg/30;
      triangleMeshes[i].scale.x = volAvg/30;
  }

  for (var i = 0; i < petalMeshesLow.length; i++) {
      // Scale triangles based on audio input
      if(petalMeshesLow[i].scale.y <= 2) {
        petalMeshesLow[i].scale.y += 0.01;
        petalMeshesLow[i].scale.x += 0.01;
      }
     
      petalMeshesLow[i].position.z = 500;

      if(petalMeshesLow[i].scale.y <= 2.2 && petalMeshesLow[i].scale.y > 2) {
        petalMeshesLow[i].scale.y += 0.001;
        petalMeshesLow[i].scale.x += 0.001;
      }
  }

  for (var i = 0; i < petalMeshesMedium.length; i++) {
      if(petalMeshesMedium[i].scale.y <= 2) {
          petalMeshesMedium[i].scale.y += 0.01;
          petalMeshesMedium[i].scale.x += 0.01;
      }

      petalMeshesMedium[i].position.z = 300;

      if(petalMeshesMedium[i].scale.y <= 2.2 && petalMeshesMedium[i].scale.y > 2) {
        petalMeshesMedium[i].scale.y += 0.001;
        petalMeshesMedium[i].scale.x += 0.001;
      }
  }

  for (var i = 0; i < petalMeshesHigh.length; i++) {

      if(petalMeshesHigh[i].scale.y <= 2) {
        petalMeshesHigh[i].scale.y += 0.01;
        petalMeshesHigh[i].scale.x += 0.01;
      }

      petalMeshesHigh[i].position.z = 100;

      if(petalMeshesHigh[i].scale.y <= 2.2 && petalMeshesHigh[i].scale.y > 2) {
        petalMeshesHigh[i].scale.y += 0.001;
        petalMeshesHigh[i].scale.x += 0.001;
      }
  }

  for (var i = 0; i < lineSphereMeshes.length; i++) {
      lineSphereMeshes[i].position.z = volAvg*30;
      lineSphereMeshes[i].position.y = Math.sin(theta+i);
      lineSphereMeshes[i].position.x = Math.cos(theta+i);
  }


  /***********************************
   * Particle code by Salehen Rahman *
   ***********************************/

  // Update particle positions
  for (var i = 0; i < particles.vertices.length; i++) {
    particles.vertices[i].x = Math.sin(theta+i)* window.innerHeight;
    particles.vertices[i].z = Math.cos(theta+i*5)* window.innerHeight;

    // particles.vertices[i].z = volAvg*10;
  }
  particles.verticesNeedUpdate = true;

  camera.lookAt(scene.position);
  renderer.render(scene, camera);
}


function drawFlower(volAvg, color, array) {
  var material = new THREE.MeshBasicMaterial({
      opacity: 0.2,
      transparent: true
  })
  material.color.setHSL(color, ((Math.random()*30)+80) / 100, ((Math.random()*10)+50) / 100);

  x2 = lineLength + (volAvg/10);
  y2 = lineHeight + (volAvg/10);

  var petalShape = new THREE.Shape();
  petalShape.moveTo(x1, 0);
  petalShape.lineTo((x1+volAvg)/2, -10);
  petalShape.lineTo((x1+(volAvg*5))/2, 0);
  petalShape.lineTo((x1+volAvg)/2, 10);
  petalShape.lineTo(x1, 0);

  var petalGeometry = new THREE.ShapeGeometry(petalShape);
  var petalMesh = new THREE.Mesh(petalGeometry, material);
  petalMesh.rotation.z += rotationAngle;
  array.push(petalMesh);
  scene.add(petalMesh); 
  lineLength += 5; 
  rotationAngle +=5;

  if(lineLength >= 100) {
    lineLength = 0;
    x1 = 30;
    x2 = lineLength+(volAvg/10);
  } 

  if(currentMax <= previousMax) {
    lineHeight -= Math.sin(theta)*volAvg;
  } else if (currentMax > previousMax) {
    lineHeight += Math.sin(theta)*volAvg;
  } 
}


function getHighHue() {
  var h = ((Math.random()*20)) / 255; // RED
  return h;
}

function getMedHue() {
  var h = ((Math.random()*30)+120) / 255; // BLUE
  return h;
}

function getLowHue() {
  var h = ((Math.random()*30)+30) / 255; // YELLOW
  return h;
}

init();