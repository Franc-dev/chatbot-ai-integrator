import { describe, expect, it } from "vitest";
import { extractTextFromHtml } from "./html";

describe("extractTextFromHtml", () => {
  it("keeps title, description, and body text", () => {
    const text = extractTextFromHtml(`
      <html>
        <head>
          <title>Entity Software Creations</title>
          <meta name="description" content="We build software." />
        </head>
        <body>
          <script>void 0</script>
          <p>Hours are 9 to 5.</p>
        </body>
      </html>
    `);
    expect(text).toContain("Entity Software Creations");
    expect(text).toContain("We build software.");
    expect(text).toContain("Hours are 9 to 5.");
    expect(text).not.toContain("void 0");
  });
});
