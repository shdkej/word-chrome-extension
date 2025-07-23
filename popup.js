const TRANSLATION_PROMPT = `
다음 문장을 한국어로 번역해주세요.

번역 규칙:
1. 원문의 의미와 뉘앙스를 정확하게 전달하세요
2. 자연스러운 한국어로 번역하세요
3. 문맥에 맞는 적절한 어휘를 선택하세요
4. 존댓말/반말은 원문의 톤에 맞춰 번역하세요
5. 전문 용어나 고유명사는 적절히 번역하거나 원문을 병기하세요

번역할 문장:
`;

function setTranslationResult(markdown) {
  const resultDiv = document.getElementById("translation-result");
  if (resultDiv) {
    resultDiv.innerHTML = window.marked.parse(markdown);
  }
}

async function fetchOpenAITranslation(apiKey, prompt, userInput) {
  const system_prompt = `
    당신은 한국에 거주하며 활동하는 한국어 기사 교정 전문가입니다.
    일본 관련 소식을 한국에 소개하는 기사 초안을 점검하고 교정하는 것이 주된 역할입니다.
    당신은 주로 신입 또는 중급 기자들이 일본 관련 내용을 기사화한 원고를 검토합니다.

    당신의 임무는 다음과 같습니다:
    한국어 맞춤법, 띄어쓰기, 조사, 어색한 문장 표현을 전면 점검합니다.
    기사 전체에서 형식, 문장 톤, 표기 방식의 통일성 유지 여부를 확인합니다. (예: 작품명 꺾쇠괄호 사용 여부, 시대 표기 방식, 사진 출처 표기 통일 등)
    일본 지명, 인명, 용어 등에 대해 2025년 기준 국립국어원 외래어 표기법을 적용했는지 철저히 검토합니다. (예: ケイオウ → 게이오, つる가しま → 쓰루가시마)
    번역된 내용이 번역 요청 지침(기사 스타일, 목적, 톤 등)을 충실히 따랐는지를 확인합니다.
    잘못된 표현이나 지침에 어긋난 부분이 있다면, 수정한 문장과 그에 대한 교정 사유를 함께 반환해야 합니다.
    AI가 스스로 기사의 목적과 스타일에 맞게 자연스럽고 신뢰도 높은 한국어 기사를 작성할 수 있도록 문장 구성과 표현을 안내합니다.
    ❗ 단, 기사에 없는 내용을 임의로 보완하거나 AI가 추정해서 넣는 것은 절대 금지입니다.
`;
  const user_prompt = `

아래 교정 요청사항을 참고해서 번역 결과를 교정해주고, 교정 된 부분은 이유와 함께 한칸씩 띄워서 보기좋게 반환해줘
교정 전:, 교정 후: 라벨 내부에는 반드시 **아무런 HTML 태그나 마크다운 문법(예: **굵게**, <strong>, <br> 등)**도 포함하지 마세요.
해당 라벨은 단순 텍스트로 유지되어야 하며, 기계가 문자열 매칭으로 처리하므로 형식이 변경되면 안 됩니다.
강조, 색상, 줄바꿈 등 시각적 표현은 절대 사용하지 말고, 설명은 이유: 항목에 평문으로만 작성해주세요.

[교정 요청사항]
${prompt}

[번역 결과]
${userInput}

[교정 된 부분]
1. example1
- 교정 전:
- 교정 후:
- 이유:

---

2. example2
- 교정 전:
- 교정 후:
- 이유:

---

...

`;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: system_prompt },
        { role: "user", content: user_prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error("API Error");
  const json = await res.json();
  return json.choices?.[0]?.message?.content || "";
}

function getApiKey(cb) {
  chrome.storage.local.get("openaiApiKey", (data) => {
    cb(data.openaiApiKey);
  });
}

// 하이라이트 메시지 전송 함수
function sendHighlightToContentScript(feedback) {
  // feedback이 배열이 아니면 splitMarkdownByDashes로 블록 배열로 변환 후 객체로 파싱
  let feedbackArr = feedback;
  if (!Array.isArray(feedback)) {
    feedbackArr = splitMarkdownByDashes(feedback).map((block) => {
      const textMatch = block.match(/-? ?교정 전:\s*(.+)/);
      const suggestionMatch = block.match(/-? ?교정 후:\s*(.+)/);
      return {
        text: textMatch ? textMatch[1].trim() : block.trim(),
        suggestion: suggestionMatch ? suggestionMatch[1].trim() : "",
      };
    });
  }
  if (!Array.isArray(feedbackArr)) return;
  if (!chrome.tabs || !chrome.tabs.query || !chrome.tabs.sendMessage) return;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        {
          type: "HIGHLIGHT_FEEDBACK",
          feedback: feedbackArr,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.warn(
              "[익스텐션] content script 연결 실패:",
              chrome.runtime.lastError.message
            );
          }
        }
      );
    }
  });
}
function showArticlePreview(text) {
  const previewDiv = document.getElementById("article-preview");
  if (previewDiv) {
    // 앞뒤 공백 제거, 줄바꿈 → 공백, 80자 제한
    const summary = text.replace(/\s+/g, " ").trim().slice(0, 80);
    previewDiv.textContent = summary;
  }
}
function callAI() {
  setCorrectionResult("로딩중");
  getApiKey(async (apiKey) => {
    if (!apiKey) {
      console.log("[AI 교정] API Key 없음");
      return setCorrectionResult("[AI 교정] API Key 없음");
    }
    try {
      const value = getExtraInputValue();
      showArticlePreview(value);
      console.log("[AI 교정] fetchOpenAICorrection 시작");
      const result = await fetchOpenAITranslation(
        apiKey,
        TRANSLATION_PROMPT,
        value
      );
      console.log("[AI 교정] fetchOpenAICorrection 성공");
      setCorrectionResult(result);
      sendHighlightToContentScript(result);
    } catch (e) {
      console.log("[AI 교정] fetchOpenAICorrection 실패", e);
      setCorrectionResult("[AI 교정] fetchOpenAICorrection 실패");
    }
  });
}

function handleCorrectionButton(options) {
  const button = document.getElementById("correction-btn");
  if (!button) return;
  if (options.onCorrection) {
    button.onclick = options.onCorrection;
  } else {
    button.onclick = async () => {
      console.log("[AI 교정] 버튼 클릭됨");
      callAI();
    };
  }
}

function sendCorrectionToContentScript(body, title) {
  console.log("1. send in popup", body);
  if (
    window.chrome &&
    chrome.tabs &&
    chrome.tabs.query &&
    chrome.tabs.sendMessage
  ) {
    console.log("2. in if");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      console.log("3. in query");
      if (tabs && tabs[0]) {
        console.log("4. its done");
        chrome.tabs.sendMessage(
          tabs[0].id,
          { type: "APPLY_CORRECTION", payload: { body, title } },
          () => {}
        );
      }
    });
  }
}

function renderPopup(options = {}) {
  const root = document.getElementById("popup-root");
  root.innerHTML = `
    <button class="close-btn" id="close-popup" title="닫기">×</button>
    <div class="ai-title">AI 문장 번역</div>
    <textarea id="input-text" placeholder="번역할 문장을 입력하세요"></textarea>
    <button id="ai-translate-btn" class="ai-btn">AI 번역 요청</button>
    <div id="translation-result" class="ai-result"></div>
  `;
  document.getElementById("ai-translate-btn").onclick = async () => {
    const apiKey = /* 옵션에서 불러오기 */ "";
    const input = document.getElementById("input-text").value;
    if (!input.trim()) {
      setTranslationResult("⚠️ 번역할 문장을 입력하세요.");
      return;
    }
    setTranslationResult("⏳ 번역 중...");
    const result = await fetchOpenAITranslation(
      apiKey,
      TRANSLATION_PROMPT,
      input
    );
    setTranslationResult(result);
  };
}

function getExtraInputValue() {
  const textarea = document.querySelector("textarea");
  return textarea ? textarea.value : "";
}

// CommonJS export만 허용 (ES module export 제거)
if (typeof module === "object" && typeof module.exports === "object") {
  module.exports = {
    renderPopup,
    getExtraInputValue,
    fetchArticleContentFromContentScript,
    fillTextareaWithArticle,
  };
}

// 팝업이 열릴 때 마지막 교정 결과와 체크 상태 복원
if (chrome && chrome.storage && chrome.storage.local) {
  document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.local.get(
      ["lastCorrectionResult", "lastCorrectionChecked"],
      (result) => {
        if (result && result.lastCorrectionResult) {
          setCorrectionResult(
            result.lastCorrectionResult,
            false,
            result.lastCorrectionChecked || []
          );
        }
      }
    );
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("popup-root");
  if (root) renderPopup();
});
