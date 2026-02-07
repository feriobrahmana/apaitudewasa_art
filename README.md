# Living Canvas

A "living canvas" art project built with vanilla HTML5, CSS3, and JavaScript.

## Overview

This project allows users to collaboratively (or individually) paint a persistent, evolving canvas by submitting words and colors.
*   **Paint Canvas:** Accumulates translucent color layers over time, creating a mixing effect.
*   **Text Particles:** Submitted words spawn as floating, bouncing particles on top of the paint layer.

## Features

*   **Dual-Layer Canvas:** Persistent background paint layer + transient animation layer.
*   **Particle System:** Bouncing text particles with physics (velocity, friction, collision).
*   **Color Mixing:** "Paint" actions apply a low-opacity layer, gradually shifting the canvas color.
*   **Responsive:** Works on desktop and mobile. Canvas resizes dynamically while preserving the artwork.
*   **Minimalist UI:** Collapsible control panel with a clean, adult aesthetic.

## How to Run Locally

1.  Clone this repository.
2.  Open `index.html` in any modern web browser (Chrome, Firefox, Safari, Edge).
    *   No build step or server required.

## How to Use

1.  **Open Controls:** Click the "Controls" button in the top-left if the panel is closed.
2.  **Choose a Color:** Use the R, G, B sliders to mix a color.
3.  **Enter a Word:** Type a word or phrase into the text input.
4.  **Paint + Submit:** Click the button (or press Enter) to:
    *   Apply a wash of your chosen color to the background.
    *   Spawn your word as a bouncing particle.
5.  **Clear:** Click "Clear Canvas" to reset the background to white and remove all particles.

## Deployment

This is a static site. You can deploy it for free using **GitHub Pages**:

1.  Go to your repository on GitHub.
2.  Navigate to **Settings** > **Pages**.
3.  Under **Source**, select `main` (or `master`) branch and `/ (root)` folder.
4.  Click **Save**.
5.  Your site will be live at `https://<username>.github.io/<repo-name>/`.

## Customization

*   **Particle Count:** Adjust `MAX_PARTICLES` in `app.js` (default 250).
*   **Opacity:** Adjust the alpha value in `handlePaintSubmit` (default 0.08) to change how fast colors mix.
*   **Font:** Change the `font-family` in `styles.css` and `app.js`.

## License

MIT
