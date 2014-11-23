var camera;
var scene;
var renderer;

var geometry;
var material;
var meshes = [];
var SPHERE_WIDTH = 20;

var PARTICLES_COUNT = 15;
var particles;
var particlesMaterial;
var particlesHue = 0;



var RINGCOUNT = 1;
var SEPARATION = 1;
var INIT_RADIUS = 200;
var SEGMENTS = 512;
var BIN_COUNT = 512;
var SAMPLES = 1024;

var rings = [];
var levels = [];
var colors = [];
var loopHolder = new THREE.Object3D();
var loopGeom;//one geom for all rings
var audioContext = new AudioContext();
var analyser =  audioContext.createAnalyser();
analyser.fftSize = SAMPLES;







// var audioContext = new AudioContext();
// var SAMPLES = 128;
// var fft =  audioContext.createAnalyser();
// fft.fftSize = SAMPLES;

// // Will contain amplitude data of our harmonics.
// var buffer = new Uint8Array(SAMPLES);
var req = new XMLHttpRequest();

// // Clock to keep track of time
// var clock = new THREE.Clock();

// Scene setup
function init() {

  ////////INIT audio in
    freqByteData = new Uint8Array(analyser.frequencyBinCount);
    timeByteData = new Uint8Array(analyser.frequencyBinCount);

    //create ring geometry
    var loopShape = new THREE.Shape();
    loopShape.absarc( 0, 0, INIT_RADIUS, 0, Math.PI*4, false );
    loopGeom = loopShape.createPointsGeometry(SEGMENTS/2);
    loopGeom.dynamic = true;

    scene = new THREE.Scene();

    //create rings
    scene.add(loopHolder);
    var scale = 1;
    // for(var i = 0; i < RINGCOUNT; i++) {

      var material = new THREE.LineBasicMaterial( { 
        color: 0xffffff,
        linewidth: 5 ,
        opacity : 0.7,
        blending : THREE.AdditiveBlending,
        depthTest : false,
        transparent : true
      });
      
      var line = new THREE.Line(loopGeom, material);

      rings.push(line);
      scale *= 1.05;
      line.scale.x = scale;
      line.scale.y = scale;
      loopHolder.add(line);

      levels.push(0);
      colors.push(0);

    // }






  // var sceneWidth = window.innerWidth;
  // var sceneHeight = window.innerHeight;
  // var leftMost = -(sceneWidth / 2);
  // var topMost = -(sceneHeight / 2);

  // Initialize renderer
  renderer = new THREE.WebGLRenderer({
    alpha: true
    // antialias: false,
    // sortObjects: false
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
    60,
    window.innerWidth / window.innerHeight,
    1,
    100000
  );

  // The position of the camera in our scene.
  camera.position.z = 2000;
  // camera.position.y = 0;

  // Initialize scene
  // scene = new THREE.Scene();

  // THREE.AdditiveBlending = 2;

  // // Initialize spheres
  // for (var i = 0; i < 21 ; i++) {
  //   var geometry = new THREE.SphereGeometry(SPHERE_WIDTH, SPHERE_WIDTH, SPHERE_WIDTH);
  //   var material = new THREE.MeshPhongMaterial({
  //     color: 0xFFFFFF,
  //     blending: THREE.AdditiveBlending,
  //     opacity: 0.5,
  //     transparent: true
  //   });
  //   var mesh = new THREE.Mesh(geometry, material);

  //   // Set position of spheres on canvas
  //   mesh.position.x = Math.random() * sceneWidth + leftMost;
  //   mesh.position.y = Math.random() * sceneHeight + topMost;

  //   // Add sphere meshes to array and scene
  //   meshes.push(mesh);
  //   scene.add(mesh);
  // }

  /***********************************
   * Particle code by Salehen Rahman *
   ***********************************/

  // particles = new THREE.Geometry();

  // // Create new particle material
  // particlesMaterial = new THREE.PointCloudMaterial( {
  //   size: 40,
  //   opacity: 0.4,
  //   map: THREE.ImageUtils.loadTexture(
  //     'orbs.png'
  //   ),
  //   transparent: true,
  //   depthWrite: false,
  // } );
 
  // // Add the particles to geometry
  // for (var i = 0; i < PARTICLES_COUNT; i++) {
 
  //   // Assign 3D coordinates of particles
  //   var x = (Math.random()%50) * sceneWidth*2 + leftMost*2;
  //   var y = (Math.random()%50) * sceneHeight*2 + topMost*2;
  //   var z = 10;
 
  //   // Push coordinates to vector
  //   var vertex = new THREE.Vector3(x, y, z);
  //   particles.vertices.push( vertex );
  // }
 
  // // Initialize our mesh from our geometry and material.
  // var pointCloud = new THREE.PointCloud( particles, particlesMaterial );
  // scene.add( pointCloud );

  // // Ambient lighting
  // var ambientLight = new THREE.AmbientLight(0x333333);
  // scene.add(ambientLight);

  // // Blue directional light
  // directionalLight = new THREE.DirectionalLight(0x000066);
  // directionalLight.position.set(100, 100, 1000).normalize();
  // scene.add(directionalLight);

  // // Red directional light
  // directionalLight2 = new THREE.DirectionalLight(0xaa0000);
  // directionalLight2.position.set(1, 1, 800).normalize();
  // scene.add(directionalLight2);

  // // Orange directional light
  // directionalLight3 = new THREE.DirectionalLight(0x995500);
  // directionalLight3.position.set(-200, -1000, 100).normalize();
  // scene.add(directionalLight3);

  // Request audio file
  req.open('GET', 'xx.mp3', true);
  req.responseType = 'arraybuffer';

  req.onload = function () {
    // Tell the browser to decode the MP3 data, as PCM data.
    audioContext.decodeAudioData(req.response, function (data) {
      // Create an audio source, based on our PCM.
      var src = audioContext.createBufferSource();
      src.buffer = data;

      src.connect(analyser);
      analyser.connect(audioContext.destination);

      src.start();
      animate();
    });
  }
  // Tell request object to download audio file
  req.send();
}

var theta = 0;

function animate() {

  analyser.getByteFrequencyData(freqByteData);
  analyser.getByteTimeDomainData(timeByteData);

  var perlin = new ImprovedNoise();
  var noisePos = Math.random()*100;

  // Determine volume
  var volume = 0;
  for (var i = 0; i < BIN_COUNT; i++) {
    volume += freqByteData[i];
  }

  volAvg = volume / BIN_COUNT;
  console.log(volAvg);

  //add a new average volume onto the list
  // var sum = 0;
  // for(var i = 0; i < BIN_COUNT; i++) {
  //   sum += freqByteData[i];
  // }
  // var aveLevel = sum / BIN_COUNT;
  // var scaled_average = (aveLevel / 256) * 4;//vizParams.gain*2; //256 is the highest a level can be
  // levels.push(scaled_average);
  // levels.shift(1);

  //add a new color onto the list
  
  var n = Math.abs(perlin.noise(noisePos, 0, 0));
  // console.log(n);
  // colors.push(n);
  // colors.shift(1);

  //write current waveform into all rings
  for(var j = 0; j < SEGMENTS; j++) {
    loopGeom.vertices[j].z = timeByteData[j]*3;//stretch by 2
  }
  // link up last segment
  loopGeom.vertices[SEGMENTS].z = loopGeom.vertices[0].z;
  loopGeom.verticesNeedUpdate = true;

  // for( i = 0; i < RINGCOUNT ; i++) {
  //   var ringId = RINGCOUNT - i - 1;
  //   var normLevel = levels[ringId] + 0.01; //avoid scaling by 0
  //   var hue = colors[i];
  //   rings[i].material.color.setHSL(hue, 1, normLevel*.8);
  //   rings[i].material.linewidth = normLevel*3;
  //   rings[i].material.opacity = normLevel;
  //   rings[i].scale.z = normLevel * 1;//vizParams.zbounce;
  // }




  // fft.getByteFrequencyData(buffer);
  // var time = clock.getDelta();

  requestAnimationFrame(animate);

  // theta += time * 0.1;

  // for (var i = 0; i < meshes.length; i++) {
  //     // Scale spheres based on audio input
  //     meshes[i].scale.x = buffer[i]/30;
  //     meshes[i].scale.y = buffer[i]/30;
  //     meshes[i].scale.z = buffer[i]/30;

  //     // Move spheres around window based on audio input
  //     meshes[i].position.z = buffer[i];
  //     meshes[i].position.y = Math.sin(theta+i*5) * window.innerHeight/3;
  //     meshes[i].position.x = Math.cos(theta+i) * window.innerWidth/3;

  //     // Alter light intensity and colour
  //     directionalLight.intensity2 = meshes[i].position.z/200;   
  //     directionalLight.color.setRGB(0,0,(buffer[i]/70)%1);
  // }
  // camera.lookAt(scene.position);


  /***********************************
   * Particle code by Salehen Rahman *
   ***********************************/

  // // Modify particle colours
  // particlesHue = (particlesHue + time/10)%1;
  // particlesMaterial.color.setHSL( (particlesHue), 1, 0.7 );
 
  // // Update particle positions
  // for (var i = 0; i < particles.vertices.length; i++) {
  //   particles.vertices[i].x = Math.sin(theta+i)* window.innerHeight;
  //   particles.vertices[i].z = Math.cos(theta+i*5)* window.innerHeight;
  // }
  // particles.verticesNeedUpdate = true;

  renderer.render(scene, camera);
}

init();