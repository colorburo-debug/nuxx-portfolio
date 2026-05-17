const fs = require('fs');
let content = fs.readFileSync('styles.css', 'utf8');

// Replace specific paddings inside .hero-section
// We'll use regex to target padding-top inside .hero-section blocks
let inHeroSection = false;
let lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Check if we are entering .hero-section
    if (line.includes('.hero-section {') || line.includes('.hero-section,')) {
        inHeroSection = true;
    }
    
    // Check if we are leaving a block
    if (inHeroSection && line.trim() === '}') {
        inHeroSection = false;
    }
    
    // If inside, replace padding
    if (inHeroSection && line.includes('padding-top:')) {
        if (line.includes('160px') || line.includes('152px')) {
            lines[i] = line.replace(/160px|152px/g, '120px').replace(/\/\*.*?\*\//, '/* Reduced 25% */');
        } else if (line.includes('144px')) {
            lines[i] = line.replace(/144px/g, '108px').replace(/\/\*.*?\*\//, '/* Reduced 25% */');
        }
    }
}

fs.writeFileSync('styles.css', lines.join('\n'));
console.log('Done!');
