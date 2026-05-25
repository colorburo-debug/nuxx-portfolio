import os

css_path = "/Users/jorgegarcia/Antigravity Projects/nuxx-portfolio/dev-archive/styles_monolithic_backup.css"
output_dir = "/Users/jorgegarcia/Antigravity Projects/nuxx-portfolio/css"
os.makedirs(output_dir, exist_ok=True)

with open(css_path, "r", encoding="utf-8") as f:
    content = f.read()

lines = content.splitlines()

# Split segments exactly matching the original monolithic cascade sequence
segments = {
    "global.css": (0, 735),
    "home_hero.css": (735, 2110),
    "about.css": (2110, 2427),
    "designops_base.css": (2427, 3290),
    "project-lauhaus.css": (3290, 4658),
    "project-fincas.css": (4658, 5940),
    "home_overrides.css": (5940, 6283),
    "case-studies_base.css": (6283, 6367),
    "home_centering.css": (6367, 6876),
    "designops_footer.css": (6876, 6925),
    "case-studies_scroll.css": (6925, 6961),
    "project-lulo.css": (6961, 8311),
    "artifacts.css": (8311, 8487),
    "project-gemini.css": (8487, len(lines))
}

for filename, (start, end) in segments.items():
    segment_css = "\n".join(lines[start:end])
    
    # Adjust relative paths inside url(...)
    segment_css = segment_css.replace("url('./utilities.css')", "url('../utilities.css')")
    segment_css = segment_css.replace("url('assets/", "url('../assets/')")
    segment_css = segment_css.replace("url('./assets/", "url('../assets/')")
    
    # Prepend utilities import to global.css
    if filename == "global.css" and "@import" not in segment_css:
        segment_css = "@import url('../utilities.css');\n\n" + segment_css
        
    file_path = os.path.join(output_dir, filename)
    with open(file_path, "w", encoding="utf-8") as out_f:
        out_f.write(segment_css)
    print(f"Wrote {filename} ({len(segment_css)} chars) to {file_path}")

print("Sequential split completed successfully!")
