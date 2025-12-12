import { test, expect } from '@playwright/test';

/**
 * Bypass Challenge Tests
 *
 * Tests for the 5-level WAF bypass challenge system.
 * Verifies challenge loading, validation, and progression.
 */

test.describe('Challenge System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#challenge');
    await page.waitForTimeout(300);
  });

  test('should display the challenge interface', async ({ page }) => {
    // Check for challenge container
    const container = page.locator('.challenge-container');
    await expect(container).toBeVisible();

    // Check for level buttons
    const levelButtons = page.locator('.level-btn');
    await expect(levelButtons).toHaveCount(5);

    // Check for challenge description
    const description = page.locator('#challenge-description');
    await expect(description).toBeVisible();

    // Check for input field
    const input = page.locator('#challenge-input');
    await expect(input).toBeVisible();

    // Check for submit button
    const submitButton = page.locator('button:has-text("./exploit")');
    await expect(submitButton).toBeVisible();
  });

  test('should display all 5 level buttons', async ({ page }) => {
    const levelButtons = page.locator('.level-btn');

    for (let i = 1; i <= 5; i++) {
      const button = page.locator(`.level-btn:has-text("Level ${i}")`);
      await expect(button).toBeVisible();
    }
  });

  test('should show level 1 by default', async ({ page }) => {
    const level1Button = page.locator('.level-btn').first();
    await expect(level1Button).toHaveClass(/active/);
  });

  test('should switch levels when clicking level buttons', async ({ page }) => {
    const level2Button = page.locator('.level-btn[data-level="1"]');
    await level2Button.click();
    await page.waitForTimeout(200);

    await expect(level2Button).toHaveClass(/active/);

    // First button should no longer be active
    const level1Button = page.locator('.level-btn[data-level="0"]');
    const level1Class = await level1Button.getAttribute('class');
    expect(level1Class).not.toMatch(/\bactive\b/);
  });

  test('should update challenge description when switching levels', async ({ page }) => {
    const description = page.locator('#challenge-description');
    const initialText = await description.textContent();

    // Switch to level 2
    await page.locator('.level-btn[data-level="1"]').click();
    await page.waitForTimeout(200);

    const newText = await description.textContent();
    expect(newText).not.toBe(initialText);
  });

  test('should show hint when clicking hint button', async ({ page }) => {
    const hintButton = page.locator('button:has-text("提示")');
    const hint = page.locator('#challenge-hint');

    // Initially hint might be hidden
    await hintButton.click();
    await page.waitForTimeout(200);

    // Hint should now be visible
    await expect(hint).toHaveClass(/show/);
  });

  test('should show error for empty submission', async ({ page }) => {
    const input = page.locator('#challenge-input');
    const submitButton = page.locator('button:has-text("./exploit")');

    await input.fill('');
    await submitButton.click();
    await page.waitForTimeout(200);

    // Should show error result
    const result = page.locator('#challenge-result');
    await expect(result).toHaveClass(/show/);
  });

  test('should display completion counter', async ({ page }) => {
    const counter = page.locator('#challenge-completed');
    await expect(counter).toBeVisible();
    const text = await counter.textContent();
    expect(text).toMatch(/\d/);
  });
});

test.describe('Challenge Level 1 - Case Variation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#challenge');
    await page.waitForTimeout(300);
    // Ensure level 1 is selected
    await page.locator('.level-btn[data-level="0"]').click();
    await page.waitForTimeout(200);
  });

  test('should accept valid case variation bypass', async ({ page }) => {
    const input = page.locator('#challenge-input');
    const submitButton = page.locator('button:has-text("./exploit")');

    // Use uppercase to bypass case-sensitive rule
    await input.fill('<SCRIPT>alert(1)</SCRIPT>');
    await submitButton.click();
    await page.waitForTimeout(300);

    // Should show success
    const result = page.locator('#challenge-result');
    await expect(result).toHaveClass(/show/);
    const resultClass = await result.getAttribute('class');
    expect(resultClass).toMatch(/success/);
  });

  test('should reject payload that triggers rule', async ({ page }) => {
    const input = page.locator('#challenge-input');
    const submitButton = page.locator('button:has-text("./exploit")');

    // Lowercase will be caught by the rule
    await input.fill('<script>alert(1)</script>');
    await submitButton.click();
    await page.waitForTimeout(300);

    // Should show failure
    const result = page.locator('#challenge-result');
    await expect(result).toHaveClass(/show/);
    const resultClass = await result.getAttribute('class');
    expect(resultClass).toMatch(/fail/);
  });
});

test.describe('Challenge Level 2 - URL Encoding', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#challenge');
    await page.waitForTimeout(300);
    await page.locator('.level-btn[data-level="1"]').click();
    await page.waitForTimeout(200);
  });

  test('should accept URL encoded path traversal', async ({ page }) => {
    const input = page.locator('#challenge-input');
    const submitButton = page.locator('button:has-text("./exploit")');

    // URL encoded ../
    await input.fill('%2e%2e%2f%2e%2e%2f%2e%2e%2fetc/passwd');
    await submitButton.click();
    await page.waitForTimeout(300);

    const result = page.locator('#challenge-result');
    await expect(result).toHaveClass(/show/);
    const resultClass = await result.getAttribute('class');
    expect(resultClass).toMatch(/success/);
  });

  test('should reject literal path traversal', async ({ page }) => {
    const input = page.locator('#challenge-input');
    const submitButton = page.locator('button:has-text("./exploit")');

    await input.fill('../../../etc/passwd');
    await submitButton.click();
    await page.waitForTimeout(300);

    const result = page.locator('#challenge-result');
    await expect(result).toHaveClass(/show/);
    const resultClass = await result.getAttribute('class');
    expect(resultClass).toMatch(/fail/);
  });
});

test.describe('Challenge Level 3 - SQL Comment Bypass', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#challenge');
    await page.waitForTimeout(300);
    await page.locator('.level-btn[data-level="2"]').click();
    await page.waitForTimeout(200);
  });

  test('should accept SQL comment bypass', async ({ page }) => {
    const input = page.locator('#challenge-input');
    const submitButton = page.locator('button:has-text("./exploit")');

    await input.fill('UNION/**/SELECT');
    await submitButton.click();
    await page.waitForTimeout(300);

    const result = page.locator('#challenge-result');
    await expect(result).toHaveClass(/show/);
    const resultClass = await result.getAttribute('class');
    expect(resultClass).toMatch(/success/);
  });

  test('should reject direct UNION SELECT', async ({ page }) => {
    const input = page.locator('#challenge-input');
    const submitButton = page.locator('button:has-text("./exploit")');

    await input.fill('UNION SELECT');
    await submitButton.click();
    await page.waitForTimeout(300);

    const result = page.locator('#challenge-result');
    await expect(result).toHaveClass(/show/);
    const resultClass = await result.getAttribute('class');
    expect(resultClass).toMatch(/fail/);
  });
});

test.describe('Challenge Level 4 - HTML Tag Manipulation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#challenge');
    await page.waitForTimeout(300);
    await page.locator('.level-btn[data-level="3"]').click();
    await page.waitForTimeout(200);
  });

  test('should accept HTML tag with slash', async ({ page }) => {
    const input = page.locator('#challenge-input');
    const submitButton = page.locator('button:has-text("./exploit")');

    await input.fill('<img/src=x onerror=alert(1)>');
    await submitButton.click();
    await page.waitForTimeout(300);

    const result = page.locator('#challenge-result');
    await expect(result).toHaveClass(/show/);
    const resultClass = await result.getAttribute('class');
    expect(resultClass).toMatch(/success/);
  });
});

test.describe('Challenge Level 5 - Advanced Multi-technique', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#challenge');
    await page.waitForTimeout(300);

    // On mobile viewports, scroll the level buttons into view first
    const level5Button = page.locator('.level-btn[data-level="4"]');
    await level5Button.scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);

    // Click with force to avoid interception issues on mobile
    await level5Button.click({ force: true });
    await page.waitForTimeout(200);

    // Verify we're on Level 5 by checking button is active
    await expect(level5Button).toHaveClass(/active/);
  });

  test('should accept encoded SQL injection bypass', async ({ page }) => {
    const input = page.locator('#challenge-input');
    const submitButton = page.locator('button:has-text("./exploit")');

    // Scroll input into view on mobile
    await input.scrollIntoViewIfNeeded();
    await input.fill('%27%20OR%201=1%23');
    await submitButton.click();
    await page.waitForTimeout(300);

    const result = page.locator('#challenge-result');
    await expect(result).toHaveClass(/show/);
    const resultClass = await result.getAttribute('class');
    expect(resultClass).toMatch(/success/);
  });

  test('should reject direct SQL injection', async ({ page }) => {
    const input = page.locator('#challenge-input');
    const submitButton = page.locator('button:has-text("./exploit")');

    await input.scrollIntoViewIfNeeded();
    await input.fill("' OR 1=1--");
    await submitButton.click();
    await page.waitForTimeout(300);

    const result = page.locator('#challenge-result');
    await expect(result).toHaveClass(/show/);
    const resultClass = await result.getAttribute('class');
    expect(resultClass).toMatch(/fail/);
  });
});

test.describe('Challenge Defense Recommendations', () => {
  test('should show defense tips after completing a challenge', async ({ page }) => {
    await page.goto('/#challenge');
    await page.waitForTimeout(300);

    // Complete level 1
    await page.locator('.level-btn[data-level="0"]').click();
    await page.waitForTimeout(200);

    const input = page.locator('#challenge-input');
    await input.fill('<SCRIPT>alert(1)</SCRIPT>');
    await page.locator('button:has-text("./exploit")').click();
    await page.waitForTimeout(300);

    // Defense section should be updated
    const defense = page.locator('#challenge-defense');
    const defenseText = await defense.textContent();
    expect(defenseText?.length).toBeGreaterThan(10);
  });
});
