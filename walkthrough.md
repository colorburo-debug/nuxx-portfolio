# Project Walkthrough: nuxx-portfolio (Local: Figma test)

This document contains a persistent record of the architecture, design choices, styling parameters, and interactions implemented for the **nuxx-portfolio** hero section. Keep this file in the project root so future sessions can read it to maintain context.

---

## 1. Project Context & Naming
* **GitHub Repository:** `colorburo-debug/nuxx-portfolio`
* **Local Workspace Folder:** `/Users/jorgegarcia/Desktop/Antigravity Projects/Figma test` (originally cloned as `Figma test`).

---

## 2. Core Architecture: WebGL Canvas
The hero section uses a full-screen WebGL canvas driven by **native Three.js** to achieve a high-performance vector-art look.

### The Continuous Line System
* **Structure:** The visual art consists of **110 continuous, unbroken lines** that morph across different states.
* **Line Contrast & Opacity:** 
  * Opacity is locked at **1.0** (100% solid opacity) to prevent lines from fading and turning grey.
  * **Light Theme Color:** `#1E1E1E` (on `#F7FBF8` background).
  * **Dark Theme Color:** `#F7FBF8` (on `#0C0C0C` dark background).
* **Fog & Z-Depth Contrast:** 
  * Uses 3D radial depth fog to keep the background edges clean.
  * The center sketches are excluded from the fog calculations to maintain their bold, 100% solid contrast.
  * Incorporates a **GPU-accelerated spotlight shader** (`onBeforeCompile` injected into the material) to focus illumination on the active sketch in the center.

---

## 3. Morphing States & Coordinates
Clicking on the canvas transitions the 110 lines through different vector-art silhouettes:

* **State 0: Silk Waves (Default)**
  * Abstract fluid waving motion driven by 2D Simplex Noise.
  * **Interaction:** Cursor magnetic hover effect is **disabled** in this stage to prevent UI clutter.
  * **Positioning:** Offset downward by **10%** (`silkY`) on desktop to give header texts breathing room.
* **State 1: Detailed Greyhound**
  * Vector representation of a greyhound.
  * **Interaction:** Cursor magnetic hover is active (magnetic pull factor is multiplied by `1.0 - waveWeight`).
* **State 2: Jumping Frog**
  * Dynamic, Colombia-inspired jumping frog.
* **State 3: Optical-Illusion Human Faces**
  * Vector faces standing up in 3D space, rotated horizontally to create an optical illusion.

---

## 4. Interaction & Physics Tweaks
* **Segmented Day/Night Toggle:** 
  * An Apple-style segmented switch centered in the navigation bar.
  * Changes background colors and line colors between light/dark presets.
  * **Scroll Fade:** Added a scroll listener in `script.js` that fades out the toggle when the header comes within `150px` of reaching the **Work – Highlights** section.
* **Custom Cursor Inertia:** 
  * Standard cursor smoothing was reduced by **50%** (lerp factor raised to `0.3`) and then further reduced by **30%** (final lerp factor at **`0.5`**) to make it feel lightweight and highly responsive.
* **Kinetic Ripple Effect:** 
  * A bespoke physical ripple wave triggers on theme toggles.
  * **Intensity:** Reduced by **50%** (multiplier set to `0.6`) for subtlety.
  * **State Restriction:** This ripple is **restricted to State 0 (Waves) only**. It fades out to 0% intensity when morphing into the animal sketches (`rippleIntensity * waveWeight`).

---

## 5. Viewport Breakpoints & Responsive Offsets
To keep the animations perfectly framed and centered without colliding with overlapping DOM text, the Three.js camera/projection matrix applies dynamic offsets:

* **Desktop Breakpoint (>= 1025px):**
  * WebGL component moves **upward by 10%** (`Y + 1.0`) *only* when sketching (State 1, 2, or 3). The Wave state remains centered/offset downwards.
* **Tablet Breakpoint (768px - 1024px):**
  * Shifter applies an **8% upward offset** to keep sketches clear of the description texts.
* **Mobile Breakpoint (< 768px):**
  * Shifter applies a **10% upward offset** and a **5% leftward offset** to center the sketches on narrow screens.

---

## 6. Project Code Files
## 6. Project Code Files
* [background.js](file:///Users/jorgegarcia/Antigravity%20Projects/nuxx-portfolio/background.js) - Contains Three.js scene setup, vertex calculations, GLSL shader injections, morph coordinates, and rendering loop.
* [script.js](file:///Users/jorgegarcia/Antigravity%20Projects/nuxx-portfolio/script.js) - Main UI controls, scroll handlers, cursor physics, and light/dark theme toggles.
* [styles.css](file:///Users/jorgegarcia/Antigravity%20Projects/nuxx-portfolio/styles.css) - General layout styles, desktop and mobile header structures, and dark-theme color overrides.
* [utilities.css](file:///Users/jorgegarcia/Antigravity%20Projects/nuxx-portfolio/utilities.css) - Spacing parameters and utility helpers.

---

## 7. CSS Architecture & Modular imports
To maintain clean structure and resolve layout issues, the styles have been modularized into separate CSS files located under the `css/` folder. The main `styles.css` imports these sub-stylesheets using `@import` rules:
* **Styles Modularization:** Split page-specific and component-specific styles into separate files (e.g., `css/global.css`, `css/home_hero.css`, `css/about.css`, `css/project-gemini.css`, and `css/artifacts.css`).
* **Main Stylesheet Imports:** The monolithic `styles.css` now acts as a central hub importing all these modules via `@import` rules, which avoids the need to dynamically swap stylesheets in `animations.js` and ensures seamless page transitions under Barba.js.
* **Stand-alone Assets Integration:** Staged and synchronized all SVGs, videos, and images under `assets/artifacts/` to keep the Artifacts section completely independent.
