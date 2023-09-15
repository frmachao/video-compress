import { FFmpeg } from "./public/ffmpeg/package/dist/esm/index.js";
import { fetchFile } from "./public/util/package/dist/esm/index.js";
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
      ? "/public/core-mt/package/dist/esm/ffmpeg-core.js"
      : "/public/core/package/dist/esm/ffmpeg-core.js";

    compressBar.style.width = "70%";
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
  const { outputName, extensionName } = formatNames(name);
  // fetchFile 获取数据的方法 ffmpegInstance.writeFile 函数将上传的文件写入FFmpeg的虚拟文件系统中
  await ffmpegInstance.writeFile(name, await fetchFile(files[0]));
  await ffmpegInstance.exec(["-i", name, "-s", compressConfig, outputName]);
  // 移除进度条动画效果
  compressBar.classList.remove("progress-bar-animated");
  // 将转码后的视频文件的URL设置为<video>元素的src属性，以便在页面上播放。
  const data = await ffmpegInstance.readFile(outputName);
  const video = document.getElementById("output-video");
  video.src = URL.createObjectURL(
    new Blob([data.buffer], { type: `video/${extensionName}` })
  );
  taskSpinner.hidden = true;
  video.hidden = null;
  // 展示下载按钮
  downloadButton.hidden = null;
};

function verifyUpLoader(files) {
  if (!files || files.length === 0) {
    alert("未选择文件!");
    return false;
  } else {
    const file = files[0];
    const allowedExtensions = [".mp4", ".ogg", ".webm"];
    const fileExtension = file.name
      .substring(file.name.lastIndexOf("."))
      .toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      alert("非法文件类型!");
      return false;
    }
    // if (file.size > 1024 * 1024 * 1024) {
    //   console.error("文件大小超过 1GB!");
    //   return false;
    // }
    return true;
  }
}

function formatNames(name) {
  const getFileExtension = (fileName) => {
    const lastDotIndex = fileName.lastIndexOf(".");
    if (lastDotIndex === -1 || lastDotIndex === 0) {
      // 未找到点或点出现在文件名的开头，没有有效的扩展名
      return "";
    }
    const fileExt = fileName.slice(lastDotIndex + 1).toLowerCase();
    return fileExt;
  };
  const outputName = `output-${name}`;
  const extensionName = getFileExtension(name);
  return { outputName, extensionName };
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
    const { outputName, extensionName } = formatNames(name);
    const outputData = await ffmpegInstance.readFile(outputName);
    const blob = new Blob([outputData.buffer], {
      type: `video/${extensionName}`,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = outputName;
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
