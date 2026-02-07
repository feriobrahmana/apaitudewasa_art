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
    const colorPreview = document.getElementById('colorPreview');
    const paintBtn = document.getElementById('paintBtn');

    // State
    let currentColor = { r: 100, g: 100, b: 200 };
    let particles = [];
    const MAX_PARTICLES = 250;

    // Initial color setup
    updateColor();

    function updateColor() {
        const r = parseInt(rSlider.value);
        const g = parseInt(gSlider.value);
        const b = parseInt(bSlider.value);

        currentColor = { r, g, b };

        colorPreview.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
    }

    // Event Listeners
    rSlider.addEventListener('input', updateColor);
    gSlider.addEventListener('input', updateColor);
    bSlider.addEventListener('input', updateColor);

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

            // Friction removed for constant movement
            // this.vx *= 0.999;
            // this.vy *= 0.999;

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
