# Living Canvas

A "living canvas" art project built with vanilla HTML5, CSS3, and JavaScript.

## Overview

This project allows users to collaboratively (or individually) paint a persistent, evolving canvas by submitting words and colors.
*   **Canvas State:** The canvas background color and central shape continuously evolve based on the inputs of user contributions.
*   **Realistic Mixing:** Uses **Mixbox** (pigment-based mixing) to ensure colors blend naturally (e.g., Red + Green = Yellow), creating a vibrant, non-muddy aesthetic.
*   **Text Particles:** Submitted words spawn as floating, bouncing particles on top of the paint layer.

## Features

*   **Real-time Visualization:** Persistent background color and central shape that smoothly transition to reflect the collective state.
*   **Pigment Color Mixing:** Integrated `mixbox.js` for high-quality subtractive/additive color blending with enhanced impact (20% mix strength per contribution).
*   **Optimistic UI:** Instant feedback for text submissions.
*   **Particle System:** Bouncing text particles with physics (velocity, friction, collision).
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
    *   Submit your contribution to the collective.
    *   Spawn your word as a bouncing particle.
    *   Watch the background color and central shape shift towards your input using realistic pigment mixing.

## Deployment

This is a static site. You can deploy it for free using **GitHub Pages**:

1.  Go to your repository on GitHub.
2.  Navigate to **Settings** > **Pages**.
3.  Under **Source**, select `main` (or `master`) branch and `/ (root)` folder.
4.  Click **Save**.
5.  Your site will be live at `https://<username>.github.io/<repo-name>/`.

## Customization

*   **Particle Count:** Adjust `MAX_PARTICLES` in `app.js` (default 250).
*   **Mixing Speed:** Adjust `bgLerpSpeed` in `app.js` (default 0.2) to change how much each contribution affects the canvas.
*   **Font:** Change the `font-family` in `styles.css` and `app.js`.

## License

MIT
