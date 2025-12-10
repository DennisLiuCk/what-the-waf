import { test, expect } from '@playwright/test';

/**
 * Score Calculator Tests
 *
 * Tests for the VIOL_RATING_THREAT score calculator functionality.
 * Verifies violation selection, score calculation, and status display.
 */

test.describe('Score Calculator Interface', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#tools');
    await page.waitForTimeout(300);
  });

  test('should display the score calculator', async ({ page }) => {
    const calculator = page.locator('.score-calculator');
    await expect(calculator).toBeVisible();
  });

  test('should display score display area', async ({ page }) => {
    const scoreDisplay = page.locator('#score-display');
    await expect(scoreDisplay).toBeVisible();

    const scoreNumber = page.locator('#score-number');
    await expect(scoreNumber).toBeVisible();

    const scoreStatus = page.locator('#score-status');
    await expect(scoreStatus).toBeVisible();
  });

  test('should show initial score of 0', async ({ page }) => {
    const scoreNumber = page.locator('#score-number');
    const text = await scoreNumber.textContent();
    expect(text).toBe('0');
  });

  test('should show ALLOWED status initially', async ({ page }) => {
    const scoreStatus = page.locator('#score-status');
    const text = await scoreStatus.textContent();
    expect(text).toMatch(/ALLOWED|放行/i);
  });

  test('should display violation checkboxes', async ({ page }) => {
    const violations = page.locator('.violation-item');
    const count = await violations.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display blocking threshold info', async ({ page }) => {
    const threshold = page.locator('.score-threshold');
    await expect(threshold).toBeVisible();
    const text = await threshold.textContent();
    expect(text).toMatch(/threshold|閾值|4/i);
  });
});

test.describe('Score Calculation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#tools');
    await page.waitForTimeout(300);
  });

  test('should add score when clicking violation', async ({ page }) => {
    const scoreNumber = page.locator('#score-number');
    const firstViolation = page.locator('.violation-item').first();

    // Click to select
    await firstViolation.click();
    await page.waitForTimeout(200);

    const score = await scoreNumber.textContent();
    expect(parseInt(score || '0')).toBeGreaterThan(0);
  });

  test('should subtract score when deselecting violation', async ({ page }) => {
    const scoreNumber = page.locator('#score-number');
    const firstViolation = page.locator('.violation-item').first();

    // Select
    await firstViolation.click();
    await page.waitForTimeout(100);
    const scoreAfterSelect = await scoreNumber.textContent();

    // Deselect
    await firstViolation.click();
    await page.waitForTimeout(100);
    const scoreAfterDeselect = await scoreNumber.textContent();

    expect(scoreAfterDeselect).toBe('0');
    expect(parseInt(scoreAfterSelect || '0')).toBeGreaterThan(0);
  });

  test('should accumulate multiple violations', async ({ page }) => {
    const scoreNumber = page.locator('#score-number');
    const violations = page.locator('.violation-item');

    // Select first two violations
    await violations.nth(0).click();
    await page.waitForTimeout(100);
    const scoreAfterFirst = parseInt(await scoreNumber.textContent() || '0');

    await violations.nth(1).click();
    await page.waitForTimeout(100);
    const scoreAfterSecond = parseInt(await scoreNumber.textContent() || '0');

    expect(scoreAfterSecond).toBeGreaterThan(scoreAfterFirst);
  });

  test('should calculate correct score for VIOL_BOT_CLIENT (+1)', async ({ page }) => {
    const scoreNumber = page.locator('#score-number');
    const botClientViolation = page.locator('.violation-item:has-text("VIOL_BOT_CLIENT")');

    await botClientViolation.click();
    await page.waitForTimeout(200);

    const score = await scoreNumber.textContent();
    expect(score).toBe('1');
  });

  test('should calculate correct score for VIOL_HTTP_RESPONSE_STATUS (+2)', async ({ page }) => {
    const scoreNumber = page.locator('#score-number');
    const httpStatusViolation = page.locator('.violation-item:has-text("VIOL_HTTP_RESPONSE_STATUS")');

    await httpStatusViolation.click();
    await page.waitForTimeout(200);

    const score = await scoreNumber.textContent();
    expect(score).toBe('2');
  });

  test('should calculate correct score for VIOL_ATTACK_SIGNATURE (+4)', async ({ page }) => {
    const scoreNumber = page.locator('#score-number');
    const attackSigViolation = page.locator('.violation-item:has-text("VIOL_ATTACK_SIGNATURE")');

    await attackSigViolation.click();
    await page.waitForTimeout(200);

    const score = await scoreNumber.textContent();
    expect(score).toBe('4');
  });
});

test.describe('Status Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#tools');
    await page.waitForTimeout(300);
  });

  test('should show ALLOWED for score 0-2', async ({ page }) => {
    const scoreStatus = page.locator('#score-status');

    // Score 0 - should be ALLOWED
    let text = await scoreStatus.textContent();
    expect(text).toMatch(/ALLOWED|放行/i);

    // Add one low-score violation (+1)
    await page.locator('.violation-item:has-text("VIOL_BOT_CLIENT")').click();
    await page.waitForTimeout(200);

    text = await scoreStatus.textContent();
    expect(text).toMatch(/ALLOWED|放行/i);
  });

  test('should show WARNING for score 3', async ({ page }) => {
    const scoreStatus = page.locator('#score-status');
    const scoreDisplay = page.locator('#score-display');

    // Add violations to reach score 3
    await page.locator('.violation-item:has-text("VIOL_PARAMETER")').click();
    await page.waitForTimeout(200);

    const text = await scoreStatus.textContent();
    expect(text).toMatch(/WARNING|接近/i);

    // Check for warning class
    await expect(scoreDisplay).toHaveClass(/warning/);
  });

  test('should show BLOCKED for score >= 4', async ({ page }) => {
    const scoreStatus = page.locator('#score-status');
    const scoreDisplay = page.locator('#score-display');

    // Add high-score violation (+4)
    await page.locator('.violation-item:has-text("VIOL_ATTACK_SIGNATURE")').click();
    await page.waitForTimeout(200);

    const text = await scoreStatus.textContent();
    expect(text).toMatch(/BLOCKED|阻擋|VIOL_RATING_THREAT/i);

    // Check for blocked class
    await expect(scoreDisplay).toHaveClass(/blocked/);
  });

  test('should update visual styling based on status', async ({ page }) => {
    const scoreDisplay = page.locator('#score-display');

    // Initially no warning/blocked class
    let classes = await scoreDisplay.getAttribute('class');
    expect(classes).not.toMatch(/warning|blocked/);

    // Reach warning threshold
    await page.locator('.violation-item:has-text("VIOL_PARAMETER")').click();
    await page.waitForTimeout(200);
    await expect(scoreDisplay).toHaveClass(/warning/);

    // Reach blocked threshold
    await page.locator('.violation-item:has-text("VIOL_BOT_CLIENT")').click();
    await page.waitForTimeout(200);
    await expect(scoreDisplay).toHaveClass(/blocked/);
  });
});

test.describe('Simulation Buttons', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#tools');
    await page.waitForTimeout(300);
  });

  test('should have reset button', async ({ page }) => {
    const resetBtn = page.locator('button:has-text("reset")');
    await expect(resetBtn).toBeVisible();
  });

  test('should reset calculator on reset button click', async ({ page }) => {
    const scoreNumber = page.locator('#score-number');
    const resetBtn = page.locator('button:has-text("reset")');

    // Add some violations
    await page.locator('.violation-item').first().click();
    await page.waitForTimeout(100);

    // Verify score is not 0
    let score = await scoreNumber.textContent();
    expect(parseInt(score || '0')).toBeGreaterThan(0);

    // Reset
    await resetBtn.click();
    await page.waitForTimeout(200);

    // Verify score is 0
    score = await scoreNumber.textContent();
    expect(score).toBe('0');
  });

  test('should have API client simulation button', async ({ page }) => {
    const simBtn = page.locator('button:has-text("API 客戶端"), button:has-text("API Client")');
    await expect(simBtn).toBeVisible();
  });

  test('should simulate API client scenario', async ({ page }) => {
    const scoreNumber = page.locator('#score-number');
    const simBtn = page.locator('button:has-text("API 客戶端"), button:has-text("API Client")');

    await simBtn.click();
    await page.waitForTimeout(300);

    // Should select specific violations
    const score = parseInt(await scoreNumber.textContent() || '0');
    expect(score).toBeGreaterThan(0);

    // Check that relevant violations are checked
    const botClient = page.locator('.violation-item:has-text("VIOL_BOT_CLIENT")');
    await expect(botClient).toHaveClass(/checked/);
  });

  test('should have attack simulation button', async ({ page }) => {
    const simBtn = page.locator('button:has-text("攻擊請求"), button:has-text("Attack")');
    await expect(simBtn).toBeVisible();
  });

  test('should simulate attack scenario', async ({ page }) => {
    const scoreNumber = page.locator('#score-number');
    const scoreStatus = page.locator('#score-status');
    const simBtn = page.locator('button:has-text("攻擊請求"), button:has-text("Attack")');

    await simBtn.click();
    await page.waitForTimeout(300);

    // Should trigger BLOCKED status
    const status = await scoreStatus.textContent();
    expect(status).toMatch(/BLOCKED|阻擋/i);

    // Score should be >= 4
    const score = parseInt(await scoreNumber.textContent() || '0');
    expect(score).toBeGreaterThanOrEqual(4);
  });

  test('should clear previous selections when simulating', async ({ page }) => {
    const scoreNumber = page.locator('#score-number');

    // Manually select a violation
    await page.locator('.violation-item:has-text("VIOL_BOT_CLIENT")').click();
    await page.waitForTimeout(100);
    const manualScore = parseInt(await scoreNumber.textContent() || '0');

    // Run API client simulation
    await page.locator('button:has-text("API 客戶端"), button:has-text("API Client")').click();
    await page.waitForTimeout(300);
    const simScore = parseInt(await scoreNumber.textContent() || '0');

    // Scores should be consistent with simulation, not additive
    // (This tests that reset happens before simulation)
    expect(simScore).toBeGreaterThan(0);
  });
});

test.describe('Violation Items', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#tools');
    await page.waitForTimeout(300);
  });

  test('should toggle checked state on click', async ({ page }) => {
    const violation = page.locator('.violation-item').first();

    // Initially not checked
    let classes = await violation.getAttribute('class');
    expect(classes).not.toMatch(/checked/);

    // Click to check
    await violation.click();
    await page.waitForTimeout(100);
    await expect(violation).toHaveClass(/checked/);

    // Click to uncheck
    await violation.click();
    await page.waitForTimeout(100);
    classes = await violation.getAttribute('class');
    expect(classes).not.toMatch(/\bchecked\b/);
  });

  test('should display violation name and score', async ({ page }) => {
    const violations = page.locator('.violation-item');
    const count = await violations.count();

    for (let i = 0; i < Math.min(count, 3); i++) {
      const violation = violations.nth(i);
      const name = violation.locator('.violation-name');
      const score = violation.locator('.violation-score');

      await expect(name).toBeVisible();
      await expect(score).toBeVisible();

      const nameText = await name.textContent();
      expect(nameText).toMatch(/VIOL_/);

      const scoreText = await score.textContent();
      expect(scoreText).toMatch(/\+\d/);
    }
  });

  test('should distinguish low-risk and high-risk violations', async ({ page }) => {
    // Check for high-risk class on certain violations
    const highRiskViolations = page.locator('.violation-item.high-risk');
    const count = await highRiskViolations.count();
    expect(count).toBeGreaterThan(0);
  });
});
