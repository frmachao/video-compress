import { getFileNames, formatNames } from "./util.mjs";
import { FFmpeg } from "./assets/ffmpeg/package/dist/esm/index.js";
import { fetchFile } from "./assets/util/package/dist/esm/index.js";
const ffmpegInstances = {};

const instantiateFFmpeg = async (isMT) => {
  if (!ffmpegInstances[isMT]) {
    const compressBar = document.getElementById("compress-task-bar");
    compressBar.classList.add("progress-bar-animated");
    const ffmpegInstance = new FFmpeg();
    ffmpegInstance.on("log", ({ message }) => {
      console.log(message);
    });
    ffmpegInstance.on("progress", ({ progress }) => {
      const value = `${Number.parseFloat(progress * 100).toFixed(2)} %`;
      compressBar.style.width = `${Number.parseFloat(progress * 100).toFixed(
        0
      )}%`;
      compressBar.innerHTML = value;
    });

    const coreURL = isMT
      ? "/assets/core-mt/package/dist/esm/ffmpeg-core.js"
      : "/assets/core/package/dist/esm/ffmpeg-core.js";

    compressBar.style.width = "75%";
    compressBar.innerHTML = "正在加载 FFmpeg 核心依赖...";
    await ffmpegInstance.load({ coreURL });
    compressBar.style.width = "100%";
    compressBar.innerHTML = "FFmpeg 核心依赖完成";
    ffmpegInstances[isMT] = ffmpegInstance;
  }
  return ffmpegInstances[isMT];
};

const getCompressConfig = () => {
  const radioGroup = document.querySelectorAll(
    'input[name="inlineRadioOptions"]'
  );
  let selectedValue;
  radioGroup.forEach(function (radio) {
    if (radio.checked) {
      selectedValue = radio.value;
    }
  });
  return selectedValue;
};

const compress = async () => {
  const { files } = document.getElementById("uploader");
  // 是否启用多线程
  const isMT = document.getElementById("flexSwitchCheckChecked").checked;
  // 压缩率
  const compressConfig = getCompressConfig();
  const outputTips = document.getElementById("output-tips");
  const compressButton = document.getElementById("compress-button");
  const downloadButton = document.getElementById("download-button");
  const compressBar = document.getElementById("compress-task-bar");
  const taskSpinner = document.getElementById("task-spinner");
  // 隐藏压缩按钮
  compressButton.hidden = true;
  // 展示 loading
  taskSpinner.hidden = null;
  const ffmpegInstance = await instantiateFFmpeg(isMT);
  const { name } = files[0];
  const { outputName, fileExt } = formatNames(name);
  // fetchFile 获取数据的方法 ffmpegInstance.writeFile 函数将上传的文件写入FFmpeg的虚拟文件系统中
  await ffmpegInstance.writeFile(name, await fetchFile(files[0]));
  await ffmpegInstance.exec(["-i", name, "-s", compressConfig, outputName]);
  // 移除进度条动画效果
  compressBar.classList.remove("progress-bar-animated");
  // 将转码后的视频文件的URL设置为<video>元素的src属性，以便在页面上播放。
  const data = await ffmpegInstance.readFile(outputName);
  const video = document.getElementById("output-video");
  video.src = URL.createObjectURL(
    new Blob([data.buffer], { type: `video/${fileExt}` })
  );
  taskSpinner.hidden = true;
  // 展示压缩后的视频
  video.hidden = null;
  // 展示视频提示
  outputTips.hidden = null;
  // 展示下载按钮
  downloadButton.hidden = null;
};

function verifyUpLoader(files) {
  if (!files || files.length === 0) {
    alert("未选择文件!");
    return false;
  } else {
    const { fileExt } = getFileNames(files[0].name);
    if (!fileExt) {
      alert("非法文件类型!");
      return false;
    }
    return true;
  }
}

function handleUploader(event) {
  const files = event.target.files;
  const isVerify = verifyUpLoader(files);
  if (isVerify) {
    const file = files[0];
    const compressTask = document.getElementById("compress-task");
    const videoName = document.getElementById("video-name");
    // 显示视频压缩任务
    compressTask.hidden = null;
    videoName.innerHTML = file.name;
    videoName.title = file.name;
    // 隐藏下载按钮
    document.getElementById("download-button").hidden = true;
    // 显示压缩按钮
    document.getElementById("compress-button").hidden = null;
  }
  return;
}

// 下载视频
async function downloadVideo() {
  // 是否启用多线程
  const isMT = document.getElementById("flexSwitchCheckChecked").checked;
  const ffmpegInstance = await instantiateFFmpeg(isMT);
  if (ffmpegInstance !== null) {
    const { files } = document.getElementById("uploader");
    const { name } = files[0];
    const { outputName, fileExt } = formatNames(name);
    const outputData = await ffmpegInstance.readFile(outputName);
    const blob = new Blob([outputData.buffer], {
      type: `video/${fileExt}`,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    // 调用 URL.revokeObjectURL(url) 来释放创建的 URL 对象
    URL.revokeObjectURL(url);
  }
}

// 点击上传文件
document.getElementById("uploader-btn").addEventListener("click", function () {
  document.getElementById("uploader").click();
});
// 上传视频后的处理
const uploader = document.getElementById("uploader");
uploader.addEventListener("change", handleUploader);
// 点击压缩
const compressButton = document.getElementById("compress-button");
compressButton.addEventListener("click", compress);
// 点击下载
const downloadButton = document.getElementById("download-button");
downloadButton.addEventListener("click", downloadVideo);
