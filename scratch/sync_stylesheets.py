import os
import re

# List of HTML files to update in the root directory
html_files = [
    "index.html",
    "about.html",
    "artifacts.html",
    "project-lauhaus.html",
    "project-fincas.html",
    "project-gnb-lulo.html",
    "lahaus.html"
]

# The block of stylesheets to inject
stylesheet_block = """    <!-- Global & Page-specific stylesheets loaded upfront for smooth Barba transitions -->
    <link rel="stylesheet" href="css/global.css?v=cachebust101">
    <link rel="stylesheet" href="css/home.css?v=cachebust101">
    <link rel="stylesheet" href="css/about.css?v=cachebust101">
    <link rel="stylesheet" href="css/case-studies.css?v=cachebust101">
    <link rel="stylesheet" href="css/project-lauhaus.css?v=cachebust101">
    <link rel="stylesheet" href="css/project-fincas.css?v=cachebust101">
    <link rel="stylesheet" href="css/project-lulo.css?v=cachebust101">
    <link rel="stylesheet" href="css/designops.css?v=cachebust101">
    <link rel="stylesheet" href="css/artifacts.css?v=cachebust101">"""

def update_html_head(filepath):
    print(f"Processing: {filepath}")
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Look for stylesheet links in the head. We want to find the sequence of <link rel="stylesheet" ...>
    # and replace them with our complete block.
    # Usually they are located around css/*.css
    pattern = re.compile(r'(\s*<link rel="stylesheet" href="[^"]+css[^"]+">)+', re.MULTILINE)
    
    # Let's check if the pattern matches
    if pattern.search(content):
        # Replace the matched block of links with our new complete block
        new_content = pattern.sub("\n" + stylesheet_block, content)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"  -> Successfully updated stylesheets block in {filepath}")
    else:
        # Fallback: if they are separate or format differs, let's insert it before </head>
        # but first remove any individual css/*.css stylesheet links so we don't duplicate them
        cleaned_content = re.sub(r'\s*<link rel="stylesheet" href="[^"]+css/[^"]+">', "", content)
        
        # Insert before </head>
        if "</head>" in cleaned_content:
            new_content = cleaned_content.replace("</head>", stylesheet_block + "\n</head>")
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"  -> Successfully inserted stylesheets before </head> in {filepath}")
        else:
            print(f"  x ERROR: </head> tag not found in {filepath}")

if __name__ == "__main__":
    for filename in html_files:
        if os.path.exists(filename):
            update_html_head(filename)
        else:
            print(f"  x File not found: {filename}")
