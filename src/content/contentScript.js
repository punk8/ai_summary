class ContentProcessor {
  static async init() {
    // 立即注册消息监听器
    if (window.contentProcessorInitialized) {
      return;
    }

    window.contentProcessorInitialized = true;
    
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'extractContent') {
        // 使用 Promise 包装异步操作
        this.handleContentExtraction()
          .then(response => sendResponse(response))
          .catch(error => sendResponse({
            success: false,
            error: error.message
          }));
        return true; // 保持消息通道开启
      }
    });

    // 向 background 发送就绪消息
    try {
      chrome.runtime.sendMessage({ action: 'contentScriptReady' });
    } catch (e) {
      console.log('Content script ready notification failed', e);
    }
  }

  static async handleContentExtraction() {
    try {
      // 检查是否是 YouTube 页面
      if (window.location.hostname.includes('youtube.com')) {
        return await YouTubeExtractor.extract();
      } else {
        // 使用通用提取器
        return await GeneralExtractor.extract();
      }
    } catch (error) {
      console.error('Content extraction failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// 确保 DOM 加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ContentProcessor.init());
} else {
  ContentProcessor.init();
} 