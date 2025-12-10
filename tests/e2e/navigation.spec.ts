import { test, expect } from '@playwright/test';

/**
 * Navigation and UI Tests
 *
 * Tests for basic page structure, navigation links, and UI components.
 */

test.describe('Page Load and Basic Structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the page successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/What The WAF/i);
  });

  test('should display the hero section with ASCII art', async ({ page }) => {
    const heroSection = page.locator('.hero');
    await expect(heroSection).toBeVisible();

    // Check for ASCII art title
    const asciiArt = page.locator('.hero-ascii');
    await expect(asciiArt).toBeVisible();
  });

  test('should display navigation bar with all links', async ({ page }) => {
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    // Check all navigation links exist
    const navLinks = [
      { text: 'intro', href: '#intro' },
      { text: 'attacks', href: '#attacks' },
      { text: 'rules', href: '#rules' },
      { text: 'bypass', href: '#bypass' },
      { text: 'tools', href: '#tools' },
      { text: 'challenge', href: '#challenge' },
      { text: 'quiz', href: '#quiz' },
    ];

    for (const link of navLinks) {
      const navLink = nav.locator(`a[href="${link.href}"]`);
      await expect(navLink).toBeVisible();
    }
  });

  test('should have all main sections', async ({ page }) => {
    const sections = ['#intro', '#attacks', '#rules', '#bypass', '#tools', '#challenge', '#quiz'];

    for (const sectionId of sections) {
      const section = page.locator(sectionId);
      await expect(section).toBeAttached();
    }
  });
});

test.describe('Navigation Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should scroll to section when clicking nav links', async ({ page }) => {
    // Click on "攻擊類型" link
    await page.click('nav a[href="#attacks"]');

    // Wait for smooth scroll
    await page.waitForTimeout(500);

    // Check if the attacks section is in viewport
    const attacksSection = page.locator('#attacks');
    await expect(attacksSection).toBeInViewport();
  });

  test('should scroll to challenge section from CTA button', async ({ page }) => {
    // Find and click the CTA button in hero
    const ctaButton = page.locator('.hero a[href="#challenge"]');
    if (await ctaButton.isVisible()) {
      await ctaButton.click();
      await page.waitForTimeout(500);
      const challengeSection = page.locator('#challenge');
      await expect(challengeSection).toBeInViewport();
    }
  });
});

test.describe('Accordion Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should toggle accordion on click', async ({ page }) => {
    // Navigate to a section with accordions
    await page.goto('/#viol-rating');
    await page.waitForTimeout(300);

    // Find an accordion that is not active
    const accordion = page.locator('.accordion').first();
    const accordionHeader = accordion.locator('.accordion-header');
    const accordionContent = accordion.locator('.accordion-content');

    // Check initial state - first accordion might be active by default
    const isInitiallyActive = await accordion.evaluate((el) => el.classList.contains('active'));

    // Click to toggle
    await accordionHeader.click();
    await page.waitForTimeout(300);

    // Verify toggle happened
    const isActiveAfterClick = await accordion.evaluate((el) => el.classList.contains('active'));
    expect(isActiveAfterClick).toBe(!isInitiallyActive);
  });
});

test.describe('Tab Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should switch tabs in attack types section', async ({ page }) => {
    // Navigate to attacks section
    await page.goto('/#attacks');
    await page.waitForTimeout(300);

    // Find tab buttons
    const tabButtons = page.locator('.tab-btn');
    const tabCount = await tabButtons.count();

    if (tabCount > 1) {
      // Click second tab
      await tabButtons.nth(1).click();
      await page.waitForTimeout(200);

      // Verify second tab is now active
      await expect(tabButtons.nth(1)).toHaveClass(/active/);

      // Verify first tab is not active
      const firstTabClass = await tabButtons.nth(0).getAttribute('class');
      expect(firstTabClass).not.toContain('active');
    }
  });

  test('should display correct content when switching tabs', async ({ page }) => {
    await page.goto('/#attacks');
    await page.waitForTimeout(300);

    const tabButtons = page.locator('.tab-btn');
    const tabContents = page.locator('.tab-content');

    if (await tabButtons.count() > 0) {
      // Click first tab to ensure it's active
      await tabButtons.first().click();
      await page.waitForTimeout(200);

      // Check that corresponding content is visible
      const activeContent = page.locator('.tab-content.active');
      await expect(activeContent).toBeVisible();
    }
  });
});

test.describe('Responsive Design', () => {
  test('should display properly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Hero section should still be visible
    await expect(page.locator('.hero')).toBeVisible();

    // Navigation should be visible (might be collapsed)
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should display properly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    await expect(page.locator('.hero')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should display properly on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    await expect(page.locator('.hero')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
  });
});

test.describe('External Links', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have proper security attributes on external links', async ({ page }) => {
    // Find all external links
    const externalLinks = page.locator('a[target="_blank"]');
    const count = await externalLinks.count();

    for (let i = 0; i < count; i++) {
      const link = externalLinks.nth(i);
      const rel = await link.getAttribute('rel');

      // External links should have noopener for security
      if (rel) {
        expect(rel).toMatch(/noopener|noreferrer/);
      }
    }
  });
});
