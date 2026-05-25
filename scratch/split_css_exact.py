import os

css_path = "/Users/jorgegarcia/Antigravity Projects/nuxx-portfolio/dev-archive/styles_monolithic_backup.css"
output_dir = "/Users/jorgegarcia/Antigravity Projects/nuxx-portfolio/css"
os.makedirs(output_dir, exist_ok=True)

with open(css_path, "r", encoding="utf-8") as f:
    content = f.read()

lines = content.splitlines()

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

# 6. DesignOps CSS: blocks 2428-3290, 6876-6925
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
    processed_css = raw_css
    
    # Adjust relative paths inside url(...) in case files are in css/ subdirectory
    processed_css = processed_css.replace("url('./utilities.css')", "url('../utilities.css')")
    processed_css = processed_css.replace("url('assets/", "url('../assets/')")
    processed_css = processed_css.replace("url('./assets/", "url('../assets/')")
    
    # Always import utilities.css at the top of global.css
    if filename == "global.css" and "@import" not in processed_css:
        processed_css = "@import url('../utilities.css');\n\n" + processed_css
        
    file_path = os.path.join(output_dir, filename)
    with open(file_path, "w", encoding="utf-8") as out_f:
        out_f.write(processed_css)
    print(f"Wrote {filename} ({len(processed_css)} chars) to {file_path}")

print("Exact split completed successfully!")
