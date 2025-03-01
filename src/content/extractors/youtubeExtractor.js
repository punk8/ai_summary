class YouTubeExtractor {
  static async extract() {
    try {
      if (!this.isYouTubePage()) {
        throw new Error('不是YouTube页面');
      }

      const metadata = this.getMetadata();
      const captions = await this.getCaptions();

      return {
        success: true,
        data: {
          ...metadata,
          captions
        }
      };
    } catch (error) {
      console.error('YouTube content extraction failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static isYouTubePage() {
    return window.location.hostname.includes('youtube.com') && 
           window.location.pathname.includes('/watch');
  }

  static getMetadata() {
    return {
      url: window.location.href,
      title: document.title,
      videoId: new URLSearchParams(window.location.search).get('v'),
      timestamp: new Date().toISOString()
    };
  }

  static async getCaptions() {
    // 目前返回简单的视频描述
    const description = document.querySelector('#description-text')?.textContent || '';
    return {
      description,
      // TODO: 后续添加字幕提取功能
      transcripts: []
    };
  }
} 