import { test, expect } from '@playwright/test';

/**
 * WAF Simulator Tests
 *
 * Tests for the WAF detection simulator functionality.
 * Verifies that payloads are correctly detected or allowed.
 */

test.describe('WAF Simulator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#rules');
    await page.waitForTimeout(300);

    // On mobile, scroll the simulator into view
    const input = page.locator('#waf-input');
    await input.scrollIntoViewIfNeeded();
  });

  test('should display the WAF simulator interface', async ({ page }) => {
    // Check for input field
    const input = page.locator('#waf-input');
    await expect(input).toBeVisible();

    // Check for check button
    const checkButton = page.locator('button:has-text("檢測")');
    await expect(checkButton).toBeVisible();

    // Check for output area
    const output = page.locator('#waf-result');
    await expect(output).toBeAttached();
  });

  test('should detect SQL Injection payloads', async ({ page }) => {
    const input = page.locator('#waf-input');
    const checkButton = page.locator('button:has-text("檢測")');

    // Test basic SQL injection
    await input.scrollIntoViewIfNeeded();
    await input.fill("' OR 1=1--");
    await checkButton.click();

    // Wait for result to appear with content
    const output = page.locator('#waf-result');
    await expect(output).not.toBeEmpty({ timeout: 3000 });

    // Should show blocked status
    const outputText = await output.textContent();
    expect(outputText?.toLowerCase()).toMatch(/blocked|阻擋|匹配/i);
  });

  test('should detect UNION SELECT injection', async ({ page }) => {
    const input = page.locator('#waf-input');
    const checkButton = page.locator('button:has-text("檢測")');

    await input.scrollIntoViewIfNeeded();
    await input.fill("UNION SELECT password FROM users");
    await checkButton.click();

    const output = page.locator('#waf-result');
    await expect(output).not.toBeEmpty({ timeout: 3000 });

    const outputText = await output.textContent();
    expect(outputText?.toLowerCase()).toMatch(/blocked|阻擋|匹配|union/i);
  });

  test('should detect XSS payloads', async ({ page }) => {
    const input = page.locator('#waf-input');
    const checkButton = page.locator('button:has-text("檢測")');

    await input.scrollIntoViewIfNeeded();
    await input.fill("<script>alert(1)</script>");
    await checkButton.click();

    const output = page.locator('#waf-result');
    await expect(output).not.toBeEmpty({ timeout: 3000 });

    const outputText = await output.textContent();
    expect(outputText?.toLowerCase()).toMatch(/blocked|阻擋|匹配|xss|script/i);
  });

  test('should detect Command Injection payloads', async ({ page }) => {
    const input = page.locator('#waf-input');
    const checkButton = page.locator('button:has-text("檢測")');

    await input.scrollIntoViewIfNeeded();
    await input.fill("; rm -rf /");
    await checkButton.click();

    const output = page.locator('#waf-result');
    await expect(output).not.toBeEmpty({ timeout: 3000 });

    const outputText = await output.textContent();
    expect(outputText?.toLowerCase()).toMatch(/blocked|阻擋|匹配|command/i);
  });

  test('should detect Path Traversal payloads', async ({ page }) => {
    const input = page.locator('#waf-input');
    const checkButton = page.locator('button:has-text("檢測")');

    await input.scrollIntoViewIfNeeded();
    await input.fill("../../../etc/passwd");
    await checkButton.click();

    const output = page.locator('#waf-result');
    await expect(output).not.toBeEmpty({ timeout: 3000 });

    const outputText = await output.textContent();
    expect(outputText?.toLowerCase()).toMatch(/blocked|阻擋|匹配|path|traversal/i);
  });

  test('should detect SSRF payloads', async ({ page }) => {
    const input = page.locator('#waf-input');
    const checkButton = page.locator('button:has-text("檢測")');

    await input.scrollIntoViewIfNeeded();
    await input.fill("http://169.254.169.254/latest/meta-data/");
    await checkButton.click();

    const output = page.locator('#waf-result');
    await expect(output).not.toBeEmpty({ timeout: 3000 });

    const outputText = await output.textContent();
    expect(outputText?.toLowerCase()).toMatch(/blocked|阻擋|匹配|ssrf|169\.254/i);
  });

  test('should allow benign input', async ({ page }) => {
    const input = page.locator('#waf-input');
    const checkButton = page.locator('button:has-text("檢測")');

    await input.scrollIntoViewIfNeeded();
    await input.fill("Hello World");
    await checkButton.click();

    const output = page.locator('#waf-result');
    await expect(output).not.toBeEmpty({ timeout: 3000 });

    const outputText = await output.textContent();
    // Should not show blocked status for benign input
    expect(outputText?.toLowerCase()).toMatch(/allowed|通過|沒有匹配|無匹配|0.*匹配/i);
  });

  test('should handle empty input gracefully', async ({ page }) => {
    const input = page.locator('#waf-input');
    const checkButton = page.locator('button:has-text("檢測")');

    await input.fill("");
    await checkButton.click();
    await page.waitForTimeout(200);

    // Should not crash, output should still be present
    const output = page.locator('#waf-result');
    await expect(output).toBeAttached();
  });

  test('should work with quick test buttons', async ({ page }) => {
    // Find quick test buttons with data-payload attribute
    const quickButtons = page.locator('button[data-payload]');
    await expect(quickButtons.first()).toBeVisible();

    const count = await quickButtons.count();
    expect(count).toBeGreaterThan(0);

    // Click first quick test button and wait for input to be filled
    const input = page.locator('#waf-input');
    await quickButtons.first().click();

    // Wait for the input to have a value (the click handler sets it)
    await expect(input).not.toHaveValue('', { timeout: 2000 });

    const value = await input.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });
});

test.describe('WAF Rules Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#rules');
    await page.waitForTimeout(300);
  });

  test('should display WAF rule examples', async ({ page }) => {
    // Check for code blocks showing rules
    const codeBlocks = page.locator('.code-block');
    const count = await codeBlocks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show ModSecurity rule syntax', async ({ page }) => {
    const pageContent = await page.content();
    // Should contain ModSecurity-related content
    expect(pageContent).toMatch(/SecRule|ModSecurity|OWASP|CRS/i);
  });
});
