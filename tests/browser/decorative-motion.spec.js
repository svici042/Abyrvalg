import { test, expect } from '@playwright/test'
import { mockApi } from './fixtures'

async function rotationAngle(locator) {
  return locator.evaluate((element) => {
    const { a, b } = new DOMMatrixReadOnly(getComputedStyle(element).transform)
    return (Math.atan2(b, a) * 180) / Math.PI
  })
}

function angleChange(start, end) {
  return ((end - start + 540) % 360) - 180
}

for (const theme of ['light', 'dark']) {
  for (const width of [1440, 375]) {
    test(`hero star and orbit rotate independently in ${theme} at ${width}px`, async ({
      page,
    }) => {
      await mockApi(page)
      await page.setViewportSize({ width, height: 900 })
      await page.addInitScript((savedTheme) => {
        localStorage.setItem('abyrvalg-theme', JSON.stringify(savedTheme))
      }, theme)
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      await page.goto('/')

      const art = page.locator('[class*="_art_"]')
      const star = page.locator('span[class*="_star_"]')
      const orbit = page.locator('span[class*="_orbit_"]')
      await expect(art).toBeVisible()
      await expect(star).toBeVisible()
      await expect(orbit).toBeVisible()
      await expect(art).toHaveAttribute('aria-hidden', 'true')
      expect(
        await star.evaluate((el) => getComputedStyle(el).animationDuration),
      ).toBe('40s')
      expect(
        await orbit.evaluate((el) => getComputedStyle(el).animationDuration),
      ).toBe('60s')

      if (width < 500) {
        const textBox = await page
          .locator('[class*="_hero_"] > div:first-child')
          .boundingBox()
        const artBox = await art.boundingBox()
        expect(artBox.y).toBeGreaterThanOrEqual(textBox.y + textBox.height - 1)
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true)
      }

      const starStart = await rotationAngle(star)
      const orbitStart = await rotationAngle(orbit)
      await page.waitForTimeout(700)
      expect(angleChange(starStart, await rotationAngle(star))).toBeGreaterThan(
        0,
      )
      expect(angleChange(orbitStart, await rotationAngle(orbit))).toBeLessThan(
        0,
      )

      await page.screenshot({
        path: `test-results/decoration-${theme}-${width}.png`,
        fullPage: true,
      })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await expect
        .poll(() => star.evaluate((el) => getComputedStyle(el).animationName))
        .toBe('none')
      await expect
        .poll(() => orbit.evaluate((el) => getComputedStyle(el).animationName))
        .toBe('none')
    })
  }
}
