const fs = require("fs");
const path = require("path");

describe("Chrome Extension Manifest", () => {
  it("shouldHaveValidManifest", () => {
    const manifestPath = path.join(__dirname, "manifest.json");
    expect(fs.existsSync(manifestPath)).toBe(true);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

    // 필수 필드 검사
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBeTruthy();
    expect(manifest.version).toBeTruthy();
    expect(manifest.action || manifest.browser_action).toBeTruthy();
    expect(
      manifest.action?.default_popup || manifest.browser_action?.default_popup
    ).toMatch(/popup\.html$/);
    expect(Array.isArray(manifest.content_scripts)).toBe(true);
    expect(manifest.permissions).toContain("scripting");
  });
});

describe("background script structure", () => {
  it("should have background.js and be registered in manifest.json", () => {
    const path = require("path");
    const fs = require("fs");
    const bgPath = path.join(__dirname, "background.js");
    // background.js 파일 존재 확인 (절대경로)
    expect(fs.existsSync(bgPath)).toBe(true);
    // manifest.json에 background script 등록 확인
    const manifest = JSON.parse(
      fs.readFileSync(path.join(__dirname, "manifest.json"), "utf-8")
    );
    expect(manifest.background).toBeDefined();
    expect(
      manifest.background.service_worker || manifest.background.scripts
    ).toBeDefined();
  });
});

describe("background message routing", () => {
  it("should relay GET_ARTICLE_CONTENT from popup to content script and return response", (done) => {
    // chrome API mock
    const responses = [];
    global.chrome = {
      runtime: {
        onMessage: {
          addListener: (fn) => {
            // simulate popup message
            fn({ type: "GET_ARTICLE_CONTENT" }, { tab: { id: 123 } }, (res) => {
              responses.push(res);
              // 응답이 올바른지 확인
              expect(res).toEqual({
                title: "테스트 제목",
                body: "테스트 본문",
              });
              done();
            });
          },
        },
      },
      tabs: {
        sendMessage: (tabId, msg, cb) => {
          // content script가 응답하는 부분을 모킹
          expect(tabId).toBe(123);
          expect(msg.type).toBe("GET_ARTICLE_CONTENT");
          cb({ title: "테스트 제목", body: "테스트 본문" });
        },
      },
    };
    // background.js require (side effect로 addListener 실행)
    require("./background.js");
  });
});

describe("manifest and file structure", () => {
  it("should have all required files referenced in manifest.json", () => {
    const path = require("path");
    const fs = require("fs");
    const manifest = JSON.parse(
      fs.readFileSync(path.join(__dirname, "manifest.json"), "utf-8")
    );
    // popup.html
    expect(
      fs.existsSync(path.join(__dirname, manifest.action.default_popup))
    ).toBe(true);
    // content-script.js
    manifest.content_scripts.forEach((cs) => {
      cs.js.forEach((jsFile) => {
        expect(fs.existsSync(path.join(__dirname, jsFile))).toBe(true);
      });
    });
    // background.js
    expect(
      fs.existsSync(path.join(__dirname, manifest.background.service_worker))
    ).toBe(true);
  });
});
