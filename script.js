const video = document.createElement("video");
const startBtn = document.createElement("button");
const stopBtn = document.createElement("button");
const downloadList = document.createElement("ul");
const select = document.createElement("select");
const resolutionSelect = document.createElement("select");
const initBtn = document.createElement("button");

document.body.appendChild(initBtn);
document.body.appendChild(select);
document.body.appendChild(resolutionSelect);
document.body.appendChild(video);
document.body.appendChild(startBtn);
document.body.appendChild(stopBtn);
document.body.appendChild(downloadList);

initBtn.textContent = "カメラを取得";
startBtn.textContent = "録画開始";
stopBtn.textContent = "録画停止";
startBtn.disabled = true;
stopBtn.disabled = true;

// 追加: 撮影解像度の選択肢
const resolutions = [
    { width: 1280, height: 720, label: "HD (1280x720)" },
    { width: 1920, height: 1080, label: "Full HD (1920x1080)" },
    { width: 640, height: 480, label: "VGA (640x480)" }
];
resolutions.forEach(res => {
    const option = document.createElement("option");
    option.value = JSON.stringify(res);
    option.textContent = res.label;
    resolutionSelect.appendChild(option);
});

let mediaRecorder;
let recordedChunks = [];

async function getCameras() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    select.innerHTML = "";
    videoDevices.forEach(device => {
        const option = document.createElement("option");
        option.value = device.deviceId;
        option.textContent = device.label || `Camera ${select.length + 1}`;
        select.appendChild(option);
    });
    startBtn.disabled = false;
}

async function startRecording() {
    const resolution = JSON.parse(resolutionSelect.value);
    const constraints = {
        video: { 
            deviceId: select.value ? { exact: select.value } : undefined,
            width: resolution.width,
            height: resolution.height
        }
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    video.play();

    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = event => recordedChunks.push(event.data);
    mediaRecorder.onstop = saveRecording;
    mediaRecorder.start();

    startBtn.disabled = true;
    stopBtn.disabled = false;
}

function stopRecording() {
    mediaRecorder.stop();
    startBtn.disabled = false;
    stopBtn.disabled = true;
}

function saveRecording() {
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = url;
    a.download = `recording-${Date.now()}.webm`;
    a.textContent = "ダウンロード";
    li.appendChild(a);
    downloadList.appendChild(li);
}

initBtn.addEventListener("click", async () => {
    await navigator.mediaDevices.getUserMedia({ video: true });
    await getCameras();
    initBtn.disabled = true;
});

startBtn.addEventListener("click", startRecording);
stopBtn.addEventListener("click", stopRecording);

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(() => {
        console.log('Service Worker Registered');
    }).catch(error => {
        console.log('Service Worker Registration Failed:', error);
    });
}
