import os
import re

css_path = "/Users/jorgegarcia/Desktop/Antigravity Projects/nuxx-portfolio/styles.css"
output_dir = "/Users/jorgegarcia/Desktop/Antigravity Projects/nuxx-portfolio/css"
os.makedirs(output_dir, exist_ok=True)

with open(css_path, "r", encoding="utf-8") as f:
    content = f.read()

lines = content.splitlines()

# Function to perform clean variable replacements
def clean_variables(css_text):
    # Color replacements
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
    # To be safe, we can use re.sub with word boundaries and check context.
    for hex_val, var_val in color_replacements.items():
        # Look for hex value preceded by : or space, and followed by ; or space or !important
        pattern = re.compile(r'(:\s*)' + re.escape(hex_val) + r'\b')
        css_text = pattern.sub(r'\1' + var_val, css_text)
        
        # Also handle cases where there is no colon directly (like in list of values, e.g., solid #1e1e1e)
        pattern_space = re.compile(r'(\s+)' + re.escape(hex_val) + r'\b')
        css_text = pattern_space.sub(r'\1' + var_val, css_text)

    # Font size replacements (only when they follow font-size:)
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
        # Look for font-size: 18px
        pattern = re.compile(r'(font-size\s*:\s*)' + size_px + r'\b')
        css_text = pattern.sub(r'\1' + size_var, css_text)
        
    return css_text

# 1. Global CSS: lines 1 to 736 (0-indexed: 0 to 736)
global_css = "\n".join(lines[0:736])

# 2. Home CSS: lines 737 to 2110 + overrides (lines 5941 to 6208 + lines 6368 to 6876)
home_css_blocks = [
    "\n".join(lines[736:2110]),
    "\n".join(lines[5940:6208]),
    "\n".join(lines[6367:6876])
]
home_css = "\n\n/* --- PAGE SPECIFIC & OVERRIDE BLOCKS --- */\n\n".join(home_css_blocks)

# 3. About CSS: lines 2111 to 2427
about_css = "\n".join(lines[2110:2427])

# 4. Case Studies CSS: lines 6284-6367 (Case Study Hero Overrides) + lines 6926-6961 (Scroll indicators)
case_studies_blocks = [
    "\n".join(lines[6283:6367]),
    "\n".join(lines[6925:6961])
]
case_studies_css = "\n\n/* --- SHARED CASE STUDY LAYOUTS --- */\n\n".join(case_studies_blocks)

# 5. Project Lauhaus CSS: lines 2428 to 3290 (DesignOps) + lines 3291 to 4659 (Lauhaus) + lines 6885 to 6925 (Footer Mobile override)
lauhaus_blocks = [
    "\n".join(lines[2427:3290]),
    "\n".join(lines[3290:4659]),
    "\n".join(lines[6884:6925])
]
project_lauhaus_css = "\n\n/* --- LAUHAUS STYLES --- */\n\n".join(lauhaus_blocks)

# 6. Project Fincas CSS: lines 4660 to 5940
project_fincas_css = "\n".join(lines[4659:5940])

# 7. Project Lulo CSS: lines 6962 to 7995 (Lulo Bank) + lines 7996 to 8312 (Lulo Strategy)
lulo_blocks = [
    "\n".join(lines[6961:7995]),
    "\n".join(lines[7995:8312])
]
project_lulo_css = "\n\n/* --- LULO STRATEGY & NEOBANK STYLES --- */\n\n".join(lulo_blocks)

# 8. Artifacts CSS: lines 8313 to 9077 (end)
artifacts_css = "\n".join(lines[8312:])

# Apply clean variable substitutions and save files
files_to_write = {
    "global.css": global_css,
    "home.css": home_css,
    "about.css": about_css,
    "case-studies.css": case_studies_css,
    "project-lauhaus.css": project_lauhaus_css,
    "project-fincas.css": project_fincas_css,
    "project-lulo.css": project_lulo_css,
    "artifacts.css": artifacts_css,
}

for filename, raw_css in files_to_write.items():
    processed_css = clean_variables(raw_css)
    # Add @import url('../utilities.css'); at the beginning of global.css if it's not there,
    # or handle the import of utilities.css
    # Actually, lines[0] was @import url('./utilities.css'); which is already in global_css.
    # Let's adjust relative paths inside url(...) in case files are in css/ subdirectory
    # For example, url('./utilities.css') -> url('../utilities.css')
    # and assets/common/... -> ../assets/common/...
    processed_css = processed_css.replace("url('./utilities.css')", "url('../utilities.css')")
    processed_css = processed_css.replace("url('assets/", "url('../assets/")
    processed_css = processed_css.replace("url('./assets/", "url('../assets/")
    
    file_path = os.path.join(output_dir, filename)
    with open(file_path, "w", encoding="utf-8") as out_f:
        out_f.write(processed_css)
    print(f"Wrote {filename} ({len(processed_css)} chars) to {file_path}")

print("Split completed successfully!")
