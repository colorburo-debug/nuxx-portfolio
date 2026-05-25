import re

css_path = "/Users/jorgegarcia/Desktop/Antigravity Projects/nuxx-portfolio/styles.css"

with open(css_path, "r", encoding="utf-8") as f:
    content = f.read()

lines = content.splitlines()

# Search for Fincas page start
fincas_comments = []
for idx, line in enumerate(lines):
    if 'fincas' in line.lower() or 'finca' in line.lower():
        fincas_comments.append((idx + 1, line.strip()))

print("Comments / Lines referencing Fincas:")
for line_num, text in fincas_comments[:40]:
    print(f"Line {line_num}: {text}")
