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