const fs = require("fs");
const path = require("path");

describe("Options HTML", () => {
  it("shouldHaveOptionsHtml", () => {
    const optionsPath = path.join(__dirname, "options.html");
    expect(fs.existsSync(optionsPath)).toBe(true);
    const html = fs.readFileSync(optionsPath, "utf-8");
    expect(html).toMatch(/<input[^>]+id=["']api-key["'][^>]*>/);
    expect(html).toMatch(/<button[^>]+id=["']save-btn["'][^>]*>/);
  });
});
