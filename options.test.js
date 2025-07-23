/**
 * @jest-environment jsdom
 */

global.chrome = {
  storage: {
    local: {
      _data: {},
      set(obj, cb) {
        Object.assign(this._data, obj);
        cb && cb();
      },
      get(keys, cb) {
        if (typeof keys === "string") keys = [keys];
        const result = {};
        for (const k of keys) result[k] = this._data[k];
        cb && cb(result);
      },
    },
  },
};

describe("Options Page", () => {
  it("shouldSaveAndLoadApiKey", (done) => {
    document.body.innerHTML =
      '<input id="api-key" /><button id="save-btn">저장</button>';
    // options.js의 save/load 함수 (아직 미구현)
    const { saveApiKey, loadApiKey } = require("./options");
    document.getElementById("api-key").value = "sk-test-123";
    saveApiKey(() => {
      document.getElementById("api-key").value = "";
      loadApiKey(() => {
        expect(document.getElementById("api-key").value).toBe("sk-test-123");
        done();
      });
    });
  });
});
