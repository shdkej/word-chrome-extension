/**
 * @jest-environment jsdom
 */

const { renderPopup } = require("./popup");

describe("Popup UI", () => {
  it("shouldRenderExtraInputFieldOnly", () => {
    document.body.innerHTML = '<div id="popup-root"></div>';
    renderPopup();
    // 프롬프트 텍스트는 더 이상 검증하지 않음
    expect(document.querySelector("textarea")).not.toBeNull();
    expect(document.querySelector("button")).not.toBeNull();
  });

  it("shouldUpdateAndReadExtraInputValue", () => {
    document.body.innerHTML = '<div id="popup-root"></div>';
    renderPopup();

    const textarea = document.querySelector("textarea");
    textarea.value = "테스트 입력값";
    // input 이벤트 트리거 (실제 구현에서 필요할 수 있음)
    textarea.dispatchEvent(new Event("input", { bubbles: true }));

    // popup.js에서 export하는 getExtraInputValue 함수로 값 확인 (아직 미구현)
    const { getExtraInputValue } = require("./popup");
    expect(getExtraInputValue()).toBe("테스트 입력값");
  });

  it("shouldRenderCorrectionButtonAndResult", () => {
    document.body.innerHTML = '<div id="popup-root"></div>';
    // renderPopup에 mockCorrection 함수 전달 (아직 미구현)
    renderPopup({
      onCorrection: () => {
        // 버튼 클릭 시 결과 영역에 "교정 결과 예시"를 표시한다고 가정
        const resultDiv = document.getElementById("correction-result");
        resultDiv.textContent = "교정 결과 예시";
      },
    });

    // 버튼이 렌더링되어야 함
    const button = document.querySelector("button");
    expect(button).not.toBeNull();
    expect(button.textContent).toContain("AI 교정 요청");

    // 결과 영역이 렌더링되어야 함
    const resultDiv = document.getElementById("correction-result");
    expect(resultDiv).not.toBeNull();
    expect(resultDiv.textContent).toBe("");

    // 버튼 클릭 시 결과가 표시되어야 함
    button.click();
    expect(resultDiv.textContent).toBe("교정 결과 예시");
  });

  it("shouldCallOpenAIApiAndDisplayResult", async () => {
    document.body.innerHTML = '<div id="popup-root"></div>';
    const mockOpenAICall = jest.fn().mockResolvedValue("AI 교정 결과 예시");

    // renderPopup에 openAICall 함수 전달 (아직 미구현)
    renderPopup({ openAICall: mockOpenAICall });

    // textarea에 입력값 세팅
    const textarea = document.querySelector("textarea");
    textarea.value = "테스트 입력값";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));

    // 버튼 클릭
    const button = document.querySelector("button");
    await button.click();

    // openAICall이 호출되었는지 확인
    expect(mockOpenAICall).toHaveBeenCalled();
    // 결과가 표시되었는지 확인
    const resultDiv = document.getElementById("correction-result");
    // 비동기 반영을 위해 Promise flush
    await new Promise((r) => setTimeout(r, 0));
    expect(resultDiv.textContent).toBe("AI 교정 결과 예시");
  });

  it("shouldCallRealOpenAIApiAndDisplayResult", async () => {
    document.body.innerHTML = '<div id="popup-root"></div>';

    // fetch를 mock 처리
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: "실제 AI 교정 결과" }),
    });

    // 실제 openAICall 함수 구현 (popup.js에서 사용할 예정)
    async function realOpenAICall(input) {
      const res = await fetch("https://api.openai.com/v1/real", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      return data.result;
    }

    renderPopup({ openAICall: realOpenAICall });

    // textarea에 입력값 세팅
    const textarea = document.querySelector("textarea");
    textarea.value = "실제 입력값";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));

    // 버튼 클릭
    const button = document.querySelector("button");
    await button.click();

    // fetch가 올바르게 호출되었는지 확인
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.openai.com/v1/real",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ input: "실제 입력값" }),
      })
    );

    // 결과가 표시되었는지 확인
    const resultDiv = document.getElementById("correction-result");
    await new Promise((r) => setTimeout(r, 0));
    expect(resultDiv.textContent).toBe("실제 AI 교정 결과");
  });
});

describe("popup-content integration", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="popup-root"></div>';
    global.chrome = {
      runtime: {
        sendMessage: jest.fn(),
      },
      tabs: {
        query: jest.fn(),
      },
    };
  });

  it("should fetch title and body from content script and display them", async () => {
    // Arrange: content script가 반환할 mock 데이터
    const mockContent = { title: "기사 제목", body: "기사 본문" };
    global.chrome.runtime.sendMessage.mockImplementation((msg, cb) => {
      if (msg.type === "GET_ARTICLE_CONTENT") {
        cb(mockContent);
      }
    });

    // popup에 표시할 함수 (아직 미구현)
    const { renderPopup } = require("./popup");
    // 가정: renderPopup이 내부적으로 getArticleContentFromContentScript를 호출해 값을 표시함
    renderPopup();

    // Act: 실제로 DOM에 값이 표시되는지 확인 (아직 미구현이므로 실패)
    const root = document.getElementById("popup-root");
    expect(root.textContent).toContain("기사 제목");
    expect(root.textContent).toContain("기사 본문");
  });
});

describe("popup-openai integration", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="popup-root"></div>';
    global.fetch = jest.fn();
    global.chrome = {
      storage: {
        local: {
          get: jest.fn(),
        },
      },
    };
  });

  it("should call OpenAI API and display result on button click", async () => {
    // Arrange: API Key, fetch 응답, textarea 값
    global.chrome.storage.local.get.mockImplementation((key, cb) => {
      cb({ openaiApiKey: "test-key" });
    });
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "AI 교정 결과" } }],
      }),
    });
    const { renderPopup } = require("./popup");
    renderPopup();
    const textarea = document.querySelector("textarea");
    textarea.value = "기사 원문 텍스트";
    // Act: 버튼 클릭
    const button = document.getElementById("correction-btn");
    button.click();
    // Wait for async
    await new Promise((r) => setTimeout(r, 10));
    // Assert: fetch가 올바른 파라미터로 호출됐는지
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("openai.com/v1/chat/completions"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer test-key" }),
        body: expect.stringContaining("기사 원문 텍스트"),
      })
    );
    // Assert: 결과가 UI에 표시됐는지
    const resultDiv = document.getElementById("correction-result");
    expect(resultDiv.textContent).toContain("AI 교정 결과");
  });
});

describe("popup textarea autofill", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="popup-root"></div>';
    global.chrome = {
      runtime: {
        sendMessage: jest.fn(),
      },
      tabs: {
        query: jest.fn(),
      },
    };
  });

  it("should autofill textarea with article title and body from content script", async () => {
    // Arrange: content script가 반환할 mock 데이터
    const mockContent = { title: "기사 제목", body: "기사 본문" };
    global.chrome.runtime.sendMessage.mockImplementation((msg, cb) => {
      if (msg.type === "GET_ARTICLE_CONTENT") {
        cb(mockContent);
      }
    });
    const { renderPopup } = require("./popup");
    renderPopup();
    // Wait for async
    await new Promise((r) => setTimeout(r, 10));
    // Assert: textarea에 값이 자동으로 채워졌는지
    const textarea = document.querySelector("textarea");
    expect(textarea.value).toContain("기사 제목");
    expect(textarea.value).toContain("기사 본문");
  });
});

describe("popup loading and error UX", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="popup-root"></div>';
    global.fetch = jest.fn();
    global.chrome = {
      storage: {
        local: {
          get: jest.fn(),
        },
      },
    };
  });

  it("should show loading indicator while calling OpenAI API", async () => {
    global.chrome.storage.local.get.mockImplementation((key, cb) => {
      cb({ openaiApiKey: "test-key" });
    });
    // fetch가 지연되도록 Promise로 대기
    let resolveFetch;
    global.fetch.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
    );
    const { renderPopup } = require("./popup");
    renderPopup();
    const textarea = document.querySelector("textarea");
    textarea.value = "기사 원문 텍스트";
    const button = document.getElementById("correction-btn");
    button.click();
    // 로딩 표시 확인
    const resultDiv = document.getElementById("correction-result");
    expect(resultDiv.textContent).toContain("로딩 중");
    // fetch 완료 후
    resolveFetch({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "AI 결과" } }] }),
    });
    await new Promise((r) => setTimeout(r, 10));
  });

  it("should show error message if OpenAI API call fails", async () => {
    global.chrome.storage.local.get.mockImplementation((key, cb) => {
      cb({ openaiApiKey: "test-key" });
    });
    global.fetch.mockResolvedValue({ ok: false });
    const { renderPopup } = require("./popup");
    renderPopup();
    const textarea = document.querySelector("textarea");
    textarea.value = "기사 원문 텍스트";
    const button = document.getElementById("correction-btn");
    button.click();
    await new Promise((r) => setTimeout(r, 10));
    const resultDiv = document.getElementById("correction-result");
    expect(resultDiv.textContent).toContain("에러");
  });
});

describe("Correction apply integration", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="popup-root"></div>';
  });

  it("should replace only selected corrections in textarea when '반영하기' is clicked", () => {
    // Arrange: textarea에 교정 전 텍스트가 있음
    const initialText =
      "이것은 교정 전 내용1이고, 또 다른 교정 전 내용2가 있습니다.";
    // 교정 결과 예시 (실제 구현에서는 파싱 필요)
    const corrections = [
      { before: "교정 전 내용1", after: "교정 후 내용1" },
      { before: "교정 전 내용2", after: "교정 후 내용2" },
    ];
    // renderPopup이 corrections 배열을 받아 체크박스와 반영하기 버튼을 렌더링한다고 가정
    const { renderPopup } = require("./popup");
    renderPopup({ corrections });
    // textarea에 초기값 세팅
    const textarea = document.querySelector("textarea");
    textarea.value = initialText;
    // 체크박스 노드들
    const checkboxes = document.querySelectorAll("input[type='checkbox']");
    // 첫 번째 교정만 선택
    checkboxes[0].checked = true;
    checkboxes[1].checked = false;
    // '반영하기' 버튼 클릭
    const applyBtn = document.getElementById("apply-corrections-btn");
    applyBtn.click();
    // Assert: 첫 번째 교정만 반영되어야 함
    expect(textarea.value).toBe(
      "이것은 교정 후 내용1이고, 또 다른 교정 전 내용2가 있습니다."
    );
    // 두 번째 교정만 선택해서 반영
    checkboxes[0].checked = false;
    checkboxes[1].checked = true;
    textarea.value = initialText;
    applyBtn.click();
    expect(textarea.value).toBe(
      "이것은 교정 전 내용1이고, 또 다른 교정 후 내용2가 있습니다."
    );
    // 둘 다 선택해서 반영
    checkboxes[0].checked = true;
    checkboxes[1].checked = true;
    textarea.value = initialText;
    applyBtn.click();
    expect(textarea.value).toBe(
      "이것은 교정 후 내용1이고, 또 다른 교정 후 내용2가 있습니다."
    );
  });

  it("should send APPLY_CORRECTION message to content script with corrected body when '반영하기' is clicked", () => {
    // Arrange: textarea에 교정 전 텍스트가 있음
    const initialText =
      "이것은 교정 전 내용1이고, 또 다른 교정 전 내용2가 있습니다.";
    const corrections = [
      { before: "교정 전 내용1", after: "교정 후 내용1" },
      { before: "교정 전 내용2", after: "교정 후 내용2" },
    ];
    // chrome.tabs.sendMessage mock
    global.chrome = {
      tabs: {
        query: jest.fn((query, cb) => cb([{ id: 123 }])),
        sendMessage: jest.fn(),
      },
    };
    const { renderPopup } = require("./popup");
    renderPopup({ corrections });
    // textarea에 초기값 세팅
    const textarea = document.querySelector("textarea");
    textarea.value = initialText;
    // 첫 번째 교정만 선택
    const checkboxes = document.querySelectorAll("input[type='checkbox']");
    checkboxes[0].checked = true;
    checkboxes[1].checked = false;
    // '반영하기' 버튼 클릭
    const applyBtn = document.getElementById("apply-corrections-btn");
    applyBtn.click();
    // chrome.tabs.sendMessage가 올바른 payload로 호출됐는지 확인
    expect(global.chrome.tabs.sendMessage).toHaveBeenCalledWith(
      123,
      {
        type: "APPLY_CORRECTION",
        correctedBody:
          "이것은 교정 후 내용1이고, 또 다른 교정 전 내용2가 있습니다.",
      },
      expect.any(Function)
    );
  });
});
