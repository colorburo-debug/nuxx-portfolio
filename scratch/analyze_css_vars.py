import re
from collections import defaultdict

css_path = "/Users/jorgegarcia/Desktop/Antigravity Projects/nuxx-portfolio/styles.css"

with open(css_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Find variable declarations
decl_pattern = re.compile(r'(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+);')
declarations = decl_pattern.findall(content)

# Group declarations
declared_vars = {}
for name, val in declarations:
    name = name.strip()
    val = val.strip()
    if name not in declared_vars:
        declared_vars[name] = []
    declared_vars[name].append(val)

# 2. Find variable usage
use_pattern = re.compile(r'var\((--[a-zA-Z0-9_-]+)\)')
uses = use_pattern.findall(content)

use_counts = defaultdict(int)
for u in uses:
    use_counts[u] += 1

print("=== CSS VARIABLES DECLARED & USED ===")
print(f"Unique variables declared: {len(declared_vars)}")
for name, vals in sorted(declared_vars.items()):
    unique_vals = list(set(vals))
    uses_count = use_counts[name]
    print(f"Variable: {name}")
    print(f"  Declared values: {unique_vals}")
    print(f"  Times used in stylesheet: {uses_count}")

# 3. Find hardcoded color values (hex, rgb, rgba) that are repeated
hex_pattern = re.compile(r'#[0-9a-fA-F]{3,8}\b')
rgb_pattern = re.compile(r'rgba?\([^)]+\)')
colors_hex = hex_pattern.findall(content)
colors_rgb = rgb_pattern.findall(content)

color_counts = defaultdict(int)
for c in colors_hex:
    color_counts[c.lower()] += 1
for c in colors_rgb:
    # normalize spaces
    c_norm = re.sub(r'\s+', ' ', c).lower()
    color_counts[c_norm] += 1

print("\n=== REPEATED HARDCODED COLORS ===")
repeated_colors = {k: v for k, v in color_counts.items() if v > 1}
for col, count in sorted(repeated_colors.items(), key=lambda x: x[1], reverse=True):
    print(f"  Color '{col}': {count} times")

# 4. Find hardcoded font-sizes
font_size_pattern = re.compile(r'font-size\s*:\s*([^;!]+)')
font_sizes = font_size_pattern.findall(content)
fs_counts = defaultdict(int)
for fs in font_sizes:
    fs_counts[fs.strip()] += 1

print("\n=== REPEATED FONT SIZES ===")
for fs, count in sorted(fs_counts.items(), key=lambda x: x[1], reverse=True):
    if count > 1:
        print(f"  Font-size '{fs}': {count} times")
