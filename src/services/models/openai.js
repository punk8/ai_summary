// 确保 AISummary 已经加载
if (typeof AISummary === 'undefined') {
  throw new Error('AISummary namespace is not loaded');
}

class OpenAIAdapter extends AISummary.BaseModelAdapter {
  static API_URL = 'https://api.openai.com/v1/chat/completions';
  
  async summarize(content, { language = 'zh-CN', maxLength = 500 } = {}) {
    console.log('OpenAI summarize called with:', { language, maxLength });
    
    const data = {
      model: this.options.model || 'gpt-3.5-turbo',
      messages: [
        {
          role: "system",
          content: `你是一个文章总结助手。请用${language}简洁地总结以下内容，突出重点。总结字数限制在${maxLength}字以内。`
        },
        {
          role: "user",
          content: content
        }
      ]
    };

    const response = await this.makeRequest(OpenAIAdapter.API_URL, data);
    return response.choices[0].message.content;
  }
}

// 注册适配器
AISummary.ModelFactory.registerAdapter('openai', OpenAIAdapter); 