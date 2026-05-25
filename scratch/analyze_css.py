import re

css_path = "/Users/jorgegarcia/Desktop/Antigravity Projects/nuxx-portfolio/styles.css"

with open(css_path, "r", encoding="utf-8") as f:
    content = f.read()

lines = content.splitlines()

# Search for variables: --var-name
var_pattern = re.compile(r'(--[a-zA-Z0-9_-]+)\s*:')
all_vars = []
for idx, line in enumerate(lines):
    m = var_pattern.findall(line)
    if m:
        for v in m:
            all_vars.append((idx + 1, v, line.strip()))

print(f"Total CSS variables declared: {len(all_vars)}")
# Group by variable name
from collections import defaultdict
grouped_vars = defaultdict(list)
for line_num, name, full_line in all_vars:
    grouped_vars[name].append((line_num, full_line))

for name, decls in sorted(grouped_vars.items()):
    print(f"Variable '{name}' declared {len(decls)} times:")
    for line_num, full_line in decls:
        print(f"  Line {line_num}: {full_line}")
