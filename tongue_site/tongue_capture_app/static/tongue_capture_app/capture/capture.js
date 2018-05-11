// Grab elements, create settings, etc.
var video = document.getElementById('video');
var MOUTHRECTANGLE = {
    x : null,
    y : null,
    w : null,
    h : null
}
var WORKFLOW; //we define this after the camera is loaded

var currentStep = 0;

var frames = []

function setNextStep(){
    currentStep++;
    if (currentStep >= WORKFLOW.length){
        finish();
    } else {
        showCurrentStep();
    }
}

function finish(){
    window.location.href = "/thankyou";
}

function showCurrentStep(){
    //document.getElementById("instructions").innerText = WORKFLOW[currentStep].description;
    clearCanvas();
    setupOverlay();
    drawTongueTarget(WORKFLOW[currentStep].location);
}

function step(description, direction){
    var circleLocation = {};
    switch (direction){
        case 'left':
            circleLocation['x'] = MOUTHRECTANGLE['x'];
            circleLocation['y'] = MOUTHRECTANGLE['y'] + MOUTHRECTANGLE['h'] * 0.5;
            break;
        case 'right':
            circleLocation['x'] = MOUTHRECTANGLE['x'] + MOUTHRECTANGLE['w'];
            circleLocation['y'] = MOUTHRECTANGLE['y'] + MOUTHRECTANGLE['h'] * 0.5;
            break;
        case 'up':
            circleLocation['x'] = MOUTHRECTANGLE['x'] + MOUTHRECTANGLE['w'] * 0.5;
            circleLocation['y'] = MOUTHRECTANGLE['y'];
            break;
        case 'down':
            circleLocation['x'] = MOUTHRECTANGLE['x'] + MOUTHRECTANGLE['w'] * 0.5;
            circleLocation['y'] = MOUTHRECTANGLE['y'] + MOUTHRECTANGLE['h'];
            break;
    }
    return {'description' : description, 'direction' : direction, 'location' : circleLocation}
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
                    setupOverlay(video);
                    // start the user workflow
                    WORKFLOW = [
                        step('Point your tongue to the left', 'left'),
                        step('Point your tongue to the right', 'right'),
                        step('Point your tongue up', 'up'),
                        step('Point your tongue down', 'down')
                    ]                    
                    showCurrentStep();
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
            alert("Your device camera cannot be opened. Make sure you're using a modern browser and that you've allowed camera access.\n\nYou may also need to close other tabs or applications that access your webcam.")
        });
    }
}
getCamera(video);

// Trigger photo take
document.getElementById("snap").addEventListener("click", takesnapshots);
document.getElementById("canvas").addEventListener("click", hideSnapshot);

function setupOverlay(video){
    // Elements for taking the snapshot
    var context = canvas.getContext('2d');
    var video = document.getElementById('video');
    var overlay = document.getElementById('overlay');

    // make overlay over video
    overlay.width = video.videoWidth;
    overlay.height = video.videoHeight;
    overlay.style.top = video.offsetTop;
    overlay.style.left = video.offsetLeft;

    // draw face outline on overlay
    function drawFace(overlay){
        var ctx = overlay.getContext('2d');
        const boxWidth = 120;
        const boxHeight = 80;
        var leftCorner = (video.videoWidth * 0.5) - (boxWidth * 0.5);
        // if vertical aspect ratio, we place the box lower down
        var topCorner = (video.videoHeight > video.videoWidth? (video.videoHeight * 0.65):(video.videoHeight * 0.5));

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
function takesnapshots(){
    takeNsnapshots(5);
}
function takeNsnapshots(numSnapshots){
    document.getElementById("snap").disabled = true;
    var canvas = document.getElementById('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.style.cssText = "display:none;";
    var context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    frames.push(canvas.toDataURL());
    if (frames.length < numSnapshots){
        setTimeout(function(){
            takeNsnapshots(numSnapshots);
        }, 1000/numSnapshots);
    } else {
        uploadImages();
    }
}

function uploadImages(){
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', uploadFinished);
    xhr.addEventListener('error', uploadError);
    xhr.open('POST', 'upload');
    xhr.setRequestHeader("X-CSRFToken", csrftoken);
    xhr.setRequestHeader("Content-Type", 'application/json');
    xhr.send(JSON.stringify({
        imgUrls : frames,
        metadata : {
            'cameratype' : document.getElementById("cameratype").innerText,
            'videoWidth' : video.videoWidth,
            'videoHeight' : video.videoHeight, 
            'direction' : WORKFLOW[currentStep].direction,
            'mouthRectangle' : MOUTHRECTANGLE
        },
        direction : WORKFLOW[currentStep].direction
    }));
    function uploadFinished(event){
        //canvas.style.cssText = "-moz-transform: scale(-1, 1);-webkit-transform: scale(-1, 1); -o-transform: scale(-1, 1);transform: scale(-1, 1); filter: FlipH;";
        document.getElementById("snap").disabled = false;
        frames = [];
        setNextStep();
    }
    function uploadError(event){
        alert('An error occurred while uploading the image. ' + event.target + ' ' + event.type + ' ' + event.detail);
        document.getElementById("snap").disabled = false;
    }
}

function hideSnapshot(){
    var canvas = document.getElementById('canvas');
    canvas.style.cssText = "display:none;"
}

function drawTongueTarget(location){
    var overlay = document.getElementById('overlay');
    var ctx = overlay.getContext('2d');
    const radius = 10;
    
    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4;
    ctx.arc(location.x,location.y,radius,0,2*Math.PI);
    ctx.fillStyle = 'red';
    ctx.fill();
    ctx.stroke();
}

function clearCanvas(){
    var overlay = document.getElementById('overlay');
    var ctx = overlay.getContext('2d');
    ctx.clearRect(0, 0, overlay.width, overlay.height);
}