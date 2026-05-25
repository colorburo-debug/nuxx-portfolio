import re

css_path = "/Users/jorgegarcia/Antigravity Projects/nuxx-portfolio/styles.css"

with open(css_path, "r", encoding="utf-8") as f:
    content = f.read()

# Let's find all double-hyphen comment banners or equal comment banners
# e.g., /* ========================================== */
# or /* --- ... --- */
# or large block comments
matches = re.finditer(r'(/\*(?:[^*]|\*(?!/))*\*/)', content)

for m in matches:
    comment = m.group(0)
    lines_in_comment = comment.splitlines()
    line_num = content[:m.start()].count('\n') + 1
    
    # We want to print comments that contain "Page" or "Section" or are long banners
    if len(comment) > 60 or "page" in comment.lower() or "section" in comment.lower() or "---" in comment or "===" in comment:
        first_line = lines_in_comment[0]
        if len(lines_in_comment) > 1:
            first_line += " ... " + lines_in_comment[-1]
        print(f"Line {line_num}: {first_line.strip()}")
