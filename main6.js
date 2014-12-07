var audioContext = new AudioContext(),
canvas = document.getElementById('canvas'),
canvasContext = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvasContext.fillRect(0, 0, canvas.width, canvas.height);
canvasContext.fillStyle = '#f00',
pos=[];

function init() {
  for(var i=0; i<10; i++){
    pos.push([Math.random()*canvas.width,Math.random()*canvas.height]);
  }
}

function step(){
  var direction = Math.floor(Math.random(4));
  for (i in pos){
    switch (direction) {
      case 0:
        pos[i][0] += direction;
        pos[i][1] += direction;
    }
  }

  // for(i in pos){
  //   pos[i][0]+=Math.random()<.5?-Math.random()*2:Math.random()*2
  //   pos[i][1]+=Math.random()<.5?-Math.random()*2:Math.random()*2
  //     pos[i][0]+=pos[i][0]<0?100:0
  //     pos[i][1]+=pos[i][1]<0?100:0
  //     pos[i][0]-=pos[i][0]>canvas.width?100:0
  //     pos[i][1]-=pos[i][1]>canvas.height?100:0
  // }
}

function update(){
  step()
  for(i in pos){
    canvasContext.fillRect(pos[i][0],pos[i][1],1,1)
  }
  setTimeout(update,1000/60)
}
update();
init();