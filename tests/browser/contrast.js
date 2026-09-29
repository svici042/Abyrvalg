// WCAG relative luminance for opaque, computed sRGB colours.
export function contrast(first, second) {
  function luminance(color) {
    const channels = color
      .match(/[\d.]+/g)
      .slice(0, 3)
      .map(Number)
      .map((value) => {
        const channel = value / 255
        return channel <= 0.04045
          ? channel / 12.92
          : ((channel + 0.055) / 1.055) ** 2.4
      })
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
  }
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a)
  return (values[0] + 0.05) / (values[1] + 0.05)
}

export async function renderedPair(
  locator,
  foreground = 'color',
  background = 'backgroundColor',
  pseudo = null,
) {
  return locator.evaluate(
    (element, { foreground, background, pseudo }) => {
      const style = getComputedStyle(element, pseudo)
      let surface = element
      let fill = getComputedStyle(surface)[background]
      while ((!fill || fill === 'rgba(0, 0, 0, 0)') && surface.parentElement) {
        surface = surface.parentElement
        fill = getComputedStyle(surface)[background]
      }
      return [style[foreground], fill]
    },
    { foreground, background, pseudo },
  )
}
