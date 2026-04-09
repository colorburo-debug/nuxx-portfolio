const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  
  await page.goto('http://localhost:8000/project-lauhaus.html');
  await page.waitForLoadState('networkidle');

  const data = await page.evaluate(() => {
    const sliders = document.querySelectorAll('.mobile-slider-wrapper');
    const results = [];
    
    sliders.forEach((wrapper, idx) => {
      const slider = wrapper.querySelector('.mobile-slider');
      const indicator = wrapper.querySelector('.swipe-indicator');
      const firstImage = slider ? slider.querySelector('img') : null;
      
      const sliderRect = slider ? slider.getBoundingClientRect() : null;
      const indicatorRect = indicator ? indicator.getBoundingClientRect() : null;
      const firstImgRect = firstImage ? firstImage.getBoundingClientRect() : null;
      const computedSlider = slider ? window.getComputedStyle(slider) : null;
      
      results.push({
        index: idx,
        hasSlider: !!slider,
        hasIndicator: !!indicator,
        sliderTop: sliderRect ? sliderRect.top : null,
        sliderPaddingLeft: computedSlider ? computedSlider.paddingLeft : null,
        indicatorTop: indicatorRect ? indicatorRect.top : null,
        firstImgLeft: firstImgRect ? firstImgRect.left : null,
        indicatorIsBelow: (indicatorRect && sliderRect) ? (indicatorRect.top > sliderRect.bottom) : null
      });
    });
    
    return results;
  });
  
  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
