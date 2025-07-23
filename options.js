function getApiKeyInput() {
  return document.getElementById("api-key");
}

function setApiKeyInputValue(value) {
  const input = getApiKeyInput();
  if (input) input.value = value || "";
}

function saveApiKey(cb) {
  if (!chrome.storage || !chrome.storage.local) {
    console.warn("chrome.storage.local이 지원되지 않습니다.");
    cb && cb();
    return;
  }
  const input = getApiKeyInput();
  const value = input ? input.value : "";
  chrome.storage.local.set({ openaiApiKey: value }, () => {
    console.log("[옵션] API Key 저장됨:", value);
    cb && cb();
  });
}

function loadApiKey(cb) {
  if (!chrome.storage || !chrome.storage.local) {
    console.warn("chrome.storage.local이 지원되지 않습니다.");
    cb && cb();
    return;
  }
  chrome.storage.local.get("openaiApiKey", (result) => {
    setApiKeyInputValue(result.openaiApiKey);
    cb && cb();
  });
}

function showSaveMsg() {
  const msg = document.getElementById("save-msg");
  if (msg) {
    msg.style.display = "block";
    setTimeout(() => {
      msg.style.display = "none";
    }, 1500);
  }
}

if (typeof module !== "undefined" && typeof module.exports === "object") {
  module.exports = { saveApiKey, loadApiKey };
}

document.addEventListener("DOMContentLoaded", () => {
  loadApiKey();
  const saveBtn = document.getElementById("save-btn");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      saveApiKey(() => {
        setApiKeyInputValue(""); // 입력칸 비우기
        showSaveMsg(); // 저장 메시지 표시
      });
    });
  }
});
