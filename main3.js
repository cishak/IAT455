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


// function tripinski(h,w,onBeat) {
//     //first triangle
//     var xa = w/2;
//     var ya = 0;
//     var xb = 0;
//     var yb = h;
//     var xc = w;
//     var yc = h;
//     drawTriangle(xa,ya,xb,yb,xc,yc);
//     var top = h/2;
//     var left = w/4;
//     triangle(h/2,w/2,top,left,beat);
// }


// function triangle(h,w,top,left,onBeat) {
//     var xa = left;
//     var ya = top;
//     var xb = left+w;
//     var yb = top;
//     var xc = left+(w/2);
//     var yc = top+h;

//     if ((w > 10) && (onBeat == true)) { 
//         //draw the current triangle
//         drawTriangle(xa,ya,xb,yb,xc,yc);
//         //half the size and determine the top/left for the next
//         //series of triangles and call the function on those
//         var new_h = h/2;
//         var new_w = w/2;
//         var top_1 = top + new_h;
//         var left_1 = left - (new_w/2);
//         var top_2 = top - new_h;
//         var left_2 = left + (new_w/2);
//         var top_3 = top + new_h;
//         var left_3 = left + w - (new_w/2);
//         triangle(new_h,new_w,top_1,left_1);
//         triangle(new_h,new_w,top_2,left_2);
//         triangle(new_h,new_w,top_3,left_3);
//     }
// }


// function drawTriangle(xa, ya, xb, yb, xc, yc) {
//     var triangleGeometry = new THREE.Geometry();

//     var v1 = new THREE.Vector3(xa,ya,0);
//     var v2 = new THREE.Vector3(xb,yb,0);
//     var v3 = new THREE.Vector3(xc,yc,0);

//     triangleGeometry.vertices.push(v1);
//     triangleGeometry.vertices.push(v2);
//     triangleGeometry.vertices.push(v3);

//     triangleGeometry.faces.push(new THREE.Face3(0, 1, 2));

//     var triangleMaterial = new THREE.MeshBasicMaterial({
//       color: 0xf35149,
//       // blending: THREE.AdditiveBlending,
//       opacity: 1,
//       wireframe: true,
//       wireframeLinewidth: 3
//     });

//     var triangleMesh = new THREE.Mesh(triangleGeometry, triangleMaterial);

//     // triangleMesh.rotation.z = Math.sin(Math.PI) ;

//     triangleFractal.push(triangleMesh);
//     scene.add(triangleMesh);
// }


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
      beatThresh = beatAvg;
      onBeat = true;
      // tripinski(100,100,onBeat);
      // console.log("beat: " + beatThresh);
      // console.log(maxValue);

    } else {
      beatThresh *= 0.98; // gravity on threshold
      onBeat = false;
    }
    console.log(onBeat);

    // console.log((beatVals[i]));

    // maxValue = beatVals[i];
    // if(beatVals[i] > beatVals[i+1])

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

  // console.log(beatVals);
 

  

  // var maxValue = Math.max(beatVals);
  // console.log(maxValue);

  

  // if (change % 3 == 0) {
  //   // console.log(change%2);
  //   if (volAvg > 40) {
  //     beatcount++;
  //     console.log(beatcount);



  //     if (volAvg > 40) {
  //       var newTriangle = new THREE.Geometry();

  //       var v1 = new THREE.Vector3(-30, 0, 0);
  //       var v2 = new THREE.Vector3(0, 60, 0);
  //       var v3 = new THREE.Vector3(30, 0, 0);

  //       newTriangle.vertices.push(v1);
  //       newTriangle.vertices.push(v2);
  //       newTriangle.vertices.push(v3);

  //       newTriangle.faces.push(new THREE.Face3(0, 1, 2));

  //       var newMaterial = new THREE.MeshBasicMaterial({
  //         color: 0xf35149,
  //         // blending: THREE.AdditiveBlending,
  //         opacity: 0.6,
  //         // transparent: true,
  //         wireframe: true,
  //         wireframeLinewidth: 5
  //       });
  //       var newMesh = new THREE.Mesh(newTriangle, newMaterial);

  //       // Set position of triangles on canvas
  //       newMesh.position.x = Math.random() * sceneWidth + leftMost;
  //       newMesh.position.y = Math.random() * sceneHeight + topMost;
  //       // newMesh.scale.x += theta;
  //       // newMesh.scale.y += theta;

  //       camera.position.z += 4;

  //       sceneWidth += 5;
  //       sceneHeight += 5;
  //       leftMost = -(sceneWidth / 2);
  //       topMost = -(sceneHeight / 2);

  //       scene.add(newMesh);
  //     }
  //   }

  //   // // Detect a beat
  //   // if (volAvg > beatThresh) {
  //   //   beatThresh = volAvg * 1.5;
  //   //   beatHold = 0;

  //   //   // camera.position.z += 4;

  //   //   beatcount ++
  //   //   console.log(beatThresh);
      
  //   // } else {
  //   //   if (beatTime <= beatHold) {
  //   //     beatTime ++;
  //   //     // beatThresh --;
  //   //     console.log("huh");
  //   //   } else {
  //   //     // beatTime *= 0.9;
  //   //     beatThresh *= 0.5;
  //   //   }
  //   // }
  // }

  for (var i = 0; i < circleMeshes.length; i++) {
      circleMeshes[i].scale.y = maxValue/20;
      circleMeshes[i].scale.x = maxValue/20;
      if(maxValue > 50) {
          // circleMeshes[i].rotation.x += 0.05;
          // circleMeshes[i].rotation.y += 0.05;
          // console.log("maxvalue:" + maxValue);
          circleMeshes[i].rotation.z +=  0.03;
      }

      boxMeshes[i].scale.y = minValue/20;
      boxMeshes[i].scale.x = minValue/20;
      if(minValue < 30) {
          // circleMeshes[i].rotation.x += 0.05;
          // circleMeshes[i].rotation.y += 0.05;
          // console.log("minValue:" + minValue);
          boxMeshes[i].rotation.z -=  0.01;
      }
  }


  for (var i = 0; i < triangleMeshes.length; i++) {
      // Scale triangles based on audio input
      triangleMeshes[i].scale.y = volAvg/30;
      triangleMeshes[i].scale.x = volAvg/30;
      // triangleMeshes[i].position.z = 20*Math.sin(theta) + 0;   
  }
  camera.lookAt(scene.position);

  renderer.render(scene, camera);
}

init();