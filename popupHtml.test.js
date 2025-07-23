const fs = require("fs");
const path = require("path");

describe("Popup HTML", () => {
  it("shouldHavePopupHtml", () => {
    const popupPath = path.join(__dirname, "popup.html");
    expect(fs.existsSync(popupPath)).toBe(true);
    const html = fs.readFileSync(popupPath, "utf-8");
    expect(html).toMatch(/<div[^>]+id=["']popup-root["'][^>]*><\/div>/);
  });
});
