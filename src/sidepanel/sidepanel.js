// 确保 AISummary 已经加载
if (typeof AISummary === 'undefined') {
  throw new Error('AISummary namespace is not loaded');
}

class SidePanelManager {
  constructor() {
    this.summarizeBtn = document.getElementById('summarize');
    this.loadingElement = document.getElementById('loading');
    this.resultElement = document.getElementById('result');
    this.summaryElement = document.getElementById('summary');
    this.copyBtn = document.getElementById('copy');
    this.shareBtn = document.getElementById('share');
    this.translateBtn = document.getElementById('translate');
    this.settingsBtn = document.getElementById('settings');
    
    this.init();
  }

  init() {
    console.log('SidePanelManager initializing...');
    this.summarizeBtn.addEventListener('click', () => this.handleSummarize());
    this.copyBtn.addEventListener('click', () => this.handleCopy());
    this.shareBtn.addEventListener('click', () => this.handleShare());
    this.translateBtn.addEventListener('click', () => this.handleTranslate());
    this.settingsBtn.addEventListener('click', () => this.handleSettings());
  }

  // 复用 PopupManager 中的大部分方法，但做一些适应性修改
  async handleSummarize() {
    try {
      console.log('Starting summarization...');
      this.showLoading();
      
      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url || tab.url.startsWith('chrome://')) {
        throw new Error('无法在此页面使用');
      }

      const settings = await chrome.storage.sync.get([
        'modelType',
        'openaiKey',
        'deepseekKey',
        'openaiModel',
        'deepseekModel',
        'language'
      ]);

      console.log('Settings loaded:', settings);

      const apiKey = settings.modelType === 'openai' ? settings.openaiKey : settings.deepseekKey;
      if (!apiKey) {
        throw new Error('请先在设置中配置 API Key');
      }

      console.log('Extracting content from page...');
      const content = await this.extractContent(tab);
      console.log('Content extracted:', content);

      const summary = await AISummary.AiService.summarize(content.data.content, {
        modelType: settings.modelType,
        apiKey: apiKey,
        model: settings.modelType === 'openai' ? settings.openaiModel : settings.deepseekModel,
        language: settings.language || 'zh-CN'
      });

      console.log('Summary generated:', summary);
      this.showResult(summary);
      
    } catch (error) {
      console.error('Summarization error:', error);
      this.showError(error.message);
    } finally {
      this.hideLoading();
    }
  }

  // 其他方法与 PopupManager 相同，只需复制过来
  async extractContent(tab) {
    try {
      console.log('Injecting content scripts...');
      
      // 注入 Readability 库
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['lib/readability.js']
      });

      // 执行内容提取
      console.log('Extracting content...');
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          try {
            let documentClone = document.cloneNode(true);
            let article = new Readability(documentClone).parse();
            
            return {
              success: true,
              data: {
                title: article.title,
                content: article.textContent,
                excerpt: article.excerpt,
                length: article.textContent.length
              }
            };
          } catch (error) {
            console.error('Content extraction error:', error);
            return {
              success: false,
              error: error.message
            };
          }
        }
      });

      console.log('Content extracted:', result);

      if (!result || !result.success) {
        throw new Error(result?.error || '内容提取失败');
      }

      return result;
    } catch (error) {
      console.error('Content extraction failed:', error);
      throw new Error(`内容提取失败: ${error.message}`);
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
      const settings = await chrome.storage.sync.get(['modelType', 'openaiKey', 'deepseekKey']);
      
      const apiKey = settings.modelType === 'openai' ? settings.openaiKey : settings.deepseekKey;
      if (!apiKey) {
        throw new Error('请先在设置中配置 API Key');
      }

      this.translateBtn.disabled = true;
      
      const translated = await AISummary.AiService.summarize(text, {
        modelType: settings.modelType,
        apiKey: apiKey,
        language: 'en',
        maxLength: text.length
      });

      this.showResult(translated);
    } catch (error) {
      this.showToast(error.message, 'error');
    } finally {
      this.translateBtn.disabled = false;
    }
  }

  handleSettings() {
    chrome.runtime.openOptionsPage();
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
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 2000);
  }
}

// 初始化侧边栏管理器
document.addEventListener('DOMContentLoaded', () => {
  console.log('Sidepanel DOM loaded');
  new SidePanelManager();
}); 