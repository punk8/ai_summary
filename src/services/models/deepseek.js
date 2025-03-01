// 确保 AISummary 已经加载
if (typeof AISummary === 'undefined') {
  throw new Error('AISummary namespace is not loaded');
}

class DeepSeekAdapter extends AISummary.BaseModelAdapter {
  static API_URL = 'https://api.deepseek.com/v1/chat/completions';
  
  async summarize(content, { language = 'zh-CN', maxLength = 500 } = {}) {
    console.log('DeepSeek summarize called with:', { language, maxLength });
    
    const data = {
      model: this.options.model || 'deepseek-chat',
      messages: [
        {
          role: "system",
          content: `你是一个文章总结助手。请用${language}简洁地总结以下内容，突出重点。
总结要求：
1. 使用 Markdown 格式
2. 总字数限制在${maxLength}字以内
3. 包含以下部分：
   - 主要观点（用引用格式 > ）
   - 关键要点（用列表 - ）
   - 详细解释（用小标题 ## 和段落）
4. 适当使用 Markdown 语法增强可读性
5. 如果有代码示例，使用代码块 \`\`\` 包裹`
        },
        {
          role: "user",
          content: content
        }
      ]
    };

    const response = await this.makeRequest(DeepSeekAdapter.API_URL, data);
    return response.choices[0].message.content;
  }
}

// 注册适配器
AISummary.ModelFactory.registerAdapter('deepseek', DeepSeekAdapter);

console.log('DeepSeek adapter registered'); 