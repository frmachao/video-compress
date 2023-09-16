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
export { getFileNames, formatNames };
