document.addEventListener('DOMContentLoaded', () => {
  // 加载保存的设置
  chrome.storage.sync.get(['apiKey', 'language'], (items) => {
    document.getElementById('apiKey').value = items.apiKey || '';
    document.getElementById('language').value = items.language || 'zh-CN';
  });

  // 保存设置
  document.getElementById('save').addEventListener('click', () => {
    const apiKey = document.getElementById('apiKey').value;
    const language = document.getElementById('language').value;

    chrome.storage.sync.set({
      apiKey,
      language
    }, () => {
      const status = document.getElementById('status');
      status.textContent = '设置已保存';
      status.className = 'success';
      setTimeout(() => {
        status.textContent = '';
        status.className = '';
      }, 2000);
    });
  });
}); 