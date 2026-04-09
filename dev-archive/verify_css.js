const fs = require('fs');
const content = fs.readFileSync('/Users/jorgegarcia/Desktop/Antigravity Projects/Figma test/styles.css', 'utf8');

const mobileSection = content.match(/@media \(max-width: 640px\) \{([\s\S]*?)\}/g);
if (!mobileSection) {
    console.log("Mobile media query not found");
    process.exit(1);
}

const sectionContent = mobileSection[mobileSection.length - 1]; // Get the last one

const checks = [
    { name: "Journey Section Padding", pattern: /padding: 11px 8px 95px 8px !important/ },
    { name: "Journey Section Gap", pattern: /gap: 105px !important/ },
    { name: "Main Container Gap", pattern: /gap: 100px !important/ },
    { name: "Block 1 Margins", pattern: /margin-top: 0 !important;\s+margin-bottom: 0 !important/ },
    { name: "Block 2 Gap", pattern: /gap: 17px !important/ },
    { name: "Step 3 Aspect Ratio", pattern: /aspect-ratio: 374 \/ 495 !important/ }
];

checks.forEach(check => {
    if (check.pattern.test(sectionContent)) {
        console.log(`[PASS] ${check.name}`);
    } else {
        console.log(`[FAIL] ${check.name}`);
    }
});
