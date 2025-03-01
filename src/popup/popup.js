class PopupManager {
  constructor() {
    this.summarizeBtn = document.getElementById('summarize');
    this.loadingElement = document.getElementById('loading');
    this.resultElement = document.getElementById('result');
    this.summaryElement = document.getElementById('summary');
    this.copyBtn = document.getElementById('copy');
    this.shareBtn = document.getElementById('share');
    this.translateBtn = document.getElementById('translate');
    
    this.init();
  }

  init() {
    this.summarizeBtn.addEventListener('click', () => this.handleSummarize());
    this.copyBtn.addEventListener('click', () => this.handleCopy());
    this.shareBtn.addEventListener('click', () => this.handleShare());
    this.translateBtn.addEventListener('click', () => this.handleTranslate());
  }

  async handleSummarize() {
    try {
      this.showLoading();
      
      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // 检查页面是否可访问
      if (!tab.url || tab.url.startsWith('chrome://')) {
        throw new Error('无法在此页面使用');
      }

      // 获取存储的设置
      const settings = await chrome.storage.sync.get(['apiKey', 'language']);
      if (!settings.apiKey) {
        throw new Error('请先在设置中配置 API Key');
      }

      // 提取页面内容
      const content = await this.extractContent(tab);
      
      // 调用 AI 服务进行总结
      const summary = await AiService.summarize(content.data.content, {
        apiKey: settings.apiKey,
        language: settings.language || 'zh-CN'
      });

      this.showResult(summary);
      
    } catch (error) {
      this.showError(error.message);
    } finally {
      this.hideLoading();
    }
  }

  async extractContent(tab) {
    try {
      // 注入内容脚本
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [
          'lib/readability.js',
          'src/content/extractors/generalExtractor.js',
          'src/content/extractors/youtubeExtractor.js',
          'src/content/contentScript.js'
        ]
      });

      // 等待内容脚本加载
      await new Promise(resolve => setTimeout(resolve, 100));

      // 提取内容
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'extractContent'
      });

      if (!response || !response.success) {
        throw new Error(response?.error || '内容提取失败');
      }

      return response;
    } catch (error) {
      console.error('Content extraction failed:', error);
      throw error;
    }
  }

  async handleCopy() {
    try {
      const text = this.summaryElement.textContent;
      await navigator.clipboard.writeText(text);
      this.showToast('已复制到剪贴板');
    } catch (error) {
      this.showToast('复制失败', 'error');
    }
  }

  async handleShare() {
    try {
      const text = this.summaryElement.textContent;
      if (navigator.share) {
        await navigator.share({
          title: '内容总结',
          text: text
        });
      } else {
        throw new Error('您的浏览器不支持分享功能');
      }
    } catch (error) {
      this.showToast(error.message, 'error');
    }
  }

  async handleTranslate() {
    try {
      const text = this.summaryElement.textContent;
      const settings = await chrome.storage.sync.get(['apiKey']);
      
      if (!settings.apiKey) {
        throw new Error('请先在设置中配置 API Key');
      }

      this.translateBtn.disabled = true;
      
      // 调用 AI 服务进行翻译
      const translated = await AiService.summarize(text, {
        apiKey: settings.apiKey,
        language: 'en', // 默认翻译为英文
        maxLength: text.length
      });

      this.showResult(translated);
    } catch (error) {
      this.showToast(error.message, 'error');
    } finally {
      this.translateBtn.disabled = false;
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

  showToast(message, type = 'success') {
    // 创建 toast 元素
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // 2秒后移除
    setTimeout(() => {
      toast.remove();
    }, 2000);
  }
}

// 初始化弹出窗口管理器
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
}); 