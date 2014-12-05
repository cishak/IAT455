var audioContext = new AudioContext();
var SAMPLES = 1024;
var fft =  audioContext.createAnalyser();
fft.fftSize = SAMPLES;
var volAvg;

// Will contain amplitude data of our harmonics.
var buffer = new Uint8Array(SAMPLES);
var req = new XMLHttpRequest();

var BIN_COUNT = 512;
var beatThresh = 1;
var onBeat = false;
var beatTime = 0;
var beatHold = 1;
var beatcount = 0;
var change = 0;
var theta = 0;
var beatVals = [];

var clock = new THREE.Clock();

window.addEventListener("load", windowLoadHandler, false);

//for debug messages while testing code
var Debugger = function() { };
Debugger.log = function(message) {
  try {
    console.log(message);
  }
  catch (exception) {
    return;
  }
}

function windowLoadHandler() {
  canvasApp();
}

function canvasSupport() {
  return Modernizr.canvas;
}

function canvasApp() {
  if (!canvasSupport()) {
    return;
  }
  
  var displayCanvas = document.getElementById("displayCanvas");
  var context = displayCanvas.getContext("2d");
  var displayWidth = displayCanvas.width;
  var displayHeight = displayCanvas.height;
  
  //off screen canvas used only when exporting image
  var exportCanvas = document.createElement('canvas');
  exportCanvas.width = displayWidth;
  exportCanvas.height = displayHeight;
  var exportCanvasContext = exportCanvas.getContext("2d");
  
  var numCircles;
  var maxMaxRad;
  var minMaxRad;
  var minRadFactor;
  var circles;
  var iterations;
  var timer;
  var drawsPerFrame;
  var drawCount;
  var bgColor,urlColor;
  var TWO_PI = 2*Math.PI;
  var lineWidth;
  
  
  
  function init() {

    freqByteData = new Uint8Array(fft.frequencyBinCount);
    timeByteData = new Uint8Array(fft.frequencyBinCount);
    // console.log(freqByteData);

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
        // startGenerating();
      });
    }
    // Tell request object to download audio file
    req.send();

    /*
    In other experiments, you may wish to use more fractal curves ("circles")
    and allow the radius of them to vary. If so, modify the next three variables.
    */
    numCircles = 1;
    maxMaxRad = 100;
    minMaxRad = 100;
    
    /*
    We draw closed curves with varying radius. The factor below should be set between 0 and 1,
    representing the size of the smallest radius with respect to the largest possible.
    */ 
    minRadFactor = 0;
    
    /*
    The number of subdividing steps to take when creating a single fractal curve. 
    Can use more, but anything over 10 (thus 1024 points) is overkill for a moderately sized canvas.
    */
    iterations = 8;
    
    //number of curves to draw on every tick of the timer
    drawsPerFrame = 4;
    
    lineWidth = 1.01;

  }

  
  function animate() {
    fft.getByteFrequencyData(freqByteData);
    fft.getByteTimeDomainData(timeByteData);
    // console.log(buffer);
    fft.getByteFrequencyData(buffer);
    var time = clock.getDelta();

    requestAnimationFrame(animate);

    theta += time * 0.1;
    change++;

    // var perlin = new ImprovedNoise();
    // var noisePos = Math.random()*100;


    // Determine volume
    var volume = 0;
    for (var i = 0; i < BIN_COUNT; i++) {
      volume += freqByteData[i];
      // console.log(freqByteData[i]);
    }
    volAvg = volume / BIN_COUNT;
    // console.log(volAvg);

    beatVals.unshift(volAvg);


    if ((change % 10 == 0) && (beatVals.length > 10)) {
      beatVals.length = 10;
      beatVals.pop();
      // console.log(beatVals);

      var sum = 0;

      for (var i = 0; i < beatVals.length; i++) {
        sum += beatVals[i];
      }

      var beatAvg = sum/beatVals.length;
      var start = new Date().getTime();


      if (beatAvg > beatThresh) {
        beatThresh = beatAvg;

      } else {
        beatThresh *= 0.98; // gravity on threshold
      }
    }  

    // startGenerating(); 
  


    // function startGenerating() {
      drawCount = 0;
      context.setTransform(1,0,0,1,0,0);
      
      context.clearRect(0,0,displayWidth,displayHeight);
      
      // setCircles(volAvg);
      
      if(timer) {clearInterval(timer);}
      timer = setInterval(onTimer,1000/50);
    // }

    
    // function setCircles(volAvg) {

      var i;
      var r,g,b,a;
      var maxR, minR;
      var grad;
      
      circles = [];
      
      for (i = 0; i < numCircles; i++) {
        console.log(volAvg);
        maxR = minMaxRad+Math.random()*(maxMaxRad-minMaxRad);
        minR = minRadFactor*maxR;
        
        //define gradient
        grad = context.createRadialGradient(0,0,minR,0,0,maxR);
        grad.addColorStop(1,"rgba(0,170,200,0.2)");
        grad.addColorStop(0,"rgba(0,20,170,0.2)");
        
        var newCircle = {
          centerX: -maxR,
          centerY: displayHeight/2-50,
          maxRad : maxR,
          minRad : minR,
          color: grad, //can set a gradient or solid color here.
          //fillColor: "rgba(0,0,0,1)",
          param : 0,
          changeSpeed : 1/350,
          phase : Math.random()*TWO_PI, //the phase to use for a single fractal curve.
          globalPhase: Math.random()*TWO_PI //the curve as a whole will rise and fall by a sinusoid.
          };
        circles.push(newCircle);
        newCircle.pointList1 = setLinePoints(iterations);
        newCircle.pointList2 = setLinePoints(iterations);
      }
    // }  
  }


  //Here is the function that defines a noisy (but not wildly varying) data set which we will use to draw the curves.
    function setLinePoints(iterations) {
      var pointList = {};
      pointList.first = {x:0, y:1};
      var lastPoint = {x:1, y:1}
      var minY = 1;
      var maxY = 1;
      var point;
      var nextPoint;
      var dx, newX, newY;
      var ratio;
      
      var minRatio = 0.5;
          
      pointList.first.next = lastPoint;
      for (var i = 0; i < iterations; i++) {
        point = pointList.first;
        while (point.next != null) {
          nextPoint = point.next;
          
          dx = nextPoint.x - point.x;
          newX = 0.5*(point.x + nextPoint.x);
          newY = 0.5*(point.y + nextPoint.y);
          newY += dx*(Math.random()*2 - 1);
          
          var newPoint = {x:newX, y:newY};
          
          //min, max
          if (newY < minY) {
            minY = newY;
          }
          else if (newY > maxY) {
            maxY = newY;
          }
          
          //put between points
          newPoint.next = nextPoint;
          point.next = newPoint;
          
          point = nextPoint;
        }
      }
      
      //normalize to values between 0 and 1
      if (maxY != minY) {
        var normalizeRate = 1/(maxY - minY);
        point = pointList.first;
        while (point != null) {
          point.y = normalizeRate*(point.y - minY);
          point = point.next;
        }
      }
      //unlikely that max = min, but could happen if using zero iterations. In this case, set all points equal to 1.
      else {
        point = pointList.first;
        while (point != null) {
          point.y = 1;
          point = point.next;
        }
      }
      
      return pointList;   
    }


  function onTimer() {
      var i,j;
      var c;
      var rad;
      var point1,point2;
      var x0,y0;
      var cosParam;
      
      var xSqueeze = 0.75; //cheap 3D effect by shortening in x direction.
      
      var yOffset;
      
      //draw circles
      for (j = 0; j < drawsPerFrame; j++) {
        
        drawCount++;
        
        for (i = 0; i < numCircles; i++) {
          c = circles[i];
          c.param += c.changeSpeed;
          if (c.param >= 1) {
            c.param = 0;
            
            c.pointList1 = c.pointList2;
            c.pointList2 = setLinePoints(iterations);
          }
          cosParam = 0.5-0.5*Math.cos(Math.PI*c.param);
          
          context.strokeStyle = c.color;
          context.lineWidth = lineWidth;
          //context.fillStyle = c.fillColor;
          context.beginPath();
          point1 = c.pointList1.first;
          point2 = c.pointList2.first;
          
          //slowly rotate
          c.phase += 0.0002;
          
          theta = c.phase;
          rad = c.minRad + (point1.y + cosParam*(point2.y-point1.y))*(c.maxRad - c.minRad);
          
          //move center
          c.centerX += 0.3;
          c.centerY += 0.04;
          yOffset = 20*Math.sin(c.globalPhase + drawCount/1000*TWO_PI);
          //stop when off screen
          if (c.centerX > displayWidth + maxMaxRad) {
            clearInterval(timer);
            timer = null;
          }     
          
          //we are drawing in new position by applying a transform. We are doing this so the gradient will move with the drawing.
          context.setTransform(xSqueeze,0,0,1,c.centerX,c.centerY+yOffset)
          
          //Drawing the curve involves stepping through a linked list of points defined by a fractal subdivision process.
          //It is like drawing a circle, except with varying radius.
          x0 = xSqueeze*rad*Math.cos(theta);
          y0 = rad*Math.sin(theta);
          context.lineTo(x0, y0);
          while (point1.next != null) {
            point1 = point1.next;
            point2 = point2.next;
            theta = TWO_PI*(point1.x + cosParam*(point2.x-point1.x)) + c.phase;
            rad = c.minRad + (point1.y + cosParam*(point2.y-point1.y))*(c.maxRad - c.minRad);
            x0 = xSqueeze*rad*Math.cos(theta);
            y0 = rad*Math.sin(theta);
            context.lineTo(x0, y0);
          }
          context.closePath();
          context.stroke();
          //context.fill();   
            
        }
      }
    }


    function exportPressed(evt) {
      //background - otherwise background will be transparent.
      exportCanvasContext.fillRect(0,0,displayWidth,displayHeight);
      
      //draw
      exportCanvasContext.drawImage(displayCanvas, 0,0,displayWidth,displayHeight,0,0,displayWidth,displayHeight);
      
      
    }
  
  init();
  
}