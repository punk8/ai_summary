// 确保 AISummary 已经加载
if (typeof AISummary === 'undefined') {
  throw new Error('AISummary namespace is not loaded');
}

class OpenAIAdapter extends AISummary.BaseModelAdapter {
  static API_URL = 'https://api.openai.com/v1/chat/completions';
  
  async makeRequest(url, data) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(data),
      signal: data.signal
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || '请求失败');
    }

    return await response.json();
  }

  async summarize(content, { language = 'zh-CN', maxLength = 500, signal } = {}) {
    console.log('OpenAI summarize called with:', { language, maxLength });
    
    const data = {
      model: this.options.model || 'gpt-3.5-turbo',
      messages: [
        {
          role: "system",
          content: `你是一个文章总结助手。请用${language}简洁地总结以下内容，突出重点。
总结要求：
1. 使用 Markdown 格式
2. 总字数限制在${maxLength}字以内
3. 包含以下部分：
   - 主要观点（用引用格式）
   - 关键要点（用列表）
   - 详细解释（用小标题和段落）
4. 适当使用 Markdown 语法增强可读性`
        },
        {
          role: "user",
          content: content
        }
      ],
      signal
    };

    const response = await this.makeRequest(OpenAIAdapter.API_URL, data);
    return response.choices[0].message.content;
  }
}

// 注册适配器
AISummary.ModelFactory.registerAdapter('openai', OpenAIAdapter); 