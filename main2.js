var camera;
var scene;
var renderer;

var BIN_COUNT = 512;
var beatThresh = 1;
var beatcount = 0;
var change = 0;
var BEAT_CHECK = 11;
var beatVals = [];
var maxValue;
var minValue;

var INIT_RADIUS = 40;
var SEGMENTS = 512;

var loopGeom;
var line = new THREE.Line();
var audioContext = new AudioContext();
var analyser =  audioContext.createAnalyser();
analyser.fftSize = 1024;

var req = new XMLHttpRequest();

// Scene setup
function init() {

  ////////INIT audio in
    freqByteData = new Uint8Array(analyser.frequencyBinCount);
    timeByteData = new Uint8Array(analyser.frequencyBinCount);

    //create ring geometry
    var loopShape = new THREE.Shape();
    loopShape.absarc( 0, 0, INIT_RADIUS, 0, Math.PI*4, true );
    loopGeom = loopShape.createPointsGeometry(SEGMENTS/2);
    // loopGeom.dynamic = true;

    scene = new THREE.Scene();

    var material = new THREE.LineBasicMaterial( { 
      color: 0xff0000,
      // linewidth: 5 ,
      opacity : 0.7,
      blending : THREE.AdditiveBlending,
      depthTest : false,
      // transparent : true
    });
    
    // var line = new THREE.Line(loopGeom, material);

    line.geometry = loopGeom;
    line.material = material;

    // rings.push(line);
    // scale *= 1.05;
    // line.scale.x = scale;
    // line.scale.y = scale;
    // loopHolder.add(line);

    scene.add(line);

      // levels.push(0);
      // colors.push(0);

    // }

  // var sceneWidth = window.innerWidth;
  // var sceneHeight = window.innerHeight;
  // var leftMost = -(sceneWidth / 2);
  // var topMost = -(sceneHeight / 2);

  // Initialize renderer
  renderer = new THREE.WebGLRenderer({
    alpha: true
  });

  // Set size of renderer
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0xff0000, 1);
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
  camera.position.z = 800;
  // camera.rotation.y = 200;
  // camera.position.y = 0;

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

  // var perlin = new ImprovedNoise();
  // var noisePos = Math.random()*100;


  // Determine volume
  var volume = 0;
  for (var i = 0; i < BIN_COUNT; i++) {
    volume += freqByteData[i];
  }
  volAvg = volume / BIN_COUNT;

  beatVals.unshift(volAvg);

  if ((change % BEAT_CHECK == 0) && (beatVals.length > BEAT_CHECK)) {
    beatVals.length = BEAT_CHECK;
    beatVals.pop();


    //write current waveform into ring
    for(var j = 0; j < SEGMENTS; j++) {
      loopGeom.vertices[j].z = timeByteData[j]*2;//stretch by 2
    }
    // link up last segment
    loopGeom.vertices[SEGMENTS].z = loopGeom.vertices[0].z;
    loopGeom.verticesNeedUpdate = true;

    
    

    var sum = 0;

    for (var i = 0; i < beatVals.length; i++) {
      sum += beatVals[i];
    }

    var beatAvg = sum/beatVals.length;
    var start = new Date().getTime();


    if (beatAvg > beatThresh) {
      beatThresh = beatAvg;
      console.log(beatThresh);

      line.position.y *= 10;
      // line.position.x = beatThresh;

    } else {
      beatThresh *= 0.99; // gravity on threshold
      line.position.y *= 0.99;
    }

    maxValue = beatVals[0];

    for(var i = 0; i < beatVals.length; i++) {
      if(beatVals[i] > maxValue) {
          maxValue = beatVals[i];
      }
    }

    minValue = beatVals[0];

    for(var i = 0; i < beatVals.length; i++) {
      if(beatVals[i] < minValue) {
          minValue = beatVals[i];
      }
    }
  }


  // var n = Math.abs(perlin.noise(noisePos, 0, 0));
  // console.log(n);
  // colors.push(n);
  // colors.shift(1);

  // //write current waveform into all rings
  // for(var j = 0; j < SEGMENTS; j++) {
  //   loopGeom.vertices[j].z = timeByteData[j]*5;//stretch by 2
  // }
  // // link up last segment
  // loopGeom.vertices[SEGMENTS].z = loopGeom.vertices[0].z;
  // loopGeom.verticesNeedUpdate = true;

  line.scale.y = volAvg/40;
  line.scale.x = volAvg/40;

  requestAnimationFrame(animate);

  camera.lookAt(scene.position);
  renderer.render(scene, camera);
}

init();