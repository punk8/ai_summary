class GeneralExtractor {
  static async extract() {
    try {
      // 基础元数据提取
      const metadata = this.getMetadata();
      
      // 主要内容提取
      const mainContent = await this.getMainContent();
      
      return {
        success: true,
        data: {
          ...metadata,
          ...mainContent
        }
      };
    } catch (error) {
      console.error('Content extraction failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static getMetadata() {
    return {
      url: window.location.href,
      title: document.title,
      language: document.documentElement.lang || 'en',
      timestamp: new Date().toISOString()
    };
  }

  static async getMainContent() {
    // 创建文档克隆
    const documentClone = document.cloneNode(true);
    
    // 等待 Readability 加载
    if (typeof Readability === 'undefined') {
      throw new Error('Readability 库未加载');
    }

    try {
      // 使用 Readability 解析
      const reader = new Readability(documentClone);
      const article = reader.parse();

      if (!article) {
        throw new Error('无法提取页面内容');
      }

      return {
        title: article.title,
        content: article.textContent,
        excerpt: article.excerpt,
        siteName: article.siteName
      };
    } catch (error) {
      console.error('Readability parsing failed:', error);
      
      // 降级方案：直接提取 body 文本
      return {
        title: document.title,
        content: document.body.innerText,
        excerpt: document.body.innerText.substring(0, 200),
        siteName: window.location.hostname
      };
    }
  }
} 