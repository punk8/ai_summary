class PopupManager {
  constructor() {
    this.summarizeBtn = document.getElementById('summarize');
    this.loadingElement = document.getElementById('loading');
    this.resultElement = document.getElementById('result');
    this.summaryElement = document.getElementById('summary');
    
    this.init();
  }

  init() {
    this.summarizeBtn.addEventListener('click', () => this.handleSummarize());
  }

  async handleSummarize() {
    try {
      this.showLoading();
      
      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // 先检查标签页是否可以访问
      if (!tab.url || tab.url.startsWith('chrome://')) {
        throw new Error('无法在此页面使用');
      }

      // 等待一小段时间确保内容脚本已加载
      await new Promise(resolve => setTimeout(resolve, 100));

      // 尝试发送消息
      try {
        const response = await chrome.tabs.sendMessage(tab.id, {
          action: 'extractContent'
        });

        if (!response || !response.success) {
          throw new Error(response?.error || '内容提取失败');
        }

        // 显示提取的内容
        this.showResult(response.data.excerpt || response.data.content.substring(0, 200) + '...');
      } catch (error) {
        // 如果发送消息失败，可能需要重新注入内容脚本
        console.error('First attempt failed, trying to reinject content script...');
        
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: [
            'lib/readability.js',
            'src/content/extractors/generalExtractor.js',
            'src/content/extractors/youtubeExtractor.js',
            'src/content/contentScript.js'
          ]
        });

        // 再次等待一小段时间
        await new Promise(resolve => setTimeout(resolve, 100));

        // 重试发送消息
        const retryResponse = await chrome.tabs.sendMessage(tab.id, {
          action: 'extractContent'
        });

        if (!retryResponse || !retryResponse.success) {
          throw new Error(retryResponse?.error || '内容提取失败');
        }

        this.showResult(retryResponse.data.excerpt || retryResponse.data.content.substring(0, 200) + '...');
      }
      
    } catch (error) {
      this.showError(error.message);
    } finally {
      this.hideLoading();
    }
  }

  showLoading() {
    this.summarizeBtn.disabled = true;
    this.loadingElement.classList.remove('hidden');
    this.resultElement.classList.add('hidden');
  }

  hideLoading() {
    this.summarizeBtn.disabled = false;
    this.loadingElement.classList.add('hidden');
  }

  showResult(summary) {
    this.summaryElement.textContent = summary;
    this.resultElement.classList.remove('hidden');
  }

  showError(message) {
    this.summaryElement.textContent = `错误：${message}`;
    this.resultElement.classList.remove('hidden');
  }
}

// 初始化弹出窗口管理器
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
}); 