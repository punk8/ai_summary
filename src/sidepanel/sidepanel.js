// 确保 AISummary 已经加载
if (typeof AISummary === 'undefined') {
  throw new Error('AISummary namespace is not loaded');
}

class SidePanelManager {
  constructor() {
    this.summarizeBtn = document.getElementById('summarize');
    this.cancelBtn = document.getElementById('cancel');
    this.loadingElement = document.getElementById('loading');
    this.resultElement = document.getElementById('result');
    this.summaryElement = document.getElementById('summary');
    this.copyBtn = document.getElementById('copy');
    this.shareBtn = document.getElementById('share');
    this.translateBtn = document.getElementById('translate');
    this.settingsBtn = document.getElementById('settings');
    
    // 添加取消请求的控制器
    this.abortController = null;
    this.isProcessing = false;
    
    this.toastContainer = document.getElementById('toast-container');
    
    this.init();
  }

  init() {
    console.log('SidePanelManager initializing...');
    this.summarizeBtn.addEventListener('click', () => this.handleSummarize());
    this.cancelBtn.addEventListener('click', () => this.handleCancel());
    this.copyBtn.addEventListener('click', () => this.handleCopy());
    this.shareBtn.addEventListener('click', () => this.handleShare());
    this.translateBtn.addEventListener('click', () => this.handleTranslate());
    this.settingsBtn.addEventListener('click', () => this.handleSettings());
  }

  async handleSummarize() {
    try {
      if (this.isProcessing) return;
      this.isProcessing = true;
      
      console.log('Starting summarization...');
      
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

      const apiKey = settings.modelType === 'openai' ? settings.openaiKey : settings.deepseekKey;
      if (!apiKey) {
        throw new Error('请先在设置中配置 API Key');
      }

      // 创建新的 AbortController
      this.abortController = new AbortController();
      this.showLoading();

      const content = await this.extractContent(tab);
      
      // 检查是否已经取消
      if (this.abortController === null) {
        throw new Error('已取消总结');
      }

      const summary = await AISummary.AiService.summarize(content.data.content, {
        modelType: settings.modelType,
        apiKey: apiKey,
        model: settings.modelType === 'openai' ? settings.openaiModel : settings.deepseekModel,
        language: settings.language || 'zh-CN',
        signal: this.abortController.signal
      });

      // 再次检查是否已经取消
      if (this.abortController === null) {
        throw new Error('已取消总结');
      }

      this.showResult(summary);
      
    } catch (error) {
      if (error.name === 'AbortError' || error.message === '已取消总结') {
        console.log('Summary cancelled by user');
        this.showError('已取消总结');
      } else {
        console.error('Summarization error:', error);
        this.showError(error.message);
      }
    } finally {
      this.isProcessing = false;
      this.abortController = null;
      this.hideLoading();
    }
  }

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
      this.showToast('复制成功', 'success');
    } catch (error) {
      console.error('Copy failed:', error);
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

  handleCancel() {
    console.log('Cancelling summary...');
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
      this.isProcessing = false;
      this.hideLoading();
      this.showError('已取消总结');
    }
  }

  showLoading() {
    this.summarizeBtn.disabled = true;
    this.summarizeBtn.style.opacity = '0';
    this.cancelBtn.classList.remove('hidden');
    setTimeout(() => {
      this.cancelBtn.classList.add('visible');
    }, 10);
    this.loadingElement.classList.remove('hidden');
    this.resultElement.classList.add('hidden');
  }

  hideLoading() {
    this.summarizeBtn.disabled = false;
    this.summarizeBtn.style.opacity = '1';
    this.cancelBtn.classList.remove('visible');
    setTimeout(() => {
      this.cancelBtn.classList.add('hidden');
    }, 300);
    this.loadingElement.classList.add('hidden');
  }

  showResult(summary) {
    // 配置 marked 选项
    marked.setOptions({
      gfm: true, // 启用 GitHub 风格的 Markdown
      breaks: true, // 允许回车换行
      sanitize: true, // 消毒 HTML 标签
      smartLists: true, // 优化列表输出
      smartypants: true // 优化标点符号
    });

    // 将文本转换为 Markdown HTML
    const htmlContent = marked.parse(summary);
    
    // 添加 markdown-body 类并设置 HTML 内容
    this.summaryElement.className = 'summary markdown-body';
    this.summaryElement.innerHTML = htmlContent;
    
    this.resultElement.classList.remove('hidden');
  }

  showError(message) {
    this.hideLoading(); // 先隐藏加载状态和取消按钮
    this.summaryElement.innerHTML = `
      <div class="error-message">
        <span class="error-icon">⚠️</span>
        <span>${message}</span>
      </div>
    `;
    this.resultElement.classList.remove('hidden');
  }

  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // 添加图标
    const icon = type === 'success' 
      ? '<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>'
      : '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>';
    
    toast.innerHTML = `
      ${icon}
      <span>${message}</span>
    `;
    
    this.toastContainer.appendChild(toast);
    
    // 触发重排以启动动画
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    // 2秒后移除 toast
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        this.toastContainer.removeChild(toast);
      }, 300);
    }, 2000);
  }
}

// 初始化侧边栏管理器
document.addEventListener('DOMContentLoaded', () => {
  console.log('Sidepanel DOM loaded');
  new SidePanelManager();
}); 