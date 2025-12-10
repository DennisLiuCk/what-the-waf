import { test, expect } from '@playwright/test';

/**
 * Payload Encoder/Decoder Tests
 *
 * Tests for the encoding/decoding tool functionality.
 * Verifies URL, Base64, HTML, Unicode, and Double encoding.
 */

test.describe('Encoder Tool Interface', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#tools');
    await page.waitForTimeout(300);
  });

  test('should display the encoder interface', async ({ page }) => {
    // Check for input field
    const input = page.locator('#encoder-input');
    await expect(input).toBeVisible();

    // Check for output field
    const output = page.locator('#encoder-output');
    await expect(output).toBeVisible();

    // Check for encode button
    const encodeBtn = page.locator('button:has-text("編碼")');
    await expect(encodeBtn).toBeVisible();

    // Check for decode button
    const decodeBtn = page.locator('button:has-text("解碼")');
    await expect(decodeBtn).toBeVisible();
  });

  test('should display encoding type buttons', async ({ page }) => {
    const encodingTypes = ['URL Encode', 'Base64', 'HTML Entities', 'Unicode', '雙重編碼'];

    for (const type of encodingTypes) {
      const btn = page.locator(`.encoder-type-btn:has-text("${type}")`);
      await expect(btn).toBeVisible();
    }
  });

  test('should have URL Encode selected by default', async ({ page }) => {
    const urlBtn = page.locator('.encoder-type-btn:has-text("URL Encode")');
    await expect(urlBtn).toHaveClass(/active/);
  });

  test('should display quick sample buttons', async ({ page }) => {
    const samples = page.locator('[data-encoder-sample]');
    const count = await samples.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('URL Encoding', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#tools');
    await page.waitForTimeout(300);
    // Ensure URL Encode is selected
    await page.locator('.encoder-type-btn:has-text("URL Encode")').click();
    await page.waitForTimeout(100);
  });

  test('should encode special characters', async ({ page }) => {
    const input = page.locator('#encoder-input');
    const output = page.locator('#encoder-output');
    const encodeBtn = page.locator('button:has-text("編碼")');

    await input.fill("' OR '1'='1");
    await encodeBtn.click();
    await page.waitForTimeout(200);

    const result = await output.inputValue();
    expect(result).toContain('%27'); // Encoded quote
    expect(result).toContain('%20'); // Encoded space
  });

  test('should encode path traversal', async ({ page }) => {
    const input = page.locator('#encoder-input');
    const output = page.locator('#encoder-output');
    const encodeBtn = page.locator('button:has-text("編碼")');

    await input.fill('../../../etc/passwd');
    await encodeBtn.click();
    await page.waitForTimeout(200);

    const result = await output.inputValue();
    expect(result).toContain('%2F'); // Encoded /
    expect(result).toContain('%2E'); // Encoded .
  });

  test('should decode URL encoded string', async ({ page }) => {
    const input = page.locator('#encoder-input');
    const output = page.locator('#encoder-output');
    const decodeBtn = page.locator('button:has-text("解碼")');

    // Put encoded string in output and decode to input
    await page.locator('#encoder-output').fill('%27%20OR%20%271%27%3D%271');
    await decodeBtn.click();
    await page.waitForTimeout(200);

    const result = await input.inputValue();
    expect(result).toContain("' OR '1'='1");
  });
});

test.describe('Base64 Encoding', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#tools');
    await page.waitForTimeout(300);
    await page.locator('.encoder-type-btn:has-text("Base64")').click();
    await page.waitForTimeout(100);
  });

  test('should encode to Base64', async ({ page }) => {
    const input = page.locator('#encoder-input');
    const output = page.locator('#encoder-output');
    const encodeBtn = page.locator('button:has-text("編碼")');

    await input.fill('Hello World');
    await encodeBtn.click();
    await page.waitForTimeout(200);

    const result = await output.inputValue();
    expect(result).toBe('SGVsbG8gV29ybGQ=');
  });

  test('should decode Base64', async ({ page }) => {
    const input = page.locator('#encoder-input');
    const output = page.locator('#encoder-output');
    const decodeBtn = page.locator('button:has-text("解碼")');

    await output.fill('SGVsbG8gV29ybGQ=');
    await decodeBtn.click();
    await page.waitForTimeout(200);

    const result = await input.inputValue();
    expect(result).toBe('Hello World');
  });

  test('should handle Base64 with special characters', async ({ page }) => {
    const input = page.locator('#encoder-input');
    const output = page.locator('#encoder-output');
    const encodeBtn = page.locator('button:has-text("編碼")');

    await input.fill('<script>alert(1)</script>');
    await encodeBtn.click();
    await page.waitForTimeout(200);

    const result = await output.inputValue();
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toContain('<script>');
  });
});

test.describe('HTML Entity Encoding', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#tools');
    await page.waitForTimeout(300);
    await page.locator('.encoder-type-btn:has-text("HTML Entities")').click();
    await page.waitForTimeout(100);
  });

  test('should encode HTML special characters', async ({ page }) => {
    const input = page.locator('#encoder-input');
    const output = page.locator('#encoder-output');
    const encodeBtn = page.locator('button:has-text("編碼")');

    await input.fill('<script>alert(1)</script>');
    await encodeBtn.click();
    await page.waitForTimeout(200);

    const result = await output.inputValue();
    expect(result).toContain('&#60;'); // < as entity
    expect(result).toContain('&#62;'); // > as entity
  });

  test('should decode HTML entities', async ({ page }) => {
    const input = page.locator('#encoder-input');
    const output = page.locator('#encoder-output');
    const decodeBtn = page.locator('button:has-text("解碼")');

    await output.fill('&#60;script&#62;alert(1)&#60;/script&#62;');
    await decodeBtn.click();
    await page.waitForTimeout(200);

    const result = await input.inputValue();
    expect(result).toContain('<script>');
  });
});

test.describe('Unicode Encoding', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#tools');
    await page.waitForTimeout(300);
    await page.locator('.encoder-type-btn:has-text("Unicode")').click();
    await page.waitForTimeout(100);
  });

  test('should encode to Unicode escape', async ({ page }) => {
    const input = page.locator('#encoder-input');
    const output = page.locator('#encoder-output');
    const encodeBtn = page.locator('button:has-text("編碼")');

    await input.fill('test');
    await encodeBtn.click();
    await page.waitForTimeout(200);

    const result = await output.inputValue();
    expect(result).toContain('\\u');
    expect(result).toMatch(/\\u0074.*\\u0065.*\\u0073.*\\u0074/); // t, e, s, t
  });

  test('should decode Unicode escape', async ({ page }) => {
    const input = page.locator('#encoder-input');
    const output = page.locator('#encoder-output');
    const decodeBtn = page.locator('button:has-text("解碼")');

    await output.fill('\\u0074\\u0065\\u0073\\u0074');
    await decodeBtn.click();
    await page.waitForTimeout(200);

    const result = await input.inputValue();
    expect(result).toBe('test');
  });
});

test.describe('Double URL Encoding', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#tools');
    await page.waitForTimeout(300);
    await page.locator('.encoder-type-btn:has-text("雙重編碼")').click();
    await page.waitForTimeout(100);
  });

  test('should double encode', async ({ page }) => {
    const input = page.locator('#encoder-input');
    const output = page.locator('#encoder-output');
    const encodeBtn = page.locator('button:has-text("編碼")');

    await input.fill('../');
    await encodeBtn.click();
    await page.waitForTimeout(200);

    const result = await output.inputValue();
    // Double encoding: . -> %2E -> %252E
    expect(result).toContain('%25');
  });

  test('should double decode', async ({ page }) => {
    const input = page.locator('#encoder-input');
    const output = page.locator('#encoder-output');
    const decodeBtn = page.locator('button:has-text("解碼")');

    await output.fill('%252E%252E%252F');
    await decodeBtn.click();
    await page.waitForTimeout(200);

    const result = await input.inputValue();
    expect(result).toBe('../');
  });
});

test.describe('Encoder Utility Functions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#tools');
    await page.waitForTimeout(300);
  });

  test('should swap input and output', async ({ page }) => {
    const input = page.locator('#encoder-input');
    const output = page.locator('#encoder-output');
    const swapBtn = page.locator('button:has-text("交換"), button:has-text("⇄")');

    await input.fill('input text');
    await output.fill('output text');
    await swapBtn.click();
    await page.waitForTimeout(200);

    expect(await input.inputValue()).toBe('output text');
    expect(await output.inputValue()).toBe('input text');
  });

  test('should clear both fields', async ({ page }) => {
    const input = page.locator('#encoder-input');
    const output = page.locator('#encoder-output');
    const clearBtn = page.locator('button:has-text("清除")');

    await input.fill('some text');
    await output.fill('some output');
    await clearBtn.click();
    await page.waitForTimeout(200);

    expect(await input.inputValue()).toBe('');
    expect(await output.inputValue()).toBe('');
  });

  test('should auto-encode when switching encoding type', async ({ page }) => {
    const input = page.locator('#encoder-input');
    const output = page.locator('#encoder-output');

    // Enter text with URL encoding selected
    await input.fill('test input');
    await page.locator('button:has-text("編碼")').click();
    await page.waitForTimeout(200);

    const urlResult = await output.inputValue();

    // Switch to Base64
    await page.locator('.encoder-type-btn:has-text("Base64")').click();
    await page.waitForTimeout(300);

    // Output should change to Base64
    const base64Result = await output.inputValue();
    expect(base64Result).not.toBe(urlResult);
  });

  test('should fill input from quick sample buttons', async ({ page }) => {
    const input = page.locator('#encoder-input');
    const sampleBtn = page.locator('[data-encoder-sample]').first();

    await sampleBtn.click();
    await page.waitForTimeout(200);

    const value = await input.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });
});

test.describe('Encoder Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#tools');
    await page.waitForTimeout(300);
  });

  test('should handle empty input gracefully', async ({ page }) => {
    const encodeBtn = page.locator('button:has-text("編碼")');
    await encodeBtn.click();
    await page.waitForTimeout(200);

    // Should not crash, output should be empty
    const output = page.locator('#encoder-output');
    const value = await output.inputValue();
    expect(value).toBe('');
  });

  test('should handle invalid Base64 decode gracefully', async ({ page }) => {
    await page.locator('.encoder-type-btn:has-text("Base64")').click();
    await page.waitForTimeout(100);

    const output = page.locator('#encoder-output');
    const decodeBtn = page.locator('button:has-text("解碼")');

    await output.fill('not-valid-base64!!!');
    await decodeBtn.click();
    await page.waitForTimeout(200);

    // Should show error or handle gracefully
    const input = page.locator('#encoder-input');
    const value = await input.inputValue();
    expect(value).toMatch(/ERROR|error|無法/i);
  });
});
