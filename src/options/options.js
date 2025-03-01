// 确保 AISummary 已经加载
if (typeof AISummary === 'undefined') {
  throw new Error('AISummary namespace is not loaded');
}

class OptionsManager {
  constructor() {
    this.elements = {
      modelType: document.getElementById('modelType'),
      modelSettings: document.getElementById('modelSettings'),
      language: document.getElementById('language'),
      saveButton: document.getElementById('save'),
      status: document.getElementById('status')
    };

    this.modelConfigs = {
      openai: {
        name: 'OpenAI',
        fields: [
          {
            type: 'password',
            id: 'openaiKey',
            label: 'API Key',
            placeholder: 'sk-...'
          },
          {
            type: 'select',
            id: 'openaiModel',
            label: '模型',
            options: [
              { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
              { value: 'gpt-4', label: 'GPT-4' }
            ]
          }
        ]
      },
      deepseek: {
        name: 'DeepSeek',
        fields: [
          {
            type: 'password',
            id: 'deepseekKey',
            label: 'API Key',
            placeholder: '输入 DeepSeek API Key'
          },
          {
            type: 'select',
            id: 'deepseekModel',
            label: '模型',
            options: [
              { value: 'deepseek-chat', label: 'DeepSeek Chat' },
              { value: 'deepseek-coder', label: 'DeepSeek Coder' }
            ]
          }
        ]
      }
    };

    this.init();
  }

  init() {
    this.loadSettings();
    this.bindEvents();
  }

  bindEvents() {
    this.elements.modelType.addEventListener('change', () => this.handleModelTypeChange());
    this.elements.saveButton.addEventListener('click', () => this.saveSettings());
  }

  createModelSettings(modelType) {
    const config = this.modelConfigs[modelType];
    if (!config) return '';

    const fields = config.fields.map(field => {
      if (field.type === 'select') {
        const options = field.options.map(opt => 
          `<option value="${opt.value}">${opt.label}</option>`
        ).join('');
        
        return `
          <div class="form-group">
            <label for="${field.id}">${field.label}:</label>
            <select id="${field.id}">${options}</select>
          </div>
        `;
      } else {
        return `
          <div class="form-group">
            <label for="${field.id}">${field.label}:</label>
            <input type="${field.type}" id="${field.id}" placeholder="${field.placeholder}">
          </div>
        `;
      }
    }).join('');

    return `
      <div class="model-settings">
        <h3>${config.name} 设置</h3>
        ${fields}
      </div>
    `;
  }

  handleModelTypeChange() {
    const modelType = this.elements.modelType.value;
    this.elements.modelSettings.innerHTML = this.createModelSettings(modelType);
  }

  async loadSettings() {
    const settings = await chrome.storage.sync.get(null);
    
    this.elements.modelType.value = settings.modelType || 'openai';
    this.elements.language.value = settings.language || 'zh-CN';
    
    this.handleModelTypeChange();
    
    // 加载模型特定的设置
    Object.entries(this.modelConfigs).forEach(([type, config]) => {
      config.fields.forEach(field => {
        const element = document.getElementById(field.id);
        if (element) {
          element.value = settings[field.id] || '';
        }
      });
    });
  }

  async saveSettings() {
    const settings = {
      modelType: this.elements.modelType.value,
      language: this.elements.language.value
    };

    // 保存当前选中模型的设置
    const currentConfig = this.modelConfigs[settings.modelType];
    if (currentConfig) {
      currentConfig.fields.forEach(field => {
        const element = document.getElementById(field.id);
        if (element) {
          settings[field.id] = element.value;
        }
      });
    }

    try {
      await chrome.storage.sync.set(settings);
      this.showStatus('设置已保存', 'success');
    } catch (error) {
      this.showStatus('保存设置失败', 'error');
    }
  }

  showStatus(message, type = 'success') {
    this.elements.status.textContent = message;
    this.elements.status.className = type;
    setTimeout(() => {
      this.elements.status.textContent = '';
      this.elements.status.className = '';
    }, 2000);
  }
}

// 初始化设置管理器
document.addEventListener('DOMContentLoaded', () => {
  new OptionsManager();
}); 