import re

css_path = "/Users/jorgegarcia/Desktop/Antigravity Projects/nuxx-portfolio/styles.css"

with open(css_path, "r", encoding="utf-8") as f:
    content = f.read()

lines = content.splitlines()

# The overrides section is roughly lines 5941 to 6925. Let's extract and print the comments and selectors.
overrides_content = "\n".join(lines[5940:6925])

print("=== OVERRIDES SECTION ANALYZER ===")

# Find all comments with numbers (e.g. 10. Missing Animations, 11. Interaction Indicator...)
pattern = re.compile(r'/\*\s*(\d+\..*?)\s*\*/')
matches = pattern.finditer(overrides_content)

for m in matches:
    # Print comment and some lines after it
    start_pos = m.start()
    comment_text = m.group(1)
    
    # Let's find line number relative to styles.css
    line_offset = overrides_content[:start_pos].count('\n') + 5941
    print(f"Line {line_offset}: {comment_text}")
