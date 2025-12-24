import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function processSvg(svgPath) {
  console.log(`Processing: ${svgPath}`);

  const svgContent = fs.readFileSync(svgPath, 'utf-8');

  // 提取 base64 JPEG 数据
  const base64Match = svgContent.match(/data:image\/jpeg;base64,([A-Za-z0-9+/=]+)/);
  if (!base64Match) {
    console.log('No base64 JPEG found');
    return;
  }

  const base64Data = base64Match[1];
  const imageBuffer = Buffer.from(base64Data, 'base64');

  console.log(`Found image, size: ${imageBuffer.length} bytes`);

  // 使用 sharp 处理图片 - 将白色/近白色转为透明
  const processedBuffer = await sharp(imageBuffer)
    .ensureAlpha()  // 确保有 alpha 通道
    .raw()  // 获取原始像素数据
    .toBuffer({ resolveWithObject: true });

  const { data, info } = processedBuffer;
  const { width, height, channels } = info;

  console.log(`Image dimensions: ${width}x${height}, channels: ${channels}`);

  // 遍历每个像素，将白色/近白色转为透明
  const threshold = 250;  // 接近白色的阈值
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // 如果是白色或接近白色，设为透明
    if (r >= threshold && g >= threshold && b >= threshold) {
      data[i + 3] = 0;  // 设置 alpha 为 0（透明）
    }
  }

  // 转换回 PNG（支持透明度）
  const pngBuffer = await sharp(data, {
    raw: {
      width,
      height,
      channels
    }
  })
    .png()
    .toBuffer();

  console.log(`PNG output size: ${pngBuffer.length} bytes`);

  // 转为 base64
  const pngBase64 = pngBuffer.toString('base64');

  // 替换 SVG 中的内容
  let newSvgContent = svgContent.replace(
    /data:image\/jpeg;base64,[A-Za-z0-9+/=]+/,
    `data:image/png;base64,${pngBase64}`
  );

  // 保存新文件
  fs.writeFileSync(svgPath, newSvgContent);
  console.log(`Saved: ${svgPath}`);
}

// 处理单个文件测试
const testFile = process.argv[2] || '/Users/leikai/Desktop/child/assets/充实.svg';
processSvg(testFile);
