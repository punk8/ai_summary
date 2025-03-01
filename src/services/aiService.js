class AiService {
  static API_URL = 'https://api.openai.com/v1/chat/completions';
  
  static async summarize(content, options = {}) {
    const {
      maxLength = 500,
      language = 'zh-CN',
      apiKey = '' // 从配置中获取
    } = options;

    if (!apiKey) {
      throw new Error('请先配置 API Key');
    }

    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
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
        })
      });

      if (!response.ok) {
        throw new Error('AI API 请求失败');
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('AI summarization failed:', error);
      throw error;
    }
  }
} 