navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

var constraints = {
    audio: false, video: {
        facingMode: "environment"
    }
};
var video = document.querySelector("#videoElement");
var imageData = document.querySelector("#imageData");
var overlay = document.querySelector("#overlay");
var binarize = document.querySelector("#binarize");
var imageDataCtx = null;
var overlayCtx = null;
var binarizeCtx = null;
var ready = false;
var stats = new Stats();
var instance;
var StatusEnum = { "OK": 1, "HMMMM": 2, "BAD": 3 }
Object.freeze(StatusEnum)
stats.showPanel(0);
document.getElementById('container').appendChild(stats.dom);

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
        this.instance = new Module.myclass(this.video.videoWidth, this.video.videoHeight);
        this.imageData.width = this.video.videoWidth;
        this.imageData.height = this.video.videoHeight;
        this.overlay.width = this.video.videoWidth;
        this.overlay.height = this.video.videoHeight;
        this.binarize.width = this.video.videoWidth;
        this.binarize.height = this.video.videoHeight;
        this.imageDataCtx = this.imageData.getContext('2d');
        this.overlayCtx = this.overlay.getContext('2d');
        this.binarizeCTX = this.binarize.getContext('2d');
        this.detectCard();
    }
}

function detectCard() {
    this.imageDataCtx.drawImage(this.video, 0, 0, this.imageData.width, this.imageData.height);
    var data = this.imageDataCtx.getImageData(0, 0, this.imageData.width, this.imageData.height);
    processFrame(data);
    requestAnimationFrame(this.detectCard.bind(this));
}

function processFrame(img_data) {
    stats.begin();
    this.instance.data.set(img_data.data);
    this.instance.update();
    points = this.instance.getPoints();
    if (points.size() == 1) {
        rectangle = points.get(0);
        var status = this.calculatePosition(rectangle)
        if (status !== StatusEnum.BAD) {
            switch (status) {
                case StatusEnum.HMMMM:
                    this.overlayCtx.fillStyle = "rgba(255, 110, 10, 0.5)"
                    break;
                case StatusEnum.OK:
                    this.overlayCtx.fillStyle = "rgba(140, 255, 10, 0.5)"
                    this.instance.binarize();
                    img_data.data.set(this.instance.data);
                    this.binarizeCTX.putImageData(img_data, 0, 0);
                    break;
            }
            this.overlayCtx.clearRect(0, 0, this.overlay.width, this.overlay.height)
            this.overlayCtx.beginPath();
            this.overlayCtx.moveTo(rectangle.tl.x, rectangle.tl.y, 5, 0, 2 * Math.PI);
            this.overlayCtx.lineTo(rectangle.tr.x, rectangle.tr.y, 5, 0, 2 * Math.PI);
            this.overlayCtx.lineTo(rectangle.bl.x, rectangle.bl.y, 5, 0, 2 * Math.PI);
            this.overlayCtx.lineTo(rectangle.br.x, rectangle.br.y, 5, 0, 2 * Math.PI);
            this.overlayCtx.lineTo(rectangle.tl.x, rectangle.tl.y, 5, 0, 2 * Math.PI);
            this.overlayCtx.fill();
        } else {
            this.overlayCtx.clearRect(0, 0, this.overlay.width, this.overlay.height)
        }
    }
    stats.end();
}

function calculatePosition(rectangle) {
    widthA = Math.sqrt(Math.pow((rectangle.br.x - rectangle.bl.x), 2) + Math.pow((rectangle.br.y - rectangle.bl.y), 2));
    widthB = Math.sqrt(Math.pow((rectangle.tr.x - rectangle.tl.x), 2) + Math.pow((rectangle.tr.y - rectangle.tl.y), 2));
    widthPct = Math.min(widthA, widthB) / Math.max(widthA, widthB);
    heightA = Math.sqrt(Math.pow((rectangle.tr.x - rectangle.br.x), 2) + Math.pow((rectangle.tr.y - rectangle.br.y), 2));
    heightB = Math.sqrt(Math.pow((rectangle.tl.x - rectangle.bl.x), 2) + Math.pow((rectangle.tl.y - rectangle.bl.y), 2));
    heightPct = Math.min(heightA, heightB) / Math.max(heightA, heightB);
    if (widthPct > 0.99 && heightPct > 0.99) {
        distanceX = rectangle.tr.x - rectangle.bl.x;
        distanceY = rectangle.tr.y - rectangle.tl.y;
        distanceX = -distanceX > 0 ? -distanceX : distanceX;
        distanceY = -distanceY > 0 ? -distanceY : distanceY;
        ratio = (widthA / heightA).toFixed(2)
        if (0.84 >= ratio <= 0.86) {
            if ((distanceX <= 10 && distanceY <= 10)) {
                return StatusEnum.OK;
            } else {
                return StatusEnum.HMMMM;
            }
        } else {
            return StatusEnum.BAD;
        }
    } else {
        return StatusEnum.BAD;
    }
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