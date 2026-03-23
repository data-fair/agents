import { test } from '@playwright/test'

test('debug css sizes', async ({ page }) => {
  await page.goto('http://feat-upgrade-ui.localhost:9553/agents/user/albanm/chat')
  await page.waitForTimeout(3000)

  const cssDebug = await page.evaluate(() => {
    const results: any = {}

    const btn = document.querySelector('.v-btn--size-default') as HTMLElement
    if (btn) {
      results.btnComputedFontSize = getComputedStyle(btn).fontSize
      results.btnVarBtnSize = getComputedStyle(btn).getPropertyValue('--v-btn-size')
      results.btnVarBtnHeight = getComputedStyle(btn).getPropertyValue('--v-btn-height')

      // Find ALL rules that set font-size and match this button
      results.allFontSizeRules = []
      for (const sheet of document.styleSheets) {
        try {
          const checkRules = (rules: CSSRuleList, layerName: string) => {
            for (const rule of rules) {
              if (rule instanceof CSSLayerBlockRule) {
                checkRules(rule.cssRules, (rule as any).name || 'unknown')
              } else if (rule instanceof CSSStyleRule) {
                if (rule.style.fontSize && btn.matches(rule.selectorText)) {
                  results.allFontSizeRules.push({
                    layer: layerName,
                    selector: rule.selectorText,
                    fontSize: rule.style.fontSize,
                    specificity: (rule.selectorText.split('.').length - 1) + '/' + (rule.selectorText.split('#').length - 1)
                  })
                }
              }
            }
          }
          checkRules(sheet.cssRules, 'none')
        } catch (e) {}
      }

      // Check parent chain font-sizes
      results.parentChain = []
      let el: HTMLElement | null = btn
      while (el) {
        results.parentChain.push({
          tag: el.tagName,
          classes: el.className?.toString().slice(0, 100),
          computedFontSize: getComputedStyle(el).fontSize
        })
        el = el.parentElement
      }
    }

    return results
  })

  console.log('CSS DEBUG RESULTS:')
  console.log(JSON.stringify(cssDebug, null, 2))
})
