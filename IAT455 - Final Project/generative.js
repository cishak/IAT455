var camera;
var scene;
var renderer;

var lineSphereMeshes = [];

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

var INIT_RADIUS = 350;
var loopGeom;
var line = new THREE.Line();

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


/***********************************
 * Initialize scene
 ***********************************/
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


  /***********************************
   * Draw central ring
   ***********************************/
  var loopShape = new THREE.Shape();
  loopShape.absarc( 0, 0, INIT_RADIUS, 0, Math.PI*4, true );
  loopGeom = loopShape.createPointsGeometry(BIN_COUNT/2);

  scene = new THREE.Scene();

  var material = new THREE.LineBasicMaterial( { 
    color: 0xffffff,
    opacity : 0.1,
    depthTest : false,
    transparent: true
  });

  line.geometry = loopGeom;
  line.material = material;

  scene.add(line);


  /***********************************
   * Wandering particles
   ***********************************/
  particles2 = new THREE.Geometry();

  // Create new particle material
  particlesMaterial2 = new THREE.PointCloudMaterial( {
    size: 40,
    opacity: 0.1,
    map: THREE.ImageUtils.loadTexture(
      'orbs.png'
    ),
    transparent: true,
    depthWrite: false,
  } );
 
  // Add the particles to geometry
  for (var i = 0; i < PARTICLES_COUNT; i++) {
 
    // Assign 3D coordinates of particles
    var x2 = (Math.random()%50) * sceneWidth*2 + leftMost*2;
    var y2 = (Math.random()%50) * sceneHeight*2 + topMost*2;
    var z2 = 10;
 
    // Push coordinates to vector
    var vertex2 = new THREE.Vector3(x2, y2, z2);
    particles2.vertices.push( vertex2 );
  }
 
  // Initialize our mesh from our geometry and material.
  var pointCloud = new THREE.PointCloud( particles2, particlesMaterial2 );
  scene.add( pointCloud );


  /***********************************
   * Particle cluster
   ***********************************/
  particles = new THREE.Geometry();

  // Create new particle material
  particlesMaterial = new THREE.PointCloudMaterial( {
    size: 40,
    opacity: 0.4,
    map: THREE.ImageUtils.loadTexture(
      'orbs.png'
    ),
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  } );
 
  // Add the particles to geometry
  for (var i = 0; i < PARTICLES_COUNT; i++) {
    var x = 0;
    var y = 0;
    var z = 600;
 
    // Push coordinates to vector
    var vertex = new THREE.Vector3(x, y, z);
    particles.vertices.push( vertex );
  }
 
  // Initialize our mesh from our geometry and material.
  particleSystem = new THREE.ParticleSystem( particles, particlesMaterial );
  scene.add( particleSystem );
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


/***********************************
 * Animate scene
 ***********************************/
function animate() {
  requestAnimationFrame(animate);

  // Grabbing audio data
  fft.getByteFrequencyData(freqByteData);
  fft.getByteTimeDomainData(timeByteData);

  var time = clock.getDelta();
  theta += time * 0.1;
  change++;


  /***********************************
   * Create array of volume values
   ***********************************/
  var volume = 0;
  for (var i = 0; i < BIN_COUNT; i++) {
    volume += freqByteData[i];
  }
  volAvg = volume / BIN_COUNT;

  // Add volume to an array
  beatVals.unshift(volAvg);


  /***********************************
   * Check average volume every 9 frames
   ***********************************/
  if ((change % 9 == 0) && (beatVals.length > 9)) {
    beatVals.length = 9;
    beatVals.pop();

    // Find average volume
    var sum = 0;
  
    for (var i = 0; i < beatVals.length; i++) {
      sum += beatVals[i];
    }

    var beatAvg = sum/beatVals.length;
    var start = new Date().getTime();


    /***********************************
    * Dynamic beat detection
    ***********************************/
    if (beatAvg > beatThresh) {
      
      // Track highest beat
      maxValue = beatVals[0];

      for(var i = 0; i < beatVals.length; i++) {
        if(beatVals[i] > maxValue) {
            maxValue = beatVals[i];
        }
      }
      currentMax = maxValue;

      if(highestBeat < maxValue) {
        highestBeat = maxValue;
      }

      // Track lowest beat
      minValue = beatVals[0];

      for(var i = 0; i < beatVals.length; i++) {
        if(beatVals[i] < minValue) {
            minValue = beatVals[i];
        }
      }

      // Beat threshold becomes beat average
      beatThresh = beatAvg;


      /***********************************
      * Determine High/Med/Low beat ranges
      ***********************************/
      var divider = highestBeat/3;

      if(volAvg <= divider) { // low volume
        drawFlower(volAvg, getLowHue(), petalMeshesLow);
      } else if(volAvg <= divider*2 && volAvg >= divider) { // medium volume
        drawFlower(volAvg, getMedHue(), petalMeshesMedium);
      } else if(volAvg >= divider*2 && volAvg <= BIN_COUNT) { // high volume
        drawFlower(volAvg, getHighHue(), petalMeshesHigh);
      }


      /***********************************
      * Animate lines around border to the beat
      ***********************************/
      var lineSphereGeometry = new THREE.Geometry();

      var vector = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 -1, Math.random() * 2 - 1);
      vector.normalize();
      vector.multiplyScalar(450);

      lineSphereGeometry.vertices.push(vector);

      var vector2 = vector.clone();
      vector2.multiplyScalar(Math.random() * volAvg * 0.3 + 1);

      lineSphereGeometry.vertices.push(vector2);

      // Create new line material
      var lineMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        opacity: 0.08,
        transparent: true
      });
      var lineSphere = new THREE.Line(lineSphereGeometry, lineMaterial);
      lineSphereMeshes.push(lineSphere);
      scene.add(lineSphere);
    
    } else {
      // Decrease threshold by gravity constant
      beatThresh *= 0.95;
    }


    /***********************************
    * Update center ring
    ***********************************/
    for(var j = 0; j < BIN_COUNT; j++) {
      loopGeom.vertices[j].z = timeByteData[j]*2;//stretch by 2
    }
    // Link up last segment of ring
    loopGeom.vertices[BIN_COUNT].z = loopGeom.vertices[0].z;
    loopGeom.verticesNeedUpdate = true;


    /***********************************
    * Modify particle colours
    ***********************************/
    particlesHue = (particlesHue + time/10)%1;
    particlesMaterial.color.setHSL( (particlesHue), 1, 0.7 );
  }

  // Scale lines around the border based on the beat
  line.scale.y = volAvg/50;
  line.scale.x = volAvg/50;

  previousMax = currentMax;
  x1 = x2;
  y1 = y2;


  /***************************************************
  * Scale, translate, and rotate low beat petals
  ***************************************************/
  for (var i = 0; i < petalMeshesLow.length; i++) {
      if(petalMeshesLow[i].scale.y <= 2) {
        petalMeshesLow[i].scale.y += 0.01;
        petalMeshesLow[i].scale.x += 0.01;
      }
     
      petalMeshesLow[i].position.z = 500;

      if(petalMeshesLow[i].scale.y <= 2.2 && petalMeshesLow[i].scale.y > 2) {
        petalMeshesLow[i].scale.y += 0.001;
        petalMeshesLow[i].scale.x += 0.001;
      }

      // Rotate based on the beat
      petalMeshesLow[i].rotation.z += 0.001*volAvg/10;
  }


  /***************************************************
  * Scale, translate, and rotate medium beat petals
  ***************************************************/
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

      // Rotate based on the beat
      petalMeshesMedium[i].rotation.z += 0.0008*volAvg/10;
  }

  /***************************************************
  * Scale, translate, and rotate high beat petals
  ***************************************************/
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

      // Rotate based on the beat
      petalMeshesHigh[i].rotation.z += 0.0005*volAvg/10;
  }


  /***************************************************
  * Translate lines around screen
  ***************************************************/
  for (var i = 0; i < lineSphereMeshes.length; i++) {
      lineSphereMeshes[i].position.z = volAvg*30;
      lineSphereMeshes[i].position.y = Math.sin(theta+i);
      lineSphereMeshes[i].position.x = Math.cos(theta+i);
  }


  /***************************************************
  * Update wandering particles
  ***************************************************/
  for (var i = 0; i < particles2.vertices.length; i++) {
    particles2.vertices[i].x = Math.sin(theta+i)* window.innerHeight;
    particles2.vertices[i].z = Math.cos(theta+i*5)* window.innerHeight;
  }
  particles2.verticesNeedUpdate = true;


  /***************************************************
  * Update central particle cluster
  ***************************************************/
  for (var i = 0; i < particles.vertices.length; i++) {

    if (particles.vertices[i].x > 50 || particles.vertices[i].x < -50) {
      particles.vertices[i].x = 0;
    } else {
      particles.vertices[i].x += Math.random()*Math.sin(theta+i)*volAvg/30;
    }

    if (particles.vertices[i].y > 50 || particles.vertices[i].y < -50) {
      particles.vertices[i].y = 0;
    } else {
      particles.vertices[i].y -= Math.random()*Math.cos(theta+i*5)*volAvg/30;
    }
  }
  particles.verticesNeedUpdate = true;


  camera.lookAt(scene.position);
  renderer.render(scene, camera);
}


/***************************************************
* Draw flower petals
***************************************************/
function drawFlower(volAvg, color, array) {
  var material = new THREE.MeshBasicMaterial({
      opacity: 0.2,
      transparent: true
  })

  // Change petal colour based on volume range
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

  // Rotate and elongate petals
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

/***************************************************
* Pick a random reddish hue for High beats
***************************************************/
function getHighHue() {
  var h = ((Math.random()*20)) / 255; // RED
  return h;
}


/***************************************************
* Pick a random bluish hue for Medium beats
***************************************************/
function getMedHue() {
  var h = ((Math.random()*30)+120) / 255; // BLUE
  return h;
}


/***************************************************
* Pick a random yellowish hue for Low beats
***************************************************/
function getLowHue() {
  var h = ((Math.random()*30)+30) / 255; // YELLOW
  return h;
}

init();