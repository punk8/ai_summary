// 确保在任何上下文中都能正确初始化
(function(global) {
  // 初始化全局命名空间
  global.AISummary = {
    ModelFactory: class ModelFactory {
      static adapters = {};
    
      static registerAdapter(name, adapterClass) {
        this.adapters[name] = adapterClass;
        console.log(`Registered adapter: ${name}`);
      }
    
      static createAdapter(type, apiKey, options = {}) {
        console.log(`Creating adapter for type: ${type}`, options);
        const AdapterClass = this.adapters[type];
        if (!AdapterClass) {
          throw new Error(`未知的模型类型: ${type}`);
        }
        return new AdapterClass(apiKey, options);
      }
    },

    BaseModelAdapter: class BaseModelAdapter {
      constructor(apiKey, options = {}) {
        this.apiKey = apiKey;
        this.options = options;
      }
    
      async summarize(content, options) {
        throw new Error('必须在子类中实现 summarize 方法');
      }
    
      async translate(content, options) {
        throw new Error('必须在子类中实现 translate 方法');
      }
    
      handleError(error, response = null) {
        console.error(`${this.constructor.name} error:`, error);
        
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
    
      async makeRequest(url, data) {
        try {
          console.log(`Making request to ${url}`, data);
    
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
  };

  // 在不同的执行环境中确保 AISummary 可用
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = global.AISummary;
  } else if (typeof window !== 'undefined') {
    window.AISummary = global.AISummary;
  }
})(typeof globalThis !== 'undefined' ? globalThis : 
   typeof window !== 'undefined' ? window : 
   typeof global !== 'undefined' ? global : 
   typeof self !== 'undefined' ? self : this);

// 添加初始化完成的日志
console.log('AISummary namespace initialized:', typeof AISummary !== 'undefined'); 