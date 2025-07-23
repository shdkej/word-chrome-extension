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
  autoEnableWordTooltip({
    translate: async (word) => {
      // 불용어 또는 1~2글자 단어는 번역하지 않고 원문 반환
      if (!word || word.length <= 2 || STOPWORDS.has(word.toLowerCase())) {
        return word;
      }
      if (translationCache.has(word)) {
        return translationCache.get(word);
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
                      content: `'${word}'를 한국어로 번역해줘.`,
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
            translationCache.set(word, result);
            resolve(result);
          } catch (e) {
            resolve("[오류]");
          }
        });
      });
    },
  });
})();

if (typeof module !== "undefined" && typeof module.exports === "object") {
  module.exports = {
    enableWordTooltip,
    autoEnableWordTooltip,
  };
}
