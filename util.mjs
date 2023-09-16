function getFileNames(name = "") {
  const lastDotIndex = name.lastIndexOf(".");
  if (lastDotIndex === -1 || lastDotIndex === 0) {
    // 未找到点或点出现在文件名的开头，没有有效的扩展名
    return {};
  }
  const fileExt = name.slice(lastDotIndex + 1).toLowerCase();
  const fileName = name.slice(0, lastDotIndex);
  return { fileExt, fileName };
}

function formatNames(name = "") {
  const { fileExt, fileName } = getFileNames(name);
  const outputName = `output-${name}`;
  return { outputName, fileExt, fileName };
}

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

export { getFileNames, formatNames, verifyUpLoader };
