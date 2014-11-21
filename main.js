// Reference:
// http://joshondesign.com/p/books/canvasdeepdive/chapter12.html

//properties for this app
var audioContext = new AudioContext(),
analyser = audioContext.createAnalyser(),
canvas = document.getElementById('canvas'),
canvasContext = canvas.getContext('2d'),
WIDTH = window.innerWidth,
HEIGHT = window.innerHeight,
buffer,
fft,
// analyser.fftSize = 2048;
samples = analyser.frequencyBinCount,
bars = 64,
barWidth = 8,
// This data object will get populated with harmonics
data = new Uint8Array(samples); 

canvasContext.clearRect(0, 0, WIDTH, HEIGHT);

//animation loop
function update() {
  drawVisual = requestAnimationFrame(update);
  analyser.getByteTimeDomainData(data);

  canvasContext.lineWidth = 2;
  canvasContext.strokeStyle = 'rgb(0, 0, 0)';

  canvasContext.beginPath();

  var sliceWidth = WIDTH * 1.0 / samples;
  var x = 0;

  for(var i = 0; i < samples; i++) {
   
        var v = data[i] / 128.0;
        var y = v * HEIGHT/2;

        if(i === 0) {
          canvasContext.moveTo(x, y);
        } else {
          canvasContext.lineTo(x, y);
        }

        x += sliceWidth;
  }

  canvasContext.lineTo(canvas.width, canvas.height/2);
    canvasContext.stroke();
  // }


  // requestAnimationFrame(update);
  // //fill semi transparent black
  // canvasContext.fillStyle = 'rgba(0,0,0, 0.1)'; 
  // canvasContext.fillRect(0,0,800,600); 
  // //put fft frequencies into data array
  // fft.getByteFrequencyData(data); 
  // //draw bars
  // canvasContext.fillStyle = 'red'; 
  // for(var i=0; i < bars; i++) { 
  //   canvasContext.fillRect(50 + i * barWidth,
  //     500 - data[i] * 1.6,
  //     barWidth,
  //     100); 
  // }
}

//start when the window has finished loading
window.onload = function() { 
  //get file
  var req = new XMLHttpRequest(); 

  // Tell the request object that this is what we want to download
  // (Won't download yet. You have to tell it)
  req.open("GET","Hustle.mp3",true);

  // the data will be loaded as an array buffer
  // Set this property, so the browser does not mess around with the data that it hands to you
  req.responseType = "arraybuffer";
  req.onload = function() {
    //use the audioContext object to decode the response as audio
    // Tell browser to decode MP3 data as PCM data (raw time domain PCM data, not frequency domain data)
    audioContext.decodeAudioData(req.response, function(data) { 
      // create an audio source based on our PCM
      buffer = data;
      //create a source node from the buffer 
      var src = audioContext.createBufferSource();  
      src.buffer = buffer;
      //create fft
      fft = audioContext.createAnalyser();
      fft.fftSize = samples;
      //connect them up into a chain
      src.connect(fft);
      fft.connect(audioContext.destination);
      //play immediately
      console.log(src);
      src.start();
      update();
    });
  };
  // Finally, tell the request object to download the file that we are pending to download
  req.send();
}

