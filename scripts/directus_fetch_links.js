require('dotenv').config({ path: '.env.local' });

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// API 配置
const DIRECTUS_API_URL = process.env.DIRECTUS_API_URL;
const DIRECTUS_ACCESS_TOKEN = process.env.DIRECTUS_ACCESS_TOKEN;
const WEBSTACK_API_PARAMS = {
  fields: '*,logo.*,WebCategories.WebCategory_id.*',
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
        headers: {
          'Authorization': `Bearer ${DIRECTUS_ACCESS_TOKEN}`
        }
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

  // 检查必要的环境变量
  if (!DIRECTUS_API_URL) {
    console.error('错误：未设置 DIRECTUS_API_URL 环境变量');
    return;
  }
  
  // 添加对访问令牌的检查
  if (!DIRECTUS_ACCESS_TOKEN) {
    console.error('错误：未设置 DIRECTUS_ACCESS_TOKEN 环境变量');
    return;
  }

  try {
    new URL(DIRECTUS_API_URL); // 尝试构造 URL 对象来验证格式
  } catch (err) {
    console.error('错误：DIRECTUS_API_URL 不是有效的 URL');
    return;
  }
  console.log('\n--- 获取 Webstack 数据 ---');
  // 为了获取 logo.filename_disk，需要在请求参数中包含 logo 关联字段
  // 注意：WEBSTACK_API_PARAMS 已经包含了 'logo.*'
  const webstackData = await fetchAllData(DIRECTUS_API_URL, WEBSTACK_API_PARAMS);

  if (!webstackData) {
    console.error('无法获取 Webstack 数据，终止脚本。');
    return;
  }

  // 遍历 Webstack 数据，处理 logo 字段，并转换 weight 字段
  const processedData = webstackData.map(item => {
    const processedItem = { ...item };

    // 替换 logo 字段：直接使用 logo.filename_disk 的值
    if (processedItem.logo && typeof processedItem.logo === 'object' && processedItem.logo.filename_disk) {
      processedItem.logo = processedItem.logo.filename_disk;
    }

    // 确保 weight 字段为数字类型
    if (processedItem.weight) {
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