import re

css_path = "/Users/jorgegarcia/Desktop/Antigravity Projects/nuxx-portfolio/styles.css"

with open(css_path, "r", encoding="utf-8") as f:
    content = f.read()

lines = content.splitlines()

# Let's extract lines 5940 to 6925 and find the selectors and media query wrappers.
# We will print them in a structured way.
overrides_lines = lines[5940:6925]

# Let's look for specific comments and print the code block that follows it.
current_comment = None
block_lines = []

for idx, line in enumerate(overrides_lines):
    line_num = idx + 5941
    comment_match = re.search(r'/\*\s*(\d+\..*?)\s*\*/', line)
    if comment_match:
        if current_comment:
            print(f"[{current_comment_line}] {current_comment}:")
            print("  " + "\n  ".join(block_lines[:8]))
            if len(block_lines) > 8:
                print(f"  ... (+ {len(block_lines)-8} lines)")
            print("-" * 40)
        current_comment = comment_match.group(1).strip()
        current_comment_line = line_num
        block_lines = []
    else:
        if current_comment:
            if line.strip():
                block_lines.append(line.strip())

# Print the last one
if current_comment:
    print(f"[{current_comment_line}] {current_comment}:")
    print("  " + "\n  ".join(block_lines[:8]))
    if len(block_lines) > 8:
        print(f"  ... (+ {len(block_lines)-8} lines)")
