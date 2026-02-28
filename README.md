# Nuxx | Portfolio Showcase

A modern, geometric, and interactive portfolio website designed to showcase product design and interaction craftsmanship. The site features a clean minimal UI, dynamic WebGL backgrounds, and responsive layouts across desktop, tablet, and mobile devices.

## Features

- **Interactive WebGL Hero Background**
  - Built with [Three.js](https://threejs.org/).
  - Features geometric particles that morph from a wave-distorted sphere into a 3D mapped face on click.
  - Interactive mouse movement (parallax) alters the wave effect and rotates the geometry.

- **Responsive Design**
  - Pixel-perfect implementation from Figma designs tailored for Desktop (1440px), Tablet (1024px), and Mobile (390px).
  - Fluid flexbox layouts and dynamic container constraints.
  - Full-screen mobile navigation overlay with hamburger toggle.

- **Semantic & Accessible UI**
  - Built with clean semantic HTML5 (`<header>`, `<main>`, `<section>`, `<article>`).
  - Dark mode aesthetic with strategic high-contrast accent colors (e.g., `#c3fe0c`).
  - Clean typography utilizing 'Outfit' and 'Unbounded' Google Fonts.

- **Multi-Page Structure**
  - `index.html`: The main landing page featuring the Hero, About Me summary, and Work Highlights.
  - `about.html`: A dedicated deep-dive "About Me" page with expanded content and its own responsive navigation.

## Project Structure

```text
├── index.html           # Main portfolio landing page
├── about.html           # Dedicated About Me page
├── styles.css           # Core styling, variables, and responsive media queries
├── script.js            # DOM interactions (Mobile Nav, Modals, Parallax elements)
├── background.js        # Three.js WebGL animation logic
├── face_depth.png       # Displacement map texture used for the WebGL face morph
├── nuxx-logo.svg        # Scalable Vector Graphic of the brand logo
├── assets/              # Directory containing additional graphics (e.g., Sellos.svg)
└── Cover *.jpg          # Case study thumbnail imagery
```

## Setup & Running Locally

Because the WebGL background (`background.js`) relies on loading an external texture (`face_depth.png`), running the project directly from the file system (`file://`) will result in Chrome/Safari blocking the image due to **CORS (Cross-Origin Resource Sharing)** security policies.

To view the project with full functionality, you must run a local web server:

**Using Python 3 (Recommended & Built-in for macOS/Linux):**
```bash
# Navigate to the project directory in your terminal
cd path/to/portfolio

# Start a local HTTP server on port 8000
python3 -m http.server 8000
```
Then, open your web browser and navigate to `http://localhost:8000`.

## Key Technologies

- **HTML5 & Vanilla CSS3**: No CSS frameworks were used, ensuring complete custom control over padding, gaps, and precise Figma pixel values.
- **Vanilla JavaScript (ES6)**: Lightweight scripting for DOM updates without heavy framework overhead.
- **Three.js**: Used exclusively for the `canvas` background layer to handle shaders, 3D math, and rendering.

---
*Crafted carefully to blend story-driven products with delightful artifacts.*
