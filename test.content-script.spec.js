/**
 * @jest-environment jsdom
 */
// content script의 입력값 추출 기능 테스트

const { extractTitleAndBody } = require("./content-script");

describe("content script", () => {
  it("shouldExtractTitleAndBodyFromAdminContent", () => {
    // 가상의 DOM 구조 생성
    document.body.innerHTML = `
      <article class="admin-content">
        <header class="atl-view-header">
          <h2 class="heading">테스트 제목</h2>
        </header>
        <div class="wt-forms writing-editor">
          <div class="wt-forms-content">테스트 본문 내용</div>
        </div>
      </article>
    `;

    // content script의 추출 함수 (아직 미구현)
    const { title, body } = extractTitleAndBody();

    expect(title).toBe("테스트 제목");
    expect(body).toBe("테스트 본문 내용");
  });
});

describe("highlight feedback", () => {
  it("should highlight all occurrences of feedback words in the body with yellow background", () => {
    document.body.innerHTML = `
      <div class="wt-forms writing-editor">
        <div class="wt-forms-content">잘못된 표현과 또다른 문제, 잘못된 표현이 반복됩니다.</div>
      </div>
    `;
    // 예시 피드백 결과
    const feedback = [
      { text: "잘못된 표현", suggestion: "올바른 표현" },
      { text: "또다른 문제", suggestion: "다른 해결책" },
    ];
    // 하이라이트 함수(아직 미구현)
    const { highlightFeedbackInBody } = require("./content-script");
    highlightFeedbackInBody(feedback);
    const html = document.querySelector(".wt-forms-content").innerHTML;
    // 모든 피드백 단어가 span.highlight로 감싸져야 함
    expect(html).toContain('<span class="highlight"');
    // 잘못된 표현이 2번, 또다른 문제가 1번 하이라이트되어야 함
    expect((html.match(/<span class="highlight"/g) || []).length).toBe(3);
  });
});

describe("tooltip on word hover (OpenAI integration)", () => {
  beforeEach(() => {
    // fetch를 mock 처리
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: "테스트(OpenAI)" } }],
          }),
      })
    );
  });
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should show tooltip with OpenAI translation when hovering over a word", async () => {
    document.body.innerHTML = `
      <div>
        <span class="word">test</span>
      </div>
    `;
    const { enableWordTooltip } = require("./content-script");
    // 실제 OpenAI API를 호출하는 translate 함수
    async function openaiTranslate(word) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer dummy-key",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a translation assistant." },
            {
              role: "user",
              content: `Translate the word '${word}' to Korean.`,
            },
          ],
        }),
      });
      const data = await res.json();
      return data.choices[0].message.content;
    }
    enableWordTooltip({ translate: openaiTranslate });
    const wordElem = document.querySelector(".word");
    const mouseOverEvent = new Event("mouseover", { bubbles: true });
    wordElem.dispatchEvent(mouseOverEvent);
    // 비동기 처리 대기
    await new Promise((r) => setTimeout(r, 0));
    const tooltip = document.querySelector(".word-tooltip");
    expect(tooltip).not.toBeNull();
    expect(tooltip.textContent).toBe("테스트(OpenAI)");
    // fetch가 올바르게 호출되었는지 검증
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("openai.com"),
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("auto tooltip on plain text words", () => {
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: "테스트(OpenAI)" } }],
          }),
      })
    );
  });
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should show tooltip with OpenAI translation when hovering over a word in plain text", async () => {
    document.body.innerHTML = `<p>This is a test.</p>`;
    // content-script가 자동으로 모든 단어를 hover-툴팁 대상으로 만들어야 함
    const { autoEnableWordTooltip } = require("./content-script");
    // 실제 OpenAI API를 호출하는 translate 함수
    async function openaiTranslate(word) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer dummy-key",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a translation assistant." },
            {
              role: "user",
              content: `Translate the word '${word}' to Korean.`,
            },
          ],
        }),
      });
      const data = await res.json();
      return data.choices[0].message.content;
    }
    // 자동 적용 함수 실행 (아직 미구현)
    autoEnableWordTooltip({ translate: openaiTranslate });
    // "test"라는 단어 span을 찾아 마우스오버 이벤트 트리거
    const wordElem = Array.from(document.querySelectorAll("span")).find(
      (e) => e.textContent === "test"
    );
    expect(wordElem).not.toBeNull();
    const mouseOverEvent = new Event("mouseover", { bubbles: true });
    wordElem.dispatchEvent(mouseOverEvent);
    // 비동기 처리 대기
    await new Promise((r) => setTimeout(r, 0));
    const tooltip = document.querySelector(".word-tooltip");
    expect(tooltip).not.toBeNull();
    expect(tooltip.textContent).toBe("테스트(OpenAI)");
  });
});
