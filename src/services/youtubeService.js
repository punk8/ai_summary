class YouTubeService {
  static async isYouTubeVideo(url) {
    return url.includes('youtube.com/watch') || url.includes('youtu.be/');
  }

  static async getVideoId(url) {
    const urlObj = new URL(url);
    if (url.includes('youtube.com/watch')) {
      return urlObj.searchParams.get('v');
    } else if (url.includes('youtu.be/')) {
      return urlObj.pathname.slice(1);
    }
    return null;
  }

  static async fetchTranscript(videoId, tabId) {
    try {
      // 注入脚本来获取字幕数据
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId },
        func: async (videoId) => {
          try {
            // 获取字幕列表
            const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
            const html = await response.text();
            
            // 提取字幕数据
            const captionTrackPattern = /"captionTracks":\[(.*?)\]/;
            const match = html.match(captionTrackPattern);
            if (!match) throw new Error('未找到字幕');

            const captionTracks = JSON.parse(`[${match[1]}]`);
            const autoCaption = captionTracks.find(track => 
              track.languageCode === 'zh' || 
              track.languageCode === 'zh-Hans' ||
              track.languageCode === 'en'
            );

            if (!autoCaption) throw new Error('未找到中文或英文字幕');

            // 获取字幕内容
            const captionResponse = await fetch(autoCaption.baseUrl);
            const captionXml = await captionResponse.text();
            
            // 解析字幕XML
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(captionXml, 'text/xml');
            const textNodes = xmlDoc.getElementsByTagName('text');
            
            // 提取字幕文本
            let transcript = '';
            for (const node of textNodes) {
              transcript += node.textContent + ' ';
            }

            return {
              success: true,
              data: {
                transcript: transcript.trim(),
                language: autoCaption.languageCode
              }
            };
          } catch (error) {
            return {
              success: false,
              error: error.message
            };
          }
        },
        args: [videoId]
      });

      if (!result || !result.success) {
        throw new Error(result?.error || '字幕提取失败');
      }

      return result.data;
    } catch (error) {
      console.error('Transcript fetch error:', error);
      throw new Error(`字幕提取失败: ${error.message}`);
    }
  }
} 