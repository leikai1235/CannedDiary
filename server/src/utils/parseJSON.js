// 健壮的 JSON 解析函数，处理 LLM 返回的各种格式问题
export function parseJSONResponse(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('响应内容为空或格式错误');
  }

  let trimmed = text.trim();

  // 0. 预处理：将中文引号替换为转义的 ASCII 双引号
  // 中文左双引号 " (U+201C) 和右双引号 " (U+201D)
  trimmed = trimmed.replace(/[""]/g, '\\"');

  // 1. 先尝试直接解析（理想情况）
  try {
    return JSON.parse(trimmed);
  } catch (directError) {
    console.log('[JSON Parse] 直接解析失败，尝试修复...');
  }

  // 2. 尝试修复字符串值中未转义的 ASCII 双引号
  let fixed = trimmed;
  try {
    let inString = false;
    let escapeNext = false;
    let result = '';

    for (let i = 0; i < trimmed.length; i++) {
      const char = trimmed[i];
      const charCode = char.charCodeAt(0);

      if (escapeNext) {
        result += char;
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        result += char;
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        if (inString) {
          // 在字符串值内，检查这个引号是否是字符串结束
          // 查看后面的字符（跳过所有空白字符，包括换行符！）
          let lookAhead = i + 1;
          while (lookAhead < trimmed.length && /\s/.test(trimmed[lookAhead])) {
            lookAhead++;
          }

          const nextNonSpace = lookAhead < trimmed.length ? trimmed[lookAhead] : '';

          // 如果后面跟着逗号、}、]，说明是字符串结束
          // 注意：不包括冒号，因为冒号前面应该是键名，不是值
          if (nextNonSpace === ',' || nextNonSpace === '}' || nextNonSpace === ']') {
            inString = false;
            result += char;
          } else if (nextNonSpace === '"') {
            // 如果后面紧跟另一个引号，当前引号是字符串结束
            // 这处理 "value"" 这种多余引号的情况
            inString = false;
            result += char;
          } else {
            // 字符串值内的引号，需要转义
            result += '\\"';
          }
        } else {
          // 不在字符串内，检查是否是字符串开始
          // 查看前面的字符（跳过所有空白字符）
          let lookBack = i - 1;
          while (lookBack >= 0 && /\s/.test(trimmed[lookBack])) {
            lookBack--;
          }

          const prevNonSpace = lookBack >= 0 ? trimmed[lookBack] : '';

          // 如果前面是冒号、逗号、[、{，说明是字符串开始
          if (prevNonSpace === ':' || prevNonSpace === ',' || prevNonSpace === '[' || prevNonSpace === '{') {
            inString = true;
            result += char;
          } else if (prevNonSpace === '"') {
            // 如果前面是引号，这可能是多余的引号，跳过
            // 这处理 ""value" 这种情况
            continue;
          } else {
            result += char;
          }
        }
      } else {
        // 处理控制字符：在字符串值内，将未转义的控制字符转义
        if (inString && charCode < 32 && charCode !== 9) {
          if (charCode === 10) {
            result += '\\n';
          } else if (charCode === 13) {
            result += '\\r';
          } else {
            result += '\\u' + ('0000' + charCode.toString(16)).slice(-4);
          }
        } else {
          result += char;
        }
      }
    }

    fixed = result;
  } catch (e) {
    console.warn('[JSON Parse] 修复过程出错:', e.message);
    fixed = trimmed;
  }

  // 3. 尝试解析修复后的版本
  try {
    const parsed = JSON.parse(fixed);
    console.log('[JSON Parse] ✅ 成功修复并解析 JSON');
    return parsed;
  } catch (e) {
    console.warn('[JSON Parse] 修复后仍无法解析:', e.message);
  }

  // 4. 尝试从 markdown 代码块中提取 JSON
  const codeBlockMatch = text.trim().match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch (e) {
      // 继续尝试
    }
  }

  // 5. 尝试提取第一个完整的 JSON 对象
  const jsonMatch = text.trim().match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      // 对提取的 JSON 也尝试修复中文引号
      try {
        const fixedExtract = jsonMatch[0].replace(/[""]/g, '\\"');
        return JSON.parse(fixedExtract);
      } catch (e2) {
        // 继续尝试
      }
    }
  }

  // 6. 所有方法都失败
  console.error('[JSON Parse Error] 无法解析响应为 JSON');
  console.error('[原始响应]', text.trim().substring(0, 500));
  throw new Error(`LLM 返回的响应不是有效的 JSON 格式。响应长度: ${text.trim().length} 字符`);
}
