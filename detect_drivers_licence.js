navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

var constraints = {
    audio: false, video: {
        facingMode: "environment"
    }
};
var video = document.querySelector("#videoElement");
var imageData = document.querySelector("#imageData");
var imageData2 = document.querySelector("#imageData2");
var imageDataCtx = null;
var imageData2Ctx = null;
var ready = false;

let frame_bytes;

function _ready() {
    this.ready = true;
}

function successCallback(stream) {
    window.stream = stream; // stream available to console
    if (window.URL) {
        video.src = window.URL.createObjectURL(stream);
    } else {
        video.src = stream;
    }
    if (this.imageDataCtx === null) {
        this.onStreamDimensionsAvailable();
    } else {
        this.trackFaces();
    }
}

function onStreamDimensionsAvailable() {
    console.log('onStreamDimensionsAvailable')
    if (this.video.videoWidth === 0 || !ready) {
        setTimeout(this.onStreamDimensionsAvailable.bind(this), 100);
    } else {
        // Resize the canvas to match the webcam video size.
        this.imageData.width = this.video.videoWidth;
        this.imageData.height = this.video.videoHeight;
        this.imageDataCtx = this.imageData.getContext('2d');
        this.imageData2Ctx = this.imageData2.getContext('2d');
        this.trackFaces();
    }
}

function trackFaces() {
    this.imageDataCtx.drawImage(this.video, 0, 0, this.imageData.width, this.imageData.height);
    var data = this.imageDataCtx.getImageData(0, 0, this.imageData.width, this.imageData.height);
    processFrame(data);
    requestAnimationFrame(this.trackFaces.bind(this));
}

function processFrame(img_data) {
    if (!frame_bytes) {
        frame_bytes = _arrayToHeap(img_data.data);
    }
    else if (frame_bytes.length !== img_data.data.length) {
        _freeArray(frame_bytes); // free heap memory
        frame_bytes = _arrayToHeap(img_data.data);
    }
    else {
        frame_bytes.set(img_data.data);
    }
    // Perform operation on copy, no additional conversions needed, direct pointer manipulation
    // results will be put directly into the output param.
    Module._rotate_colors(img_data.width, img_data.height, frame_bytes.byteOffset, frame_bytes.byteOffset);
    // copy output to ImageData
    img_data.data.set(frame_bytes);
    this.imageDataCtx.putImageData(img_data, 0, 0);
}

function errorCallback(error) {
    console.log("navigator.getUserMedia error: ", error);
}

function _freeArray(heapBytes) {
    Module._free(heapBytes.byteOffset);
}

function _arrayToHeap(typedArray) {
    var numBytes = typedArray.length * typedArray.BYTES_PER_ELEMENT;
    var ptr = Module._malloc(numBytes);
    heapBytes = Module.HEAPU8.subarray(ptr, ptr + numBytes);
    heapBytes.set(typedArray);
    return heapBytes;
}

navigator.getUserMedia(constraints, successCallback, errorCallback);