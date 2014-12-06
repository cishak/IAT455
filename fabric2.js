var displayCanvas = document.getElementById("displayCanvas");
var context = displayCanvas.getContext('2d');
var displayWidth = displayCanvas.width;
var displayHeight = displayCanvas.height;

var canvas = document.querySelector('canvas');
var ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

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

var audioContext = new AudioContext();
var analyser =  audioContext.createAnalyser();
analyser.fftSize = 1024;

var BIN_COUNT = 512;
var beatThresh = 1;
var beatcount = 0;
var change = 0;
var BEAT_CHECK = 11;
var beatVals = [];
var maxValue;
var minValue;

var req = new XMLHttpRequest();

var maxParticles = 200,
    particleSize = 3,
    emissionRate = 1,
    objectSize = 10; // drawSize of emitter/field




//animation loop
function update() {
	requestAnimationFrame(update);

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

	    var sum = 0;

	    for (var i = 0; i < beatVals.length; i++) {
	        sum += beatVals[i];
	    }

	    var beatAvg = sum/beatVals.length;

	    if (beatAvg > beatThresh) {
	        beatThresh = beatAvg;
	        // console.log(beatThresh);

	    } else {
	        beatThresh *= 0.99; // gravity on threshold
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





	// particles
	ctx.fillStyle = 'rgb(0,0,255)';
    for (var i = 0; i < particles.length; i++) {
        var position = particles[i].position;
        ctx.fillRect(position.x, position.y, particleSize, particleSize);
    }


    // clear particles
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // update particles
    addNewParticles();
    plotParticles(canvas.width, canvas.height);

    // draw particles
    drawParticles();
    fields.forEach(drawCircle);
    emitters.forEach(drawCircle);
}


init();
function init() {
	freqByteData = new Uint8Array(analyser.frequencyBinCount);
    timeByteData = new Uint8Array(analyser.frequencyBinCount);
	/*
	In other experiments, you may wish to use more fractal curves ("circles")
	and allow the radius of them to vary. If so, modify the next three variables.
	*/
	numCircles = 1;
	maxMaxRad = 80;
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
	
	bgColor = "#FFFFFF";
	urlColor = "#EEEEEE";
	
	lineWidth = 1;




	var particles = [];

	var midX = canvas.width / 2;
	var midY = canvas.height / 2;

	// Add one emitter located at `{ x : 100, y : 230}` from the origin (top left)
	// that emits at a velocity of `2` shooting out from the right (angle `0`)
	var emitters = [new Emitter(new Vector(midX, midY), Vector.fromAngle(-2, 1))];

	// Add one field located at `{ x : 400, y : 230}` (to the right of our emitter)
	// that repels with a force of `140`
	var fields = [new Field(new Vector(midX + 150, midY), -140)];

	// emitter
	ctx.fillStyle = object.drawColor;
    ctx.beginPath();
    ctx.arc(object.position.x, object.position.y, objectSize, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();



	// Request audio file
	req.open('GET', 'olafur.mp3', true);
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
	      	update();
	      	startGenerate();
	    });
	}

	// Tell request object to download audio file
	req.send();
}

function startGenerate() {
	drawCount = 0;
	context.setTransform(1,0,0,1,0,0);
	
	context.clearRect(0,0,displayWidth,displayHeight);
	
	setCircles();
	
	if(timer) {clearInterval(timer);}
	timer = setInterval(onTimer,1000/50);
}

function setCircles() {
	var i;
	var r,g,b,a;
	var maxR, minR;
	var grad;
	
	circles = [];
	
	for (i = 0; i < numCircles; i++) {
		maxR = minMaxRad+Math.random()*(maxMaxRad-minMaxRad);
		minR = minRadFactor*maxR;

		//define gradient
		grad = context.createRadialGradient(0,0,minR,0,0,maxR);
		grad.addColorStop(1,"rgba(0,170,200,0.2)");
		grad.addColorStop(0,"rgba(0,20,170,0.2)");
		
		var newCircle = {
			centerX: -maxR,
			centerY: displayHeight/2+50,
			maxRad : maxR,
			minRad : minR,
			color: grad, //can set a gradient or solid color here.
			//fillColor: "rgba(0,0,0,1)",
			param : 0,
			changeSpeed : 1/250,
			phase : 100,//Math.random()*TWO_PI, //the phase to use for a single fractal curve.
			globalPhase: 100//Math.random()*TWO_PI //the curve as a whole will rise and fall by a sinusoid.
			};
		circles.push(newCircle);
		newCircle.pointList1 = setLinePoints(iterations);
		newCircle.pointList2 = setLinePoints(iterations);
	}
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
			c.centerX += 0.6;
			c.centerY += volAvg/20*Math.sin(c.globalPhase + drawCount/10000*TWO_PI);



			/************************************************/
			/***** THIS SECTION AFFECTS Y-COORD OF WAVE *****/
			/************************************************/



			yOffset = 40*Math.sin(c.globalPhase + drawCount/1000*TWO_PI);
			console.log(volAvg);
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

			context.save();
			context.translate(100,0);
			context.restore();	
				
		}
	}
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












function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
}

// function getMousePos(canvas, e) {
//   var canv = canvas.getBoundingClientRect();
// // canvas.onclick = function (e) {
//   return {
//     fields[0].position = new Vector(e.clientX, e.clientY);
//     // if (e.ctrlKey) {
//     //     if (emitters.length > 0) {
//     //         emitters[0].position = new Vector(e.clientX, e.clientY);
//     //     }
//     // } else {
//         // if (fields.length > 0) {
//         //     fields[0].position = new Vector(e.clientX, e.clientY);
//         // }

//     }
// }
// canvas.ondblclick = function (e) {
//     console.log("dblclick", e);
// }


function Particle(point, velocity, acceleration) {
    this.position = point || new Vector(0, 0);
    this.velocity = velocity || new Vector(0, 0);
    this.acceleration = acceleration || new Vector(0, 0);
}

Particle.prototype.submitToFields = function (fields) {
    // our starting acceleration this frame
    var totalAccelerationX = 0;
    var totalAccelerationY = 0;

    // for each passed field
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];

        // find the distance between the particle and the field
        var vectorX = field.position.x - this.position.x;
        var vectorY = field.position.y - this.position.y;

        // calculate the force via MAGIC and HIGH SCHOOL SCIENCE!
        var force = field.mass / Math.pow(vectorX * vectorX + vectorY * vectorY, 1.5);

        // add to the total acceleration the force adjusted by distance
        totalAccelerationX += vectorX * force;
        totalAccelerationY += vectorY * force;
    }

    // update our particle's acceleration
    this.acceleration = new Vector(totalAccelerationX, totalAccelerationY);
};

Particle.prototype.move = function () {
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
};

function Field(point, mass) {
    this.position = point;
    this.setMass(mass);
}

Field.prototype.setMass = function (mass) {
    this.mass = mass || 100;
    this.drawColor = mass < 0 ? "#f00" : "#0f0";
}

function Vector(x, y) {
    this.x = x || 0;
    this.y = y || 0;
}

Vector.prototype.add = function (vector) {
    this.x += vector.x;
    this.y += vector.y;
}

Vector.prototype.getMagnitude = function () {
    return Math.sqrt(this.x * this.x + this.y * this.y);
};

Vector.prototype.getAngle = function () {
    return Math.atan2(this.y, this.x);
};

Vector.fromAngle = function (angle, magnitude) {
    return new Vector(magnitude * Math.cos(angle), magnitude * Math.sin(angle));
};

function Emitter(point, velocity, spread) {
    this.position = point; // Vector
    this.velocity = velocity; // Vector
    this.spread = spread || Math.PI / 32; // possible angles = velocity +/- spread
    this.drawColor = "#999"; // So we can tell them apart from Fields later
}

Emitter.prototype.emitParticle = function () {
    // Use an angle randomized over the spread so we have more of a "spray"
    var angle = this.velocity.getAngle() + this.spread - (Math.random() * this.spread * 2);

    // The magnitude of the emitter's velocity
    var magnitude = this.velocity.getMagnitude();

    // The emitter's position
    var position = new Vector(this.position.x, this.position.y);

    // New velocity based off of the calculated angle and magnitude
    var velocity = Vector.fromAngle(angle, magnitude);

    // return our new Particle!
    return new Particle(position, velocity);
};

function addNewParticles() {
    // if we're at our max, stop emitting.
    if (particles.length > maxParticles) return;

    // for each emitter
    for (var i = 0; i < emitters.length; i++) {

        // emit [emissionRate] particles and store them in our particles array
        for (var j = 0; j < emissionRate; j++) {
            particles.push(emitters[i].emitParticle());
        }

    }
}

function plotParticles(boundsX, boundsY) {
    // a new array to hold particles within our bounds
    var currentParticles = [];

    for (var i = 0; i < particles.length; i++) {
        var particle = particles[i];
        var pos = particle.position;

        // If we're out of bounds, drop this particle and move on to the next
        if (pos.x < 0 || pos.x > boundsX || pos.y < 0 || pos.y > boundsY) continue;

        // Update velocities and accelerations to account for the fields
        particle.submitToFields(fields);

        // Move our particles
        particle.move();

        // Add this particle to the list of current particles
        currentParticles.push(particle);
    }

    // Update our global particles reference
    particles = currentParticles;
}

// function drawParticles() {
//     ctx.fillStyle = 'rgb(0,0,255)';
//     for (var i = 0; i < particles.length; i++) {
//         var position = particles[i].position;
//         ctx.fillRect(position.x, position.y, particleSize, particleSize);
//     }
// }

// function drawCircle(object) {
//     ctx.fillStyle = object.drawColor;
//     ctx.beginPath();
//     ctx.arc(object.position.x, object.position.y, objectSize, 0, Math.PI * 2);
//     ctx.closePath();
//     ctx.fill();
// }


// function loop() {
//     clear();
//     update();
//     draw();
//     queue();
// }

// function clear() {
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
// }

// function update() {
//     addNewParticles();
//     plotParticles(canvas.width, canvas.height);
// }

// function draw() {
//     drawParticles();
//     fields.forEach(drawCircle);
//     emitters.forEach(drawCircle);
// }

// function queue() {
//     window.requestAnimationFrame(loop);
// }

// loop();