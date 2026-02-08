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
    const wordLimitNote = document.getElementById('wordLimitNote');

    // State
    let currentColor = { r: 100, g: 100, b: 200 };
    let currentComplexity = 0.5;
    let particles = [];
    const MAX_PARTICLES = 250;

    // Central Shape State
    let centralShape = {
        sides: 2, // Start with a Line (as requested)
        color: { r: 200, g: 200, b: 200 }, // Start neutral
        rotation: 0
    };

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

        // 1. Color Swatch (Left 1/3)
        // Use lower opacity to match the translucent nature of the paint layer
        // Slightly higher than 0.04 (paint) to be visible, but clearly not opaque
        previewCtx.fillStyle = `rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, 0.2)`;
        previewCtx.fillRect(0, 0, previewCanvas.width * 0.3, previewCanvas.height);

        // 2. Shape Preview (Right 2/3)
        const cx = previewCanvas.width * 0.65;
        const cy = previewCanvas.height / 2;
        const size = 20;

        // Use darker stroke for visibility
        const darkColor = darkenColor(currentColor, 40);
        previewCtx.strokeStyle = `rgb(${darkColor.r}, ${darkColor.g}, ${darkColor.b})`;
        previewCtx.fillStyle = `rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, 0.2)`;
        previewCtx.lineWidth = 2;

        // Draw the current "User" shape based on sliders
        drawProceduralShape(previewCtx, cx, cy, size, currentComplexity, 0);
        previewCtx.fill(); // Fill slightly
    }

    // Helper to darken color
    function darkenColor(color, amount) {
        return {
            r: Math.max(0, color.r - amount),
            g: Math.max(0, color.g - amount),
            b: Math.max(0, color.b - amount)
        };
    }

    // Procedural Shape Generator
    // Used for both preview and central shape
    // complexity: 0 to 1 (maps to sides 2 to ~30)
    // OR directly pass 'sides' if we pre-calculate
    function drawProceduralShape(ctx, cx, cy, size, complexityOrSides, angleOffset) {
        ctx.beginPath();

        let vertices;
        if (complexityOrSides <= 1.0) {
            // Map complexity (0-1) to sides (2 to 30)
            // 0 -> 2 (Line)
            // 1 -> 30 (Circle)
            vertices = 2 + complexityOrSides * 28;
        } else {
            // Direct side count
            vertices = complexityOrSides;
        }

        // For drawing, we floor it unless we want to animate between integers (tricky)
        // Let's use floor for sides, but maybe interpolate radius?
        // Actually, let's keep it simple: strict polygons.
        const sides = Math.max(2, Math.floor(vertices));
        const step = (Math.PI * 2) / sides;

        // Line case (2 sides) needs special handling to look good?
        // A "2-sided polygon" is just a flat line back and forth.

        for (let i = 0; i < sides; i++) {
            const theta = i * step + angleOffset;
            const x = cx + Math.cos(theta) * size;
            const y = cy + Math.sin(theta) * size;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }

        ctx.closePath();

        // Stroke or Fill?
        // Let's stroke it for "blueprint" look, maybe fill slightly
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = 2;
        ctx.stroke();
        // ctx.fill(); // Optional
    }

    // Event Listeners
    rSlider.addEventListener('input', updateState);
    gSlider.addEventListener('input', updateState);
    bSlider.addEventListener('input', updateState);
    cSlider.addEventListener('input', updateState);

    uiToggle.addEventListener('click', () => {
        // Toggle the class
        uiPanel.classList.toggle('hidden');

        // Check actual state after toggle
        const isHidden = uiPanel.classList.contains('hidden');

        // Update text
        if (isHidden) {
            uiToggleIcon.textContent = 'Contribute';
        } else {
            uiToggleIcon.textContent = 'Close';
        }
    });

    wordInput.addEventListener('input', () => {
        let text = wordInput.value;
        const words = text.trim().split(/\s+/);

        // Check Limit
        if (words.length > 10) {
            // Trim to first 10 words
            const trimmedText = words.slice(0, 10).join(" ");
            // Only update if actually changed (to avoid cursor jumping issues if possible)
            if (text.trim() !== trimmedText) {
                wordInput.value = trimmedText;
                text = trimmedText;
            }
        }

        // Visual Warning if limit reached
        if (words.length >= 10 || text.length >= 70) {
            wordLimitNote.classList.add('error');
            wordInput.classList.add('error');
            wordLimitNote.textContent = 'Limit reached (10 words / 70 chars)';
        } else {
            wordLimitNote.classList.remove('error');
            wordInput.classList.remove('error');
            wordLimitNote.textContent = 'Limit: 10 words (70 chars)';
        }

        paintBtn.disabled = text.trim().length === 0;
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
        constructor(text, color, x, y, vx, vy, fontSize) {
            this.text = text;
            this.color = { ...color }; // Copy color object
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.fontSize = fontSize;

            // Measure dimensions
            textCtx.font = `${this.fontSize}px "Times New Roman"`;
            this.width = textCtx.measureText(this.text).width;
            this.height = this.fontSize; // Approximate height for collision
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

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

        const particle = new Particle(text, currentColor, x, y, vx, vy, fontSize);
        particles.push(particle);

        // Limit max particles
        if (particles.length > MAX_PARTICLES) {
            particles.shift(); // Remove oldest
        }

        // --- Central Shape Evolution ---
        // Calculate user sides (2 to 30)
        const userSides = 2 + currentComplexity * 28;

        // Average with current sides (weighted or simple average)
        // Simple average gives significant impact
        centralShape.sides = (centralShape.sides + userSides) / 2;

        // Average Color
        centralShape.color.r = (centralShape.color.r + currentColor.r) / 2;
        centralShape.color.g = (centralShape.color.g + currentColor.g) / 2;
        centralShape.color.b = (centralShape.color.b + currentColor.b) / 2;

        console.log(`Evolved Shape: sides=${centralShape.sides.toFixed(2)}`);

        // Reset input for next contribution
        wordInput.value = '';
        paintBtn.disabled = true;
    }

    // Animation Loop
    function animate() {
        // Clear text canvas only (and redraw central shape which is animated)
        textCtx.clearRect(0, 0, width, height);

        // Draw Central Shape
        // We draw it on textCtx so it can animate (rotate) smoothly without smearing
        const cx = width / 2;
        const cy = height / 2;
        const size = Math.min(width, height) * 0.25; // Large size

        centralShape.rotation += 0.005; // Slow rotation

        // Calculate darker stroke color for contrast
        const darkStroke = darkenColor(centralShape.color, 50); // Darker by 50 units

        // Set style
        textCtx.fillStyle = `rgba(${Math.round(centralShape.color.r)}, ${Math.round(centralShape.color.g)}, ${Math.round(centralShape.color.b)}, 0.1)`;
        textCtx.strokeStyle = `rgba(${Math.round(darkStroke.r)}, ${Math.round(darkStroke.g)}, ${Math.round(darkStroke.b)}, 1.0)`;
        textCtx.lineWidth = 4; // Reduced boldness but higher contrast

        drawProceduralShape(textCtx, cx, cy, size, centralShape.sides, centralShape.rotation);

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
