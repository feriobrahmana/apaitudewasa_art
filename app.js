(function() {
    'use strict';

    // Canvas elements
    const paintCanvas = document.getElementById('paintCanvas');
    const textCanvas = document.getElementById('textCanvas');
    const paintCtx = paintCanvas.getContext('2d');
    const textCtx = textCanvas.getContext('2d');

    // Canvas Dimensions
    let width, height;

    /**
     * Resizes canvases and preserves paint layer.
     */
    function resizeCanvas() {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;

        // If canvas already has content (not first run), save it
        if (width && height) {
            // Create temporary canvas
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = width;
            tempCanvas.height = height;
            const tempCtx = tempCanvas.getContext('2d');

            // Draw current paint canvas to temp
            tempCtx.drawImage(paintCanvas, 0, 0);

            // Resize main canvases (this clears them)
            paintCanvas.width = newWidth;
            paintCanvas.height = newHeight;
            textCanvas.width = newWidth;
            textCanvas.height = newHeight;

            // Draw back scaled image
            paintCtx.drawImage(tempCanvas, 0, 0, width, height, 0, 0, newWidth, newHeight);
        } else {
            // Initial sizing
            paintCanvas.width = newWidth;
            paintCanvas.height = newHeight;
            textCanvas.width = newWidth;
            textCanvas.height = newHeight;

            // Fill initial background white
            paintCtx.fillStyle = '#ffffff';
            paintCtx.fillRect(0, 0, newWidth, newHeight);
        }

        width = newWidth;
        height = newHeight;
    }

    // Initial sizing
    resizeCanvas();

    // Event listener for resize
    window.addEventListener('resize', resizeCanvas);

    // --- UI Logic ---

    // UI Elements
    const uiToggle = document.getElementById('ui-toggle');
    const uiToggleIcon = uiToggle.querySelector('.icon');
    const uiPanel = document.getElementById('ui-panel');
    const wordInput = document.getElementById('wordInput');
    const rSlider = document.getElementById('rSlider');
    const gSlider = document.getElementById('gSlider');
    const bSlider = document.getElementById('bSlider');
    const cSlider = document.getElementById('cSlider'); // Complexity
    const previewCanvas = document.getElementById('previewCanvas');
    const previewCtx = previewCanvas.getContext('2d');
    const paintBtn = document.getElementById('paintBtn');

    // State
    let currentColor = { r: 100, g: 100, b: 200 };
    let currentComplexity = 0.5;
    let particles = [];
    const MAX_PARTICLES = 250;

    // Initial setup
    updateState();

    function updateState() {
        const r = parseInt(rSlider.value);
        const g = parseInt(gSlider.value);
        const b = parseInt(bSlider.value);
        const c = parseInt(cSlider.value) / 100; // 0.0 to 1.0

        currentColor = { r, g, b };
        currentComplexity = c;

        drawPreview();
    }

    function drawPreview() {
        // Clear preview
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

        // Background
        previewCtx.fillStyle = '#fff';
        previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);

        // Draw shape in center
        const cx = previewCanvas.width / 2;
        const cy = previewCanvas.height / 2;
        const size = 20;

        previewCtx.fillStyle = `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`;
        // Use the same shape drawing logic as Particle
        drawProceduralShape(previewCtx, cx, cy, size, currentComplexity, 0);

        // Also fill text preview if needed? No, shape is the focus.
    }

    // Procedural Shape Generator
    // pinned to center (cx, cy)
    function drawProceduralShape(ctx, cx, cy, size, complexity, angleOffset) {
        ctx.beginPath();

        // Map complexity to vertices (3 to 12)
        // 0 -> 3 (Triangle)
        // 0.5 -> 6 (Hexagon)
        // 1.0 -> 12+ (Circle-ish)
        const vertices = Math.floor(3 + complexity * 9);

        // Map complexity to "indent" for snowflake effect
        // If complexity is around 0.5 (snowflake), we want spikes.
        // If 0 (triangle), no spikes (convex).
        // If 1 (circle), no spikes.
        // Let's make "spikiness" peak in the middle.
        // 0 -> 1.0 (Convex)
        // 0.5 -> 0.5 (Star)
        // 1.0 -> 1.0 (Convex)

        // Simple heuristic:
        // Complexity 0: Radius is constant (Polygon)
        // Complexity 0.5: Radius oscillates (Star)
        // Complexity 1: Radius is constant (Polygon/Circle)

        let spikeFactor = 1.0;
        if (complexity > 0.2 && complexity < 0.8) {
             // Peak spikiness at 0.5
             // 0.2 -> 1.0
             // 0.5 -> 0.4
             // 0.8 -> 1.0
             const distFromMid = Math.abs(complexity - 0.5); // 0 at mid, 0.3 at edges
             spikeFactor = 0.4 + (distFromMid * 2); // 0.4 at mid, 1.0 at edges
        }

        const step = (Math.PI * 2) / vertices;

        for (let i = 0; i < vertices * 2; i++) {
            const theta = i * (step / 2) + angleOffset;

            // Outer radius vs Inner radius (for stars)
            let r = size;
            if (i % 2 !== 0) {
                // Inner vertex
                r = size * spikeFactor;
            }

            const x = cx + Math.cos(theta) * r;
            const y = cy + Math.sin(theta) * r;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }

        ctx.closePath();
        ctx.fill();
    }

    // Event Listeners
    rSlider.addEventListener('input', updateState);
    gSlider.addEventListener('input', updateState);
    bSlider.addEventListener('input', updateState);
    cSlider.addEventListener('input', updateState);

    uiToggle.addEventListener('click', () => {
        const isHidden = uiPanel.classList.toggle('hidden');
        uiToggleIcon.textContent = isHidden ? 'Contribute' : 'Close';
    });

    wordInput.addEventListener('input', () => {
        const text = wordInput.value.trim();
        paintBtn.disabled = text.length === 0;
    });

    // Placeholders for actions
    paintBtn.addEventListener('click', handlePaintSubmit);

    // Allow Enter key to submit
    wordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !paintBtn.disabled) {
            handlePaintSubmit();
        }
    });

    class Particle {
        constructor(text, color, complexity, x, y, vx, vy, fontSize) {
            this.text = text;
            this.color = { ...color }; // Copy color object
            this.complexity = complexity;
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.fontSize = fontSize;
            this.angleOffset = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.02;

            // Measure dimensions
            textCtx.font = `${this.fontSize}px "Times New Roman"`;
            this.width = textCtx.measureText(this.text).width;
            this.height = this.fontSize; // Approximate height for collision
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.angleOffset += this.rotationSpeed;

            // Bounce X
            if (this.x < 0) {
                this.x = 0;
                this.vx *= -1;
            } else if (this.x + this.width > width) {
                this.x = width - this.width;
                this.vx *= -1;
            }

            // Bounce Y (assuming textBaseline = 'top')
            if (this.y < 0) {
                this.y = 0;
                this.vy *= -1;
            } else if (this.y + this.height > height) {
                this.y = height - this.height;
                this.vy *= -1;
            }
        }

        draw() {
            // Draw Text
            textCtx.font = `${this.fontSize}px "Times New Roman"`;
            textCtx.fillStyle = `rgb(${this.color.r}, ${this.color.g}, ${this.color.b})`;
            textCtx.textBaseline = 'top';
            textCtx.fillText(this.text, this.x, this.y);

            // Draw Crystal Shape (pinned to top-right of text)
            // Vertically centered relative to text line
            const shapeX = this.x + this.width + 12;
            const shapeY = this.y + (this.height / 2);

            // Set style for shape (maybe slightly transparent?)
            textCtx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.8)`;

            // Use the global function (or method if refactored)
            drawProceduralShape(textCtx, shapeX, shapeY, 10, this.complexity, this.angleOffset);
        }
    }

    function handlePaintSubmit() {
        const text = wordInput.value.trim();
        if (text.length === 0) return;

        // Paint background layer (mixing effect)
        // Reduced opacity for subtler mixing as per story-telling requirements
        paintCtx.fillStyle = `rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, 0.04)`;
        paintCtx.fillRect(0, 0, width, height);

        // Spawn particle
        const fontSize = 24; // Slightly larger for legibility
        // Start near center with some randomness
        const x = width / 2 + (Math.random() - 0.5) * 200;
        const y = height / 2 + (Math.random() - 0.5) * 200;

        // Gentle, constant drift (ensure it's not zero)
        const speed = 0.5; // Pixels per frame
        const angle = Math.random() * Math.PI * 2;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        // Ensure angleOffset is handled if not passed, but here we pass complexity
        const particle = new Particle(text, currentColor, currentComplexity, x, y, vx, vy, fontSize);
        particles.push(particle);

        // Limit max particles
        if (particles.length > MAX_PARTICLES) {
            particles.shift(); // Remove oldest
        }

        // Reset input for next contribution
        wordInput.value = '';
        paintBtn.disabled = true;
    }

    // Animation Loop
    function animate() {
        // Clear text canvas only
        textCtx.clearRect(0, 0, width, height);

        // Update and draw particles
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
        }

        requestAnimationFrame(animate);
    }

    // Start animation loop
    animate();

})();
