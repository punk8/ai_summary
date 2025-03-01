// 模型适配器基类
class BaseModelAdapter {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.options = options;
  }

  // 子类必须实现的方法
  async summarize(content, options) {
    throw new Error('必须在子类中实现 summarize 方法');
  }

  async translate(content, options) {
    throw new Error('必须在子类中实现 translate 方法');
  }

  // 通用的错误处理
  handleError(error, response = null) {
    console.error(`${this.constructor.name} error:`, error);
    
    // 如果有响应对象，尝试解析详细错误信息
    if (response) {
      return response.json()
        .then(data => {
          console.error('API error details:', data);
          throw new Error(`API 请求失败: ${data.error?.message || error.message}`);
        })
        .catch(() => {
          throw new Error(`API 请求失败: ${error.message}`);
        });
    }
    
    throw new Error(`API 请求失败: ${error.message}`);
  }

  // 通用的 API 请求方法
  async makeRequest(url, data) {
    try {
      console.log(`Making request to ${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(data)
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        return this.handleError(new Error(`HTTP ${response.status}`), response);
      }

      const responseData = await response.json();
      console.log('API response:', responseData);
      return responseData;
    } catch (error) {
      return this.handleError(error);
    }
  }
}

// 模型工厂类
class ModelFactory {
  static adapters = {};

  // 注册新的适配器
  static registerAdapter(name, adapterClass) {
    this.adapters[name] = adapterClass;
    console.log(`Registered adapter: ${name}`);
  }

  // 创建模型实例
  static createAdapter(type, apiKey, options = {}) {
    console.log(`Creating adapter for type: ${type}`, options);
    const AdapterClass = this.adapters[type];
    if (!AdapterClass) {
      throw new Error(`未知的模型类型: ${type}`);
    }
    return new AdapterClass(apiKey, options);
  }
} 