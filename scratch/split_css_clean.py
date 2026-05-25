import os
import re

css_path = "/Users/jorgegarcia/Antigravity Projects/nuxx-portfolio/styles.css"
output_dir = "/Users/jorgegarcia/Antigravity Projects/nuxx-portfolio/css"
os.makedirs(output_dir, exist_ok=True)

with open(css_path, "r", encoding="utf-8") as f:
    content = f.read()

lines = content.splitlines()

# Function to perform clean variables and unified gaps replacements
def clean_css_code(css_text):
    # 1. Color replacements
    color_replacements = {
        r'#F7FBF8': 'var(--color-bg-primary)',
        r'#f7fbf8': 'var(--color-bg-primary)',
        r'#1E1E1E': 'var(--color-bg-dark)',
        r'#1e1e1e': 'var(--color-bg-dark)',
        r'#0d1327': 'var(--color-bg-navy)',
        r'#0D1327': 'var(--color-bg-navy)',
        r'#090d1b': 'var(--color-card-text)',
        r'#090D1B': 'var(--color-card-text)',
        r'#6F6F6F': 'var(--color-text-secondary)',
        r'#6f6f6f': 'var(--color-text-secondary)',
    }
    
    # We want to replace these colors when they are values in property: value declarations.
    for hex_val, var_val in color_replacements.items():
        pattern = re.compile(r'(:\s*)' + re.escape(hex_val) + r'\b')
        css_text = pattern.sub(r'\1' + var_val, css_text)
        
        pattern_space = re.compile(r'(\s+)' + re.escape(hex_val) + r'\b')
        css_text = pattern_space.sub(r'\1' + var_val, css_text)

    # 2. Font size replacements (only when they follow font-size:)
    font_size_replacements = {
        '14px': 'var(--text-xs)',
        '16px': 'var(--text-sm)',
        '18px': 'var(--text-base)',
        '20px': 'var(--text-lg)',
        '24px': 'var(--text-xl)',
        '30px': 'var(--text-2xl)',
        '36px': 'var(--text-3xl)',
        '40px': 'var(--text-4xl)',
        '50px': 'var(--text-5xl)',
        '60px': 'var(--text-6xl)',
    }
    
    for size_px, size_var in font_size_replacements.items():
        pattern = re.compile(r'(font-size\s*:\s*)' + size_px + r'\b')
        css_text = pattern.sub(r'\1' + size_var, css_text)

    # 3. Gap replacements (mapping to closest design spacing token)
    def map_gap_val(val_px):
        if val_px <= 12:
            return "var(--spacing-sm)"
        elif val_px <= 20:
            return "var(--spacing-md)"
        elif val_px <= 40:
            return "var(--spacing-lg)"
        else:
            return "var(--spacing-xl)"

    # Single value gap: e.g. gap: 16px; or column-gap: 24px;
    def single_gap_replacer(match):
        prop = match.group(1)
        val_px = int(match.group(2))
        imp = match.group(3) or ""
        new_val = map_gap_val(val_px)
        return f"{prop}: {new_val}{imp}"

    single_gap_pattern = re.compile(r'\b(row-gap|column-gap|gap)\s*:\s*(\d+)px(\s*!important)?', re.IGNORECASE)
    css_text = single_gap_pattern.sub(single_gap_replacer, css_text)

    # Double value gap: e.g. gap: 16px 24px;
    def double_gap_replacer(match):
        val1_px = int(match.group(1))
        val2_px = int(match.group(2))
        imp = match.group(3) or ""
        new_val1 = map_gap_val(val1_px)
        new_val2 = map_gap_val(val2_px)
        return f"gap: {new_val1} {new_val2}{imp}"

    double_gap_pattern = re.compile(r'\bgap\s*:\s*(\d+)px\s+(\d+)px(\s*!important)?', re.IGNORECASE)
    css_text = double_gap_pattern.sub(double_gap_replacer, css_text)

    return css_text

# Slice declarations based on current verified line numbers (0-indexed logic)
# lines[a:b] gives line numbers (a+1) to b inclusive.

# 1. Global CSS: lines 1 to 735 (indices 0 to 735)
global_css = "\n".join(lines[0:735])

# 2. Home CSS: blocks 736-2110, 5941-6283, 6368-6876
home_css_blocks = [
    "\n".join(lines[735:2110]),
    "\n".join(lines[5940:6283]),
    "\n".join(lines[6367:6876])
]
home_css = "\n\n/* --- PAGE SPECIFIC & OVERRIDE BLOCKS --- */\n\n".join(home_css_blocks)

# 3. About CSS: lines 2111-2427
about_css = "\n".join(lines[2110:2427])

# 4. Case Studies CSS: blocks 6284-6367, 6926-6961
case_studies_blocks = [
    "\n".join(lines[6283:6367]),
    "\n".join(lines[6925:6961])
]
case_studies_css = "\n\n/* --- SHARED CASE STUDY LAYOUTS --- */\n\n".join(case_studies_blocks)

# 5. Project Lauhaus CSS: lines 3291-4658
project_lauhaus_css = "\n".join(lines[3290:4658])

# 6. DesignOps CSS: blocks 2428-3290, 6877-6925
designops_blocks = [
    "\n".join(lines[2427:3290]),
    "\n".join(lines[6876:6925])
]
designops_css = "\n\n/* --- DESIGN OPERATIONS STYLES --- */\n\n".join(designops_blocks)

# 7. Project Fincas CSS: lines 4659-5940
project_fincas_css = "\n".join(lines[4658:5940])

# 8. Project Lulo CSS: lines 6962-8311
project_lulo_css = "\n".join(lines[6961:8311])

# 9. Artifacts CSS: lines 8312-8487
artifacts_css = "\n".join(lines[8311:8487])

# 10. Project Gemini CSS: lines 8488-8950
project_gemini_css = "\n".join(lines[8487:])

files_to_write = {
    "global.css": global_css,
    "home.css": home_css,
    "about.css": about_css,
    "case-studies.css": case_studies_css,
    "project-lauhaus.css": project_lauhaus_css,
    "designops.css": designops_css,
    "project-fincas.css": project_fincas_css,
    "project-lulo.css": project_lulo_css,
    "artifacts.css": artifacts_css,
    "project-gemini.css": project_gemini_css,
}

for filename, raw_css in files_to_write.items():
    processed_css = clean_css_code(raw_css)
    
    # Adjust relative paths inside url(...) in case files are in css/ subdirectory
    processed_css = processed_css.replace("url('./utilities.css')", "url('../utilities.css')")
    processed_css = processed_css.replace("url('assets/", "url('../assets/")
    processed_css = processed_css.replace("url('./assets/", "url('../assets/")
    
    # Always import utilities.css at the top of global.css
    if filename == "global.css" and "@import" not in processed_css:
        processed_css = "@import url('../utilities.css');\n\n" + processed_css
        
    file_path = os.path.join(output_dir, filename)
    with open(file_path, "w", encoding="utf-8") as out_f:
        out_f.write(processed_css)
    print(f"Wrote {filename} ({len(processed_css)} chars) to {file_path}")

print("Clean split completed successfully!")
