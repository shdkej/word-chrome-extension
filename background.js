// 크롬 익스텐션 background script scaffold

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_ARTICLE_CONTENT") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, message, sendResponse);
      }
    });
    return true; // 비동기 응답
  }
});
