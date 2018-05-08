// Grab elements, create settings, etc.
var video = document.getElementById('video');
var MOUTHRECTANGLE = {
    x : null,
    y : null,
    w : null,
    h : null
}
// Get access to the camera
function getCamera(video){
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        var constraints = {
            video: {
                mandatory: {
                    minWidth: 640,
                    minHeight: 480
                }
            }
        }
        navigator.mediaDevices.getUserMedia(constraints).then(function(stream){
            video.src = window.URL.createObjectURL(stream);
            video.play();
            // Attach to play event and then update dimensions after 500ms
            video.addEventListener("playing", function () {
                setTimeout(function () {
                    video.style.cssText = "-moz-transform: scale(-1, 1);-webkit-transform: scale(-1, 1); -o-transform: scale(-1, 1);transform: scale(-1, 1); filter: FlipH;";
                    console.log("Camera dimensions: x=" + video.videoWidth + " y=" + video.videoHeight);
                    video.width = video.videoWidth;
                    video.height = video.videoHeight;
                    setupOverlay(video);
                }, 500);
            });
            // get device specs so we can determine if it's a mobile camera
            try {
                navigator.mediaDevices.enumerateDevices().then(function(devices){
                    devices.forEach(function(device){
                        if (device.kind == 'videoinput'){
                            console.log('Video device: ' + device.label);
                            document.getElementById("cameratype").innerText = device.label;
                        }
                    });
                }).catch(function(err){
                    console.log(err.name + ": " + err.message);
                });
            } catch (e){
                console.log('Device does not support enumerating input devices.');
            }
        }).catch(function(err){
            alert("Your device does not meet the minimum camera requirements.")
        });
    }
}
getCamera(video);

// Trigger photo take
document.getElementById("snap").addEventListener("click", function () {
    var canvas = document.getElementById('canvas');
    canvas.width = video.width;
    canvas.height = video.height;
    canvas.style.cssText = "-moz-transform: scale(-1, 1);-webkit-transform: scale(-1, 1); -o-transform: scale(-1, 1);transform: scale(-1, 1); filter: FlipH;";
    var context = canvas.getContext('2d');

    context.drawImage(video, 0, 0, video.width, video.height);
    var dataURL = canvas.toDataURL();
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', uploadFinished());
    xhr.open('POST', 'upload');
    xhr.setRequestHeader("X-CSRFToken", csrftoken);
    xhr.setRequestHeader("Content-Type", 'application/json');
    xhr.send(JSON.stringify({
        imgUrl : dataURL
    }));
});

function setupOverlay(video){
    // Elements for taking the snapshot
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');
    var video = document.getElementById('video');
    var overlay = document.getElementById('overlay');

    // make overlay over video
    overlay.width = video.width;
    overlay.height = video.height;
    overlay.style.top = video.offsetTop;
    overlay.style.left = video.offsetLeft;

    // draw face outline on overlay
    function drawFace(overlay){
        var ctx = overlay.getContext('2d');
        const boxWidth = 120;
        const boxHeight = 80;
        var leftCorner = (video.width * 0.5) - (boxWidth * 0.5);
        // if vertical aspect ratio, we place the box lower down
        var topCorner = (video.height > video.width? (video.height * 0.65):(video.height * 0.5));

        MOUTHRECTANGLE = {
            x : leftCorner,
            y : topCorner,
            w : boxWidth,
            h : boxHeight
        }

        ctx.beginPath();
        ctx.setLineDash([5,5]);
        ctx.strokeStyle = 'green';
        ctx.lineWidth="4";
        ctx.rect(leftCorner, topCorner, boxWidth, boxHeight);
        ctx.stroke();

    }
    drawFace(overlay);
}



function drawTongueTarget(overlay, location){
    var ctx = overlay.getContext('2d');
    const radius = 25;
    
    ctx.beginPath();
    ctx.strokeStyle = 'red';
    ctx.arc(location.x,location.y,radius,0,2*Math.PI);
    ctx.stroke();
}

function clearCanvas(overlay){
    var ctx = overlay.getContext('2d');
    ctx.clearRect(0, 0, overlay.width, overlay.height);
}

function uploadFinished(){

}