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
      const computedFirstImage = firstImage ? window.getComputedStyle(firstImage) : null;
      
      results.push({
        index: idx,
        sliderPaddingLeft: computedSlider ? computedSlider.paddingLeft : null,
        sliderMarginLeft: computedSlider ? computedSlider.marginLeft : null,
        sliderRectLeft: sliderRect ? sliderRect.left : null,
        firstImgMarginLeft: computedFirstImage ? computedFirstImage.marginLeft : null,
        firstImgRectLeft: firstImgRect ? firstImgRect.left : null,
        scrollLeft: slider ? slider.scrollLeft : null
      });
    });
    
    return results;
  });
  
  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
