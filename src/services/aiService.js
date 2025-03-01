class AiService {
  static async summarize(content, options = {}) {
    const {
      modelType = 'openai',
      apiKey,
      maxLength = 500,
      language = 'zh-CN',
      ...modelOptions
    } = options;

    console.log('AiService.summarize called with:', {
      modelType,
      maxLength,
      language,
      modelOptions
    });

    if (!apiKey) {
      throw new Error('请先配置 API Key');
    }

    try {
      const adapter = AISummary.ModelFactory.createAdapter(modelType, apiKey, modelOptions);
      const result = await adapter.summarize(content, { language, maxLength });
      console.log('Summarization result:', result);
      return result;
    } catch (error) {
      console.error('Summarization failed:', error);
      throw error;
    }
  }

  static async translate(content, options = {}) {
    const {
      modelType = 'openai',
      apiKey,
      targetLanguage = 'en',
      ...modelOptions
    } = options;

    if (!apiKey) {
      throw new Error('请先配置 API Key');
    }

    try {
      const adapter = ModelFactory.createAdapter(modelType, apiKey, modelOptions);
      return await adapter.translate(content, targetLanguage);
    } catch (error) {
      console.error('Translation failed:', error);
      throw error;
    }
  }
}

// 添加到全局命名空间
window.AISummary.AiService = AiService; 