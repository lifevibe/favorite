const axios = require('axios');
const fs = require('fs');
const path = require('path');

// API 配置
const DIRECTUS_API_URL = process.env.DIRECTUS_API_URL;
const DIRECTUS_FILES_URL = process.env.DIRECTUS_FILES_URL;

const WEBSTACK_API_PARAMS = {
  fields: '*,WebCategories.WebCategory_id.*',
  limit: 100,
};

const FILES_API_PARAMS = {
  fields: 'id,filename_disk',
  limit: 100,
};

// 输出文件路径
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'webstack.json');

const STATIC_DIR = path.join(__dirname, '..', 'static');
const STATIC_FILE = path.join(STATIC_DIR, 'webstack.json');

/**
 * 循环从指定的 API 获取所有数据
 * @param {string} apiUrl API 端点 URL
 * @param {object} apiParams API 查询参数
 * @returns {Promise<Array>} 返回一个包含所有数据的 Promise
 */
async function fetchAllData(apiUrl, apiParams) {
  let allData = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    try {
      const response = await axios.get(apiUrl, {
        params: {
          ...apiParams,
          offset: offset,
        },
      });

      const items = response.data.data;

      if (items && items.length > 0) {
        allData = allData.concat(items);
        console.log(`已获取 ${items.length} 条数据，总计 ${allData.length} 条。`);
        offset += apiParams.limit;
      } else {
        hasMore = false;
        console.log('所有数据已获取完毕。');
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('获取数据时发生错误：', error.message);
      hasMore = false;
      return null;
    }
  }

  return allData;
}

/**
 * 将数据保存到 JSON 文件
 * @param {Array} data 要保存的数据
 */
async function saveDataToFile(data) {
  if (!data) {
    console.log('没有数据可以保存。');
    return;
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  if (!fs.existsSync(STATIC_DIR )) {
    fs.mkdirSync(STATIC_DIR , { recursive: true });
  }

  try {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2), 'utf-8');
    fs.writeFileSync(STATIC_FILE , JSON.stringify(data, null, 2), 'utf-8');
    console.log(`数据已成功保存到 ${OUTPUT_FILE} ${STATIC_FILE}`);
  } catch (error) {
    console.error('保存文件时发生错误：', error.message);
  }
}

// 主函数
async function main() {
  console.log('--- 步骤 1: 获取所有文件数据 ---');
  const filesData = await fetchAllData(DIRECTUS_FILES_URL, FILES_API_PARAMS);

  if (!filesData) {
    console.error('无法获取文件数据，终止脚本。');
    return;
  }

  // 构建一个文件 ID 到 filename_disk 的映射
  const filesMap = filesData.reduce((acc, file) => {
    acc[file.id] = file.filename_disk;
    return acc;
  }, {});
  
  console.log('\n--- 步骤 2: 获取 Webstack 数据 ---');
  const webstackData = await fetchAllData(DIRECTUS_API_URL, WEBSTACK_API_PARAMS);

  if (!webstackData) {
    console.error('无法获取 Webstack 数据，终止脚本。');
    return;
  }

  // 遍历 Webstack 数据，处理 logo 字段，并转换 weight 字段
  const processedData = webstackData.map(item => {
    const processedItem = { ...item };
    
    // 替换 logo 字段
    if (processedItem.logo && filesMap[processedItem.logo]) {
      processedItem.logo = filesMap[processedItem.logo];
    }

    // 确保 weight 字段为数字类型
    if (processedItem.weight) {
      // 使用 parseInt() 将字符串转换为整数
      processedItem.weight = parseInt(processedItem.weight, 10);
    }

    // 同样处理 WebCategories 中的 weight
    if (processedItem.WebCategories && processedItem.WebCategories.length > 0) {
      processedItem.WebCategories.forEach(category => {
        if (category.WebCategory_id && category.WebCategory_id.weight) {
          category.WebCategory_id.weight = parseInt(category.WebCategory_id.weight, 10);
        }
      });
    }

    // 同样处理 WebCategories 中的 father_weight
    if (processedItem.WebCategories && processedItem.WebCategories.length > 0) {
      processedItem.WebCategories.forEach(category => {
        if (category.WebCategory_id && category.WebCategory_id.father_weight) {
          category.WebCategory_id.father_weight = parseInt(category.WebCategory_id.father_weight, 10);
        }
      });
    }

    return processedItem;
  });

  await saveDataToFile(processedData);
}

main();