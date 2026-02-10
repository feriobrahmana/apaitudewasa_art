(function() {
    'use strict';

    // Supabase Client Alias (from supabaseClient.js)
    // We use 'supabase' locally to match existing code structure
    const supabase = supabaseClient;

    // Canvas elements
    const paintCanvas = document.getElementById('paintCanvas');
    const textCanvas = document.getElementById('textCanvas');
    const paintCtx = paintCanvas.getContext('2d');
    const textCtx = textCanvas.getContext('2d');

    // Canvas Dimensions
    let width, height;

    /**
     * Resizes canvases.
     * Background is redrawn in the animation loop.
     */
    function resizeCanvas() {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;

        // Resize main canvases (this clears them)
        paintCanvas.width = newWidth;
        paintCanvas.height = newHeight;
        textCanvas.width = newWidth;
        textCanvas.height = newHeight;

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

    // Central Shape State (Target)
    let centralShape = {
        sides: 2,
        color: { r: 200, g: 200, b: 200 },
        rotation: 0
    };

    // Central Shape State (Current - for Lerping)
    let currentCentralShape = {
        sides: 2,
        color: { r: 200, g: 200, b: 200 }
    };

    // Background Color State (Target & Current)
    let targetBackgroundColor = { r: 255, g: 255, b: 255 };
    let currentBackgroundColor = { r: 255, g: 255, b: 255 };

    // Initial setup
    initApp();
    updateState();

    async function initApp() {
        // 1. Fetch Canvas State (Background & Central Shape)
        const { data: canvasState, error: stateError } = await supabase
            .from('canvas_state')
            .select('*')
            .eq('id', 1)
            .single();

        if (canvasState && !stateError && canvasState.background_color) {
            // Apply Background State
            const bg = canvasState.background_color;
            targetBackgroundColor = { ...bg };
            currentBackgroundColor = { ...bg }; // Start immediately at this color without transition

            // Apply Central Shape
            if (canvasState.central_shape_sides) {
                centralShape.sides = canvasState.central_shape_sides;
                currentCentralShape.sides = centralShape.sides;
            }
            if (canvasState.central_shape_color) {
                centralShape.color = canvasState.central_shape_color;
                currentCentralShape.color = { ...centralShape.color };
            }
        } else {
            console.warn('Canvas state not found or incomplete, using defaults.');
        }

        // 2. Fetch Recent Contributions (Last 50)
        const { data: contributions, error: contribError } = await supabase
            .from('contributions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (contributions && !contribError) {
            contributions.reverse().forEach(c => {
                spawnParticle(c.word, c.color, c.complexity, true); // true = random start position
            });
        }

        // 3. Subscribe to Realtime Updates (Contributions)
        const channel = supabase.channel('public:contributions');

        channel
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contributions' }, payload => {
                const newContrib = payload.new;
                console.log('New contribution received:', newContrib);

                // Spawn new particle
                spawnParticle(newContrib.word, newContrib.color, newContrib.complexity, false);
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'canvas_state' }, payload => {
                const newState = payload.new;
                console.log('Canvas state updated:', newState);

                // Update central shape target
                if (newState.central_shape_sides) {
                    centralShape.sides = newState.central_shape_sides;
                }
                if (newState.central_shape_color) {
                    centralShape.color = newState.central_shape_color;
                }

                // Update background target
                if (newState.background_color) {
                    targetBackgroundColor = newState.background_color;
                }
            })
            .subscribe();
    }

    async function fetchLatestState() {
        const { data } = await supabase.from('canvas_state').select('*').eq('id', 1).single();
        if (data) {
            // Update targets for lerping
            centralShape.sides = data.central_shape_sides;
            centralShape.color = data.central_shape_color;

            // Update Background Target
            targetBackgroundColor = data.background_color;
        }
    }

    function spawnParticle(text, color, complexity, randomPos) {
        const fontSize = 24;
        let x, y;

        if (randomPos) {
             x = Math.random() * (width - 100);
             y = Math.random() * (height - 50);
        } else {
             // Start near center
             x = width / 2 + (Math.random() - 0.5) * 200;
             y = height / 2 + (Math.random() - 0.5) * 200;
        }

        // Ensure non-zero velocity
        const speed = 0.5;
        const angle = Math.random() * Math.PI * 2;
        const vxFinal = Math.cos(angle) * speed;
        const vyFinal = Math.sin(angle) * speed;

        const particle = new Particle(text, color, x, y, vxFinal, vyFinal, fontSize);
        particles.push(particle);

        if (particles.length > MAX_PARTICLES) {
            particles.shift();
        }
    }

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

    // Handle Submission via Supabase RPC
    async function handlePaintSubmit() {
        const text = wordInput.value.trim();
        if (text.length === 0) return;

        // Disable UI
        paintBtn.disabled = true;
        paintBtn.textContent = 'Adding...';

        try {
            // Call Supabase RPC
            const { data, error } = await supabase.rpc('submit_contribution', {
                p_word: text,
                p_color: currentColor,
                p_complexity: currentComplexity
            });

            if (error) {
                console.error('RPC Error:', error);
                throw error;
            }

            console.log('Contribution submitted successfully:', data);

            // Fetch latest state immediately to update the local UI without waiting for Realtime
            // This ensures the user sees their change instantly
            fetchLatestState();

            // Reset input
            wordInput.value = '';
            // Reset error state logic will run on next input or we can force check
            // Actually input is empty now, so no error.
            wordLimitNote.classList.remove('error');
            wordInput.classList.remove('error');
            wordLimitNote.textContent = 'Limit: 10 words (70 chars)';

        } catch (err) {
            console.error('Error submitting contribution:', err);
            alert('Failed to submit. Please try again.');
        } finally {
            // Re-enable UI (button remains disabled if input is empty due to logic in event listener,
            // but we need to reset text content)
            paintBtn.textContent = 'Add to Canvas';
            // The input listener handles the disabled state based on value
        }
    }

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

    // Animation Loop
    function animate() {
        // --- Background Color Interpolation ---
        const bgLerpSpeed = 0.05;
        currentBackgroundColor.r += (targetBackgroundColor.r - currentBackgroundColor.r) * bgLerpSpeed;
        currentBackgroundColor.g += (targetBackgroundColor.g - currentBackgroundColor.g) * bgLerpSpeed;
        currentBackgroundColor.b += (targetBackgroundColor.b - currentBackgroundColor.b) * bgLerpSpeed;

        // Draw Background
        paintCtx.fillStyle = `rgb(${Math.round(currentBackgroundColor.r)}, ${Math.round(currentBackgroundColor.g)}, ${Math.round(currentBackgroundColor.b)})`;
        paintCtx.fillRect(0, 0, width, height);

        // --- Central Shape Interpolation ---
        // Smoothly transition current shape state towards target centralShape
        const shapeLerpSpeed = 0.05;

        // Clear text canvas only (so particles and shape redraw)
        textCtx.clearRect(0, 0, width, height);

        currentCentralShape.sides += (centralShape.sides - currentCentralShape.sides) * shapeLerpSpeed;
        currentCentralShape.color.r += (centralShape.color.r - currentCentralShape.color.r) * shapeLerpSpeed;
        currentCentralShape.color.g += (centralShape.color.g - currentCentralShape.color.g) * shapeLerpSpeed;
        currentCentralShape.color.b += (centralShape.color.b - currentCentralShape.color.b) * shapeLerpSpeed;

        // Draw Central Shape
        // We draw it on textCtx so it can animate (rotate) smoothly without smearing
        const cx = width / 2;
        const cy = height / 2;
        const size = Math.min(width, height) * 0.25; // Large size

        centralShape.rotation += 0.005; // Slow rotation

        // Calculate darker stroke color for contrast
        const darkStroke = darkenColor(currentCentralShape.color, 50); // Darker by 50 units

        // Set style
        textCtx.fillStyle = `rgba(${Math.round(currentCentralShape.color.r)}, ${Math.round(currentCentralShape.color.g)}, ${Math.round(currentCentralShape.color.b)}, 0.1)`;
        textCtx.strokeStyle = `rgba(${Math.round(darkStroke.r)}, ${Math.round(darkStroke.g)}, ${Math.round(darkStroke.b)}, 1.0)`;
        textCtx.lineWidth = 4; // Reduced boldness but higher contrast

        drawProceduralShape(textCtx, cx, cy, size, currentCentralShape.sides, centralShape.rotation);

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
