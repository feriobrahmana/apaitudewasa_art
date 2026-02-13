(function() {
    'use strict';

    console.log('--- REWRITE: Living Canvas Starting ---');

    // 1. Dependency Check: Mixbox
    if (typeof mixbox === 'undefined') {
        console.error('CRITICAL: mixbox.js not loaded!');
        alert('Error: mixbox.js is missing. Please check your internet connection or deployment.');
        return;
    }

    // 2. Supabase Setup
    // Ensure supabaseClient is available (from the script tag in HTML)
    const supabase = (typeof supabaseClient !== 'undefined') ? supabaseClient : null;
    if (!supabase) {
        console.error('CRITICAL: Supabase client not initialized.');
    }

    // 3. Canvas Setup
    const paintCanvas = document.getElementById('paintCanvas');
    const textCanvas = document.getElementById('textCanvas');
    const paintCtx = paintCanvas.getContext('2d');
    const textCtx = textCanvas.getContext('2d');

    let width = window.innerWidth;
    let height = window.innerHeight;

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        paintCanvas.width = width;
        paintCanvas.height = height;
        textCanvas.width = width;
        textCanvas.height = height;
    }
    window.addEventListener('resize', resize);
    resize();

    // 4. State Management
    // We use "Target" vs "Current" for smooth animation
    const state = {
        bg: {
            current: [255, 255, 255], // RGB Array for mixbox
            target: [255, 255, 255]   // RGB Array for mixbox
        },
        shape: {
            currentSides: 4,
            targetSides: 4,
            currentColor: [200, 200, 200],
            targetColor: [200, 200, 200],
            rotation: 0
        },
        particles: [], // Array of {x, y, vx, vy, text, color}
    };

    const CONSTANTS = {
        MIX_SPEED: 0.15, // Speed of color transition (0.0 to 1.0)
        PARTICLE_LIMIT: 50,
        FONT: '24px "Times New Roman"'
    };

    // 5. Core Logic: The Loop
    function animate() {
        // A. Clear Layers
        // paintCanvas is cleared by fillRect
        textCtx.clearRect(0, 0, width, height);

        // B. Background Color Mixing (Mixbox)
        // mixbox.lerp(color1, color2, t) -> returns new color
        // We want to move 'current' towards 'target'
        if (state.bg.target) {
            state.bg.current = mixbox.lerp(state.bg.current, state.bg.target, CONSTANTS.MIX_SPEED);
        }

        // Draw Background
        const [r, g, b] = state.bg.current.map(c => Math.round(c));
        paintCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        paintCtx.fillRect(0, 0, width, height);

        // C. Central Shape Animation
        state.shape.currentSides += (state.shape.targetSides - state.shape.currentSides) * 0.05;
        // Simple RGB lerp for shape is fine
        state.shape.currentColor[0] += (state.shape.targetColor[0] - state.shape.currentColor[0]) * 0.05;
        state.shape.currentColor[1] += (state.shape.targetColor[1] - state.shape.currentColor[1]) * 0.05;
        state.shape.currentColor[2] += (state.shape.targetColor[2] - state.shape.currentColor[2]) * 0.05;

        state.shape.rotation += 0.005;

        drawShape(
            textCtx,
            width / 2,
            height / 2,
            Math.min(width, height) * 0.25,
            state.shape.currentSides,
            state.shape.currentColor,
            state.shape.rotation
        );

        // D. Particles (Physics)
        updateAndDrawParticles();

        requestAnimationFrame(animate);
    }

    function updateAndDrawParticles() {
        textCtx.font = CONSTANTS.FONT;
        textCtx.textBaseline = 'top';

        for (let i = 0; i < state.particles.length; i++) {
            const p = state.particles[i];

            // Physics
            p.x += p.vx;
            p.y += p.vy;

            // Bounce
            if (p.x < 0 || p.x > width - 100) p.vx *= -1; // rough bounds
            if (p.y < 0 || p.y > height - 30) p.vy *= -1;

            // Draw
            textCtx.fillStyle = `rgb(${p.color.r}, ${p.color.g}, ${p.color.b})`;
            textCtx.fillText(p.text, p.x, p.y);
        }
    }

    function drawShape(ctx, cx, cy, size, sides, color, rotation) {
        ctx.beginPath();
        const step = (Math.PI * 2) / Math.max(2, Math.floor(sides));
        const rgb = `rgb(${Math.round(color[0])}, ${Math.round(color[1])}, ${Math.round(color[2])})`;

        for (let i = 0; i < sides; i++) {
            const theta = i * step + rotation;
            const x = cx + Math.cos(theta) * size;
            const y = cy + Math.sin(theta) * size;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.lineWidth = 4;
        ctx.strokeStyle = rgb; // Stroke only for "blueprint" look
        ctx.fillStyle = rgb.replace('rgb', 'rgba').replace(')', ', 0.1)'); // Faint fill
        ctx.fill();
        ctx.stroke();
    }

    // 6. Interaction Logic (Optimistic UI)
    const uiToggle = document.getElementById('ui-toggle');
    const uiToggleIcon = uiToggle.querySelector('.icon');
    const uiPanel = document.getElementById('ui-panel');

    const paintBtn = document.getElementById('paintBtn');
    const wordInput = document.getElementById('wordInput');
    const rSlider = document.getElementById('rSlider');
    const gSlider = document.getElementById('gSlider');
    const bSlider = document.getElementById('bSlider');
    const cSlider = document.getElementById('cSlider');

    // UI Toggle Logic
    uiToggle.addEventListener('click', () => {
        uiPanel.classList.toggle('hidden');
        uiToggleIcon.textContent = uiPanel.classList.contains('hidden') ? 'Contribute' : 'Close';
    });

    // Attach Event Listeners
    paintBtn.addEventListener('click', handleSubmit);
    wordInput.addEventListener('input', () => {
        // Simple validation
        if (wordInput.value.length > 0) paintBtn.disabled = false;
        else paintBtn.disabled = true;
    });

    wordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSubmit();
    });

    async function handleSubmit() {
        const text = wordInput.value.trim();
        if (!text) return;

        const r = parseInt(rSlider.value);
        const g = parseInt(gSlider.value);
        const b = parseInt(bSlider.value);
        const complexity = parseInt(cSlider.value) / 100;

        const colorObj = { r, g, b };
        const colorArr = [r, g, b];

        // --- OPTIMISTIC UPDATE ---
        console.log('Optimistic Update: Adding particle and mixing color...');

        // 1. Add Particle Immediately
        state.particles.push({
            text: text,
            color: colorObj,
            x: width / 2,
            y: height / 2,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4
        });
        if (state.particles.length > CONSTANTS.PARTICLE_LIMIT) state.particles.shift();

        // 2. Mix Background Immediately (Visual only, DB will confirm later)
        // We push the "Target" towards the new color so the lerp starts immediately
        state.bg.target = mixbox.lerp(state.bg.target, colorArr, 0.3); // Significant jump

        // 3. Reset Input
        wordInput.value = '';
        paintBtn.disabled = true;

        // --- BACKEND SYNC ---
        if (supabase) {
            const { error } = await supabase.rpc('submit_contribution', {
                p_word: text,
                p_color: colorObj,
                p_complexity: complexity
            });

            if (error) {
                console.error('Supabase RPC Error:', error);
                // Even on error, we keep the local optimistic state so the user doesn't feel "broken"
            } else {
                console.log('Backend confirmed submission. Fetching latest authoritative state...');
                // 4. Force Fetch & SNAP
                // Instead of waiting for Realtime (which might lag), we explicitly fetch.
                fetchLatestState();
            }
        }
    }

    async function fetchLatestState() {
        if (!supabase) return;
        const { data, error } = await supabase.from('canvas_state').select('*').eq('id', 1).single();

        if (data && data.background_color) {
            const bg = data.background_color;
            const newTarget = [bg.r, bg.g, bg.b];

            // "Snap" effect: To ensure the user sees the server state is accepted,
            // we set the target. We can also force 'current' to be closer to 'target'
            // if we want to "catch up" instantly.
            // Let's rely on the animate loop to lerp to this new authoritative target.
            // If the optimistic guess was close, this will be smooth.
            // If the DB logic (average) is different from local optimistic (mixbox),
            // the colors will correct themselves towards the DB truth.
            state.bg.target = newTarget;

            if (data.central_shape_color) {
                const sc = data.central_shape_color;
                state.shape.targetColor = [sc.r, sc.g, sc.b];
                state.shape.targetSides = data.central_shape_sides || 4;
            }
        }
    }

    // 7. Realtime & Initialization
    async function init() {
        animate(); // Start loop

        if (!supabase) return;

        // Fetch Initial State
        await fetchLatestState();
        // Snap current to target initially so we don't fade in from white every reload
        if (state.bg.target) {
            state.bg.current = [...state.bg.target];
        }

        // Subscribe to changes
        supabase.channel('canvas_updates')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contributions' }, payload => {
                const c = payload.new;
                console.log('Realtime Particle:', c.word);
                // Only spawn if it wasn't just added by US (Optimistic).
                // Simple dedupe: check if the LAST particle added matches this one exactly.
                // Or just allow duplicates for "energy". Let's allow duplicates for now to ensure visibility.
                state.particles.push({
                    text: c.word,
                    color: c.color,
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4
                });
                if (state.particles.length > CONSTANTS.PARTICLE_LIMIT) state.particles.shift();
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'canvas_state' }, payload => {
                const s = payload.new;
                console.log('Realtime State:', s.background_color);
                if (s.background_color) {
                    state.bg.target = [s.background_color.r, s.background_color.g, s.background_color.b];
                }
                if (s.central_shape_color) {
                    state.shape.targetColor = [s.central_shape_color.r, s.central_shape_color.g, s.central_shape_color.b];
                    state.shape.targetSides = s.central_shape_sides;
                }
            })
            .subscribe();
    }

    // Start
    init();

    // UI Helpers (Preview, Sliders) - kept simple
    function updateUIPreview() {
        const r = parseInt(rSlider.value);
        const g = parseInt(gSlider.value);
        const b = parseInt(bSlider.value);
        previewCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        previewCtx.fillRect(0, 0, 240, 60);
    }
    [rSlider, gSlider, bSlider].forEach(s => s.addEventListener('input', updateUIPreview));
    updateUIPreview();

})();
