// 确保 AISummary 已经加载
if (typeof AISummary === 'undefined') {
  throw new Error('AISummary namespace is not loaded');
}

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
    console.log('PopupManager initializing...');
    this.summarizeBtn.addEventListener('click', () => this.handleSummarize());
    this.copyBtn.addEventListener('click', () => this.handleCopy());
    this.shareBtn.addEventListener('click', () => this.handleShare());
    this.translateBtn.addEventListener('click', () => this.handleTranslate());
  }

  async handleSummarize() {
    try {
      console.log('Starting summarization...');
      this.showLoading();
      
      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // 检查页面是否可访问
      if (!tab.url || tab.url.startsWith('chrome://')) {
        throw new Error('无法在此页面使用');
      }

      // 获取存储的设置
      const settings = await chrome.storage.sync.get([
        'modelType',
        'openaiKey',
        'deepseekKey',
        'openaiModel',
        'deepseekModel',
        'language'
      ]);

      console.log('Settings loaded:', settings);

      // 根据选择的模型类型获取对应的 API Key
      const apiKey = settings.modelType === 'openai' ? settings.openaiKey : settings.deepseekKey;
      if (!apiKey) {
        throw new Error('请先在设置中配置 API Key');
      }

      // 提取页面内容
      console.log('Extracting content from page...');
      const content = await this.extractContent(tab);
      console.log('Content extracted:', content);

      // 调用 AI 服务进行总结
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

  async extractContent(tab) {
    try {
      console.log('Injecting content scripts...');
      
      // 注入所有必要的脚本
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          // 创建一个全局的内容提取器对象
          window.contentExtractor = {
            extract: function() {
              // 使用 Readability 提取内容
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
            }
          };
        }
      });

      // 执行内容提取
      console.log('Extracting content...');
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          return window.contentExtractor.extract();
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

// 初始化弹出窗口管理器
document.addEventListener('DOMContentLoaded', () => {
  console.log('Popup DOM loaded');
  new PopupManager();
}); 