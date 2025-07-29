function enableWordTooltip({ translate }) {
  document.querySelectorAll(".word").forEach((elem) => {
    let tooltipTimeout;
    let currentTooltip = null;

    elem.addEventListener("mouseover", async (e) => {
      // 기존 툴팁 제거
      document.querySelectorAll(".word-tooltip").forEach((t) => t.remove());

      // 500ms 딜레이 후 툴팁 표시
      tooltipTimeout = setTimeout(async () => {
        const word = elem.textContent;
        let meaning = translate(word);
        if (meaning instanceof Promise) {
          meaning = await meaning;
        }

        const tooltip = document.createElement("div");
        tooltip.className = "word-tooltip";
        tooltip.textContent = meaning;
        tooltip.style.position = "absolute";
        tooltip.style.background = "#333";
        tooltip.style.color = "#fff";
        tooltip.style.padding = "4px 8px";
        tooltip.style.borderRadius = "4px";
        tooltip.style.fontSize = "12px";
        tooltip.style.pointerEvents = "none";
        tooltip.style.zIndex = "10000";
        const rect = elem.getBoundingClientRect();
        tooltip.style.left = rect.left + window.scrollX + "px";
        tooltip.style.top = rect.bottom + window.scrollY + "px";
        document.body.appendChild(tooltip);
        currentTooltip = tooltip;
      }, 500); // 500ms 딜레이
    });

    elem.addEventListener("mouseout", () => {
      // 타임아웃 취소
      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = null;
      }
      // 툴팁 제거
      if (currentTooltip) {
        currentTooltip.remove();
        currentTooltip = null;
      }
      document.querySelectorAll(".word-tooltip").forEach((t) => t.remove());
    });
  });
}

function enableTextSelectionTranslation({ translate }) {
  let selectionTimeout;
  let currentSelectionTooltip = null;

  document.addEventListener("mouseup", async (e) => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    // 기존 선택 툴팁 제거
    if (currentSelectionTooltip) {
      currentSelectionTooltip.remove();
      currentSelectionTooltip = null;
    }

    // 타임아웃 취소
    if (selectionTimeout) {
      clearTimeout(selectionTimeout);
    }

    // 선택된 텍스트가 있고, 3글자 이상인 경우에만 번역
    if (selectedText && selectedText.length >= 3) {
      selectionTimeout = setTimeout(async () => {
        try {
          let translation = translate(selectedText);
          if (translation instanceof Promise) {
            translation = await translation;
          }

          // 선택 영역의 위치 계산
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();

          // 툴팁 생성
          const tooltip = document.createElement("div");
          tooltip.className = "selection-tooltip";
          tooltip.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 4px;">원문:</div>
            <div style="margin-bottom: 8px;">${selectedText}</div>
            <div style="font-weight: bold; margin-bottom: 4px;">번역:</div>
            <div>${translation}</div>
          `;
          tooltip.style.position = "absolute";
          tooltip.style.background = "#2c3e50";
          tooltip.style.color = "#fff";
          tooltip.style.padding = "12px";
          tooltip.style.borderRadius = "8px";
          tooltip.style.fontSize = "14px";
          tooltip.style.maxWidth = "300px";
          tooltip.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
          tooltip.style.zIndex = "10001";
          tooltip.style.border = "1px solid #34495e";

          // 툴팁 위치 설정 (화면 밖으로 나가지 않도록)
          let left = rect.left + window.scrollX;
          let top = rect.bottom + window.scrollY + 10;

          // 화면 오른쪽 끝을 벗어나는 경우
          if (left + 300 > window.innerWidth) {
            left = window.innerWidth - 320;
          }

          // 화면 아래쪽을 벗어나는 경우 (위쪽에 표시)
          if (top + 150 > window.innerHeight + window.scrollY) {
            top = rect.top + window.scrollY - 160;
          }

          tooltip.style.left = left + "px";
          tooltip.style.top = top + "px";

          document.body.appendChild(tooltip);
          currentSelectionTooltip = tooltip;

          // 10초 후 자동 제거
          setTimeout(() => {
            if (currentSelectionTooltip) {
              currentSelectionTooltip.remove();
              currentSelectionTooltip = null;
            }
          }, 10000);
        } catch (error) {
          console.error("번역 중 오류:", error);
        }
      }, 500); // 0.5초 딜레이
    }
  });

  // 다른 곳 클릭 시 툴팁 제거
  document.addEventListener("mousedown", (e) => {
    if (
      currentSelectionTooltip &&
      !currentSelectionTooltip.contains(e.target)
    ) {
      currentSelectionTooltip.remove();
      currentSelectionTooltip = null;
    }
  });

  // ESC 키로 툴팁 제거
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && currentSelectionTooltip) {
      currentSelectionTooltip.remove();
      currentSelectionTooltip = null;
    }
  });
}

function autoEnableWordTooltip({ translate }) {
  // article 태그 내에서만 동작
  const article = document.querySelector("article");
  if (!article) return;
  function wrapWordsInNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      const parts = text.split(/(\b\w+\b)/g);
      if (parts.length <= 1) return;
      const frag = document.createDocumentFragment();
      parts.forEach((part) => {
        if (/^\w+$/.test(part)) {
          const span = document.createElement("span");
          span.className = "word";
          span.textContent = part;
          frag.appendChild(span);
        } else {
          frag.appendChild(document.createTextNode(part));
        }
      });
      node.parentNode.replaceChild(frag, node);
    } else if (node.nodeType === Node.ELEMENT_NODE && node.childNodes) {
      if (
        ["SCRIPT", "STYLE", "NOSCRIPT", "IFRAME", "CODE", "PRE"].includes(
          node.tagName
        )
      )
        return;
      Array.from(node.childNodes).forEach(wrapWordsInNode);
    }
  }
  wrapWordsInNode(article);
  enableWordTooltip({ translate });
}

// 번역 캐시 (메모리)
const translationCache = new Map();
// 불용어 리스트 (간단 예시, 필요시 확장)
const STOPWORDS = new Set([
  "a",
  "the",
  "is",
  "in",
  "at",
  "of",
  "to",
  "and",
  "for",
  "with",
  "as",
  "by",
  "an",
  "be",
  "or",
  "it",
  "this",
  "that",
  "are",
  "was",
  "were",
  "from",
  "but",
  "not",
  "have",
  "has",
  "had",
  "will",
  "would",
  "can",
  "could",
  "should",
  "do",
  "does",
  "did",
  "so",
  "if",
  "then",
  "than",
  "about",
  "into",
  "over",
  "after",
  "before",
  "between",
  "because",
  "while",
  "where",
  "when",
  "who",
  "whom",
  "which",
  "what",
  "how",
  "why",
  "all",
  "any",
  "both",
  "each",
  "few",
  "more",
  "most",
  "other",
  "some",
  "such",
  "no",
  "nor",
  "only",
  "own",
  "same",
  "too",
  "very",
  "s",
  "t",
  "just",
  "don",
  "now",
]);

// content-script가 로드될 때 자동 실행
(function () {
  const translateFunction = async (text) => {
    // 불용어 또는 1~2글자 단어는 번역하지 않고 원문 반환 (단어 툴팁용)
    if (text.length <= 2 || STOPWORDS.has(text.toLowerCase())) {
      return text;
    }
    if (translationCache.has(text)) {
      return translationCache.get(text);
    }
    // OpenAI API 키를 chrome.storage.local에서 읽어옴
    return new Promise((resolve) => {
      if (!chrome.storage || !chrome.storage.local) {
        resolve("[No chrome.storage]");
        return;
      }
      chrome.storage.local.get("openaiApiKey", async (result) => {
        const apiKey = result.openaiApiKey;
        if (!apiKey) {
          resolve("[API Key 없음]");
          return;
        }
        try {
          const res = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model: "gpt-4.1-nano-2025-04-14",
                messages: [
                  {
                    role: "system",
                    content: "너는 번역 도우미야",
                  },
                  {
                    role: "user",
                    content: `'${text}'를 한국어로 번역해줘.`,
                  },
                ],
              }),
            }
          );
          if (!res.ok) {
            resolve("[번역 실패]");
            return;
          }
          const data = await res.json();
          const result = data.choices[0].message.content;
          translationCache.set(text, result);
          resolve(result);
        } catch (e) {
          resolve("[오류]");
        }
      });
    });
  };

  // 단어 툴팁 기능 활성화
  autoEnableWordTooltip({ translate: translateFunction });

  // 텍스트 선택 번역 기능 활성화
  enableTextSelectionTranslation({ translate: translateFunction });
})();

if (typeof module !== "undefined" && typeof module.exports === "object") {
  module.exports = {
    enableWordTooltip,
    autoEnableWordTooltip,
    enableTextSelectionTranslation,
  };
}
