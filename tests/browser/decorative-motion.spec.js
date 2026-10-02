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

for (const language of ['nb', 'en']) {
  for (const theme of ['light', 'dark']) {
    for (const width of [1440, 375]) {
      test(`hero star and orbit rotate independently in ${language}/${theme} at ${width}px`, async ({
        page,
      }) => {
        await mockApi(page)
        await page.setViewportSize({ width, height: 900 })
        await page.addInitScript(
          ({ savedTheme, language }) => {
            localStorage.setItem('abyrvalg-language', JSON.stringify(language))
            localStorage.setItem('abyrvalg-theme', JSON.stringify(savedTheme))
          },
          { savedTheme: theme, language },
        )
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
          expect(artBox.y).toBeGreaterThanOrEqual(
            textBox.y + textBox.height - 1,
          )
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          ).toBe(true)
        }

        const starStart = await rotationAngle(star)
        const orbitStart = await rotationAngle(orbit)
        await page.waitForTimeout(700)
        expect(
          angleChange(starStart, await rotationAngle(star)),
        ).toBeGreaterThan(0)
        expect(
          angleChange(orbitStart, await rotationAngle(orbit)),
        ).toBeLessThan(0)

        await page.screenshot({
          path: `test-results/decoration-${theme}-${width}.png`,
          fullPage: true,
        })
        const pause = page.getByRole('button', {
          name:
            language === 'nb' ? 'Sett animasjonen på pause' : 'Pause animation',
        })
        await pause.focus()
        expect(
          await pause.evaluate((el) => getComputedStyle(el).outlineStyle),
        ).not.toBe('none')
        await page.keyboard.press('Enter')
        await expect(star).toHaveCSS('animation-play-state', 'paused')
        await expect(orbit).toHaveCSS('animation-play-state', 'paused')
        const stopped = await rotationAngle(star)
        const stoppedOrbit = await rotationAngle(orbit)
        const box = await art.boundingBox()
        await page.waitForTimeout(300)
        expect(await rotationAngle(star)).toBeCloseTo(stopped, 2)
        expect(await rotationAngle(orbit)).toBeCloseTo(stoppedOrbit, 2)
        await page
          .getByRole('link', { name: /Demo.*administra/i, exact: true })
          .click()
        await page
          .getByRole('link', { name: /^Abyrvalg.*(hjem|home)/i })
          .first()
          .click()
        await expect(star).toHaveCSS('animation-play-state', 'paused')
        await page
          .getByRole('button', {
            name:
              language === 'nb' ? 'Fortsett animasjonen' : 'Resume animation',
          })
          .click()
        await expect(star).toHaveCSS('animation-play-state', 'running')
        expect((await art.boundingBox()).height).toBeCloseTo(box.height, 0)
        await page.emulateMedia({ reducedMotion: 'reduce' })
        await expect
          .poll(() => star.evaluate((el) => getComputedStyle(el).animationName))
          .toBe('none')
        await expect
          .poll(() =>
            orbit.evaluate((el) => getComputedStyle(el).animationName),
          )
          .toBe('none')
        await expect(
          page.getByRole('button', {
            name:
              language === 'nb'
                ? 'Animasjonen er stoppet av systeminnstillingen'
                : 'Animation paused by system preference',
          }),
        ).toBeDisabled()
        await page.emulateMedia({ reducedMotion: 'no-preference' })
        await expect(star).toHaveCSS('animation-duration', '40s')
        await page.emulateMedia({ reducedMotion: 'reduce' })
        await page.reload()
        await expect(star).toHaveCSS('animation-name', 'none')
        await expect(orbit).toHaveCSS('animation-name', 'none')
      })
    }
  }
}
