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

// var PARTICLES_COUNT = 15;
// var particles = [];
// var particlesMaterial;
// var particlesHue = 0;
var particles

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



  // create the particle variables
  var particleCount = 1800;
  particles = new THREE.Geometry();
  var pMaterial = new THREE.ParticleBasicMaterial({
        color: 0xFFFFFF,
        size: 20
      });

  // now create the individual particles
  for (var p = 0; p < particleCount; p++) {

    // create a particle with random
    // position values, -250 -> 250
    var pX = Math.random() * 500 - 250,
        pY = Math.random() * 500 - 250,
        pZ = Math.random() * 500 - 250;


    // Push coordinates to vector
    var vertex = new THREE.Vector3(pX, pY, pX);
    particles.vertices.push( vertex );
        // particle.vertices.push(
        //   new THREE.Vector3(pX, pY, pZ)
        // );

    // add it to the geometry
    particles.vertices.push(particle);
  }

  // create the particle system
  var particleSystem = new THREE.ParticleSystem(
      particles,
      pMaterial);

  // add it to the scene
  scene.addChild(particleSystem);


}

var theta = 0;
var scaleFactor = 0;
var lineLength = 0;
var lineHeight = 0;
var currentMax = 0;
var previousMax = 0;
var x1 = 0, y1 = 0, x2, y2 = 0;
var petalMeshes = [];
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
      console.log(highestBeat);

      minValue = beatVals[0];

      for(var i = 0; i < beatVals.length; i++) {
        if(beatVals[i] < minValue) {
            minValue = beatVals[i];
        }
      }
      beatThresh = beatAvg;

      var divider = highestBeat/3;


      if(volAvg <= divider) {
        console.log("low");
        drawFlower(volAvg,0x997825);
      } else if(volAvg <= divider*2 && volAvg >= divider) {
        console.log("medium");
        drawFlower(volAvg,0x000000);
      } else if(volAvg >= divider*2 && volAvg <= BIN_COUNT) {
        console.log("high");
        drawFlower(volAvg,0x15776E);
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
        blending: THREE.AdditiveBlending,
        opacity: 0.04,
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

  for (var i = 0; i < petalMeshes.length; i++) {
      // Scale triangles based on audio input
      if(petalMeshes[i].scale.y <= 1.3) {
        petalMeshes[i].scale.y += 0.01;
        petalMeshes[i].scale.x += 0.01;
      }
      // petalMeshes[i].rotation.z = Math.sin(i);
  }

  for (var i = 0; i < lineSphereMeshes.length; i++) {
      lineSphereMeshes[i].position.z = volAvg*30;
      lineSphereMeshes[i].position.y = Math.sin(theta+i);
      lineSphereMeshes[i].position.x = Math.cos(theta+i);
  }


  // /***********************************
  //  * Particle code by Salehen Rahman *
  //  ***********************************/

  // // Update particle positions
  // for (var i = 0; i < particles.length; i++) {
  //   // particles.vertices[i].x = Math.sin(theta+i)* window.innerHeight;
  //   // particles.vertices[i].z = Math.cos(theta+i*5)* window.innerHeight;

  //   // particles.vertices[i].z = volAvg*10;

  //   if (particles.position.z < 1500) {
  //     particles.position.z -= 200;
  //   }
  // }
  // particles.verticesNeedUpdate = true;


  camera.lookAt(scene.position);
  renderer.render(scene, camera);
}


function drawFlower(volAvg, petalColor) {
  var material = new THREE.MeshBasicMaterial({
      color: petalColor,
      // blending: THREE.AdditiveBlending,
      opacity: 0.2,
      transparent: true
  })

  x2 = lineLength + (volAvg/10);
  y2 = lineHeight + (volAvg/10);

  var petalShape = new THREE.Shape();
  petalShape.moveTo(x1, 0);
  petalShape.lineTo(x1+volAvg, -20);
  petalShape.lineTo(x1+(volAvg*5), 0);
  petalShape.lineTo(x1+volAvg, 20);
  petalShape.lineTo(x1, 0);


  var petalGeometry = new THREE.ShapeGeometry(petalShape);
  var petalMesh = new THREE.Mesh(petalGeometry, material);
  petalMesh.rotation.z += rotationAngle;
  petalMeshes.push(petalMesh);
  scene.add(petalMesh); 
  lineLength += 5; 
  rotationAngle +=5;

  if(lineLength >= 100) {
    lineLength = 0;
    x1 = 50;
    x2 = lineLength+(volAvg/10);
  } 

  if(currentMax <= previousMax) {
    lineHeight -= Math.sin(theta)*volAvg;
  } else if (currentMax > previousMax) {
    lineHeight += Math.sin(theta)*volAvg;
  } 
}



function drawParticles(volAvg) {
  var particleMaterial = new THREE.ParticleCanvasMaterial({
    size: 40,
    opacity: 0.4,
    map: THREE.ImageUtils.loadTexture(
      'orbs.png'
    ),
    transparent: true,
    depthWrite: false,
  })

  x2 = lineLength + (volAvg/10);
  y2 = lineHeight + (volAvg/10);

  var particle = new THREE.Particle(particleMaterial);
  // petalShape.moveTo(x1, 0);
  // petalShape.lineTo(x1+volAvg, -20);
  // petalShape.lineTo(x1+(volAvg*5), 0);
  // petalShape.lineTo(x1+volAvg, 20);
  // petalShape.lineTo(x1, 0);


  var petalGeometry = new THREE.ShapeGeometry(petalShape);
  var petalMesh = new THREE.Mesh(petalGeometry, material);
  petalMesh.rotation.z += rotationAngle;
  petalMeshes.push(petalMesh);
  scene.add(petalMesh); 
  lineLength += 5; 
  rotationAngle +=5;

  if(lineLength >= 100) {
    lineLength = 0;
    x1 = 50;
    x2 = lineLength+(volAvg/10);
  } 

  if(currentMax <= previousMax) {
    lineHeight -= Math.sin(theta)*volAvg;
  } else if (currentMax > previousMax) {
    lineHeight += Math.sin(theta)*volAvg;
  } 
}



// function drawParticles(volAvg) {
//   for (var zpos = -1000; zpos < 1000; zpos += 20){
//     var particleMaterial = new THREE.ParticleCanvasMaterial({
//         color: 0xffffff,
//         // blending: THREE.AdditiveBlending,
//         opacity: 1,
//         transparent: true
//     })

//     var particle = new THREE.Particle(particleMaterial);
//     particle.position.x = Math.random() * 1000 - 500;
//     particle.position.y = Math.random() * 1000 - 500;

//     particle.position.z = zpos;

//     particle.scale.x = 10;
//     particle.scale.y = 10;

//     scene.add(particle);

//     // particles.push(particle);
//   }
// }

init();