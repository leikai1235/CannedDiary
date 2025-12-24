import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_BASE = 'http://localhost:7001';

const categories = ['literature', 'poetry', 'quote', 'news', 'encyclopedia'];
const gradeLevels = ['lower', 'middle', 'upper'];

async function fetchMaterials(category, gradeLevel) {
  const url = `${API_BASE}/api/materials?category=${category}&gradeLevel=${gradeLevel}&page=1&pageSize=20`;
  console.log(`Fetching: ${category}-${gradeLevel}...`);

  const response = await fetch(url);
  const data = await response.json();

  if (data.success) {
    console.log(`  ✓ Got ${data.data.materials.length} materials`);
    return data.data.materials;
  } else {
    console.error(`  ✗ Failed: ${data.error}`);
    return [];
  }
}

async function main() {
  // 创建输出目录
  const outputDir = path.join(__dirname, '../../data/materials');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const allData = {};

  for (const category of categories) {
    allData[category] = {};

    for (const gradeLevel of gradeLevels) {
      try {
        const materials = await fetchMaterials(category, gradeLevel);
        allData[category][gradeLevel] = materials;

        // 保存单独的文件
        const filename = `${category}-${gradeLevel}.json`;
        const filepath = path.join(outputDir, filename);
        fs.writeFileSync(filepath, JSON.stringify(materials, null, 2), 'utf-8');
        console.log(`  Saved: ${filename}`);

        // 稍微延迟，避免请求过快
        await new Promise(r => setTimeout(r, 1000));
      } catch (error) {
        console.error(`  Error fetching ${category}-${gradeLevel}:`, error.message);
      }
    }
  }

  // 保存汇总文件
  const summaryPath = path.join(outputDir, 'all-materials.json');
  fs.writeFileSync(summaryPath, JSON.stringify(allData, null, 2), 'utf-8');
  console.log(`\n✓ All data saved to ${outputDir}`);
}

main().catch(console.error);
