/**
 * STIMULI - Generative Evolution
 * Hand Gesture Interactive Web Application
 */

const CONFIG = {
    CONFIDENCE_THRESHOLD: 0.7,
    MAX_PARTICLES: 2000,
    SMOOTHING_FACTOR: 0.15,
    FPS_UPDATE_INTERVAL: 500,
    LATTICE_SIZE: 50
};

// --- THEME SYSTEM ---
const themes = [
    { name: "CYBER NEON", primary: "#00FFFF", secondary: "#FF00FF", accent: "#00FF00", bg: "#000000", glow: "rgba(0, 255, 255, 0.5)" },
    { name: "DREAM PASTEL", primary: "#FF77FF", secondary: "#77FFFF", accent: "#DD77FF", bg: "#050510", glow: "rgba(255, 119, 255, 0.5)" },
    { name: "FIRE NEON", primary: "#FF6600", secondary: "#FF0033", accent: "#FFFF00", bg: "#0a0000", glow: "rgba(255, 102, 0, 0.5)" },
    { name: "OCEAN NEON", primary: "#0088FF", secondary: "#00FFFF", accent: "#0044FF", bg: "#000510", glow: "rgba(0, 136, 255, 0.5)" },
    { name: "GALAXY NEON", primary: "#BB00FF", secondary: "#FF00BB", accent: "#00FFBB", bg: "#050010", glow: "rgba(187, 0, 255, 0.5)" }
];

class ThemeManager {
    constructor() {
        this.currentIndex = 0;
        this.currentTheme = themes[0];
    }
    cycle() {
        this.currentIndex = (this.currentIndex + 1) % themes.length;
        this.currentTheme = themes[this.currentIndex];
        this.apply();
        return this.currentTheme;
    }
    apply() {
        const root = document.documentElement;
        Object.keys(this.currentTheme).forEach(key => {
            if (key !== 'name') root.style.setProperty(`--theme-${key}`, this.currentTheme[key]);
        });
        document.getElementById('theme-display').innerText = this.currentTheme.name;
    }
}

// --- PARTICLE SYSTEM ---
class Particle {
    constructor() { this.reset(); }
    reset(x = 0, y = 0, vx = 0, vy = 0, color = "#fff", size = 2) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy;
        this.size = size; this.color = color;
        this.life = 1.0; this.decay = 0.01 + Math.random() * 0.02;
        this.active = true;
    }
    update() {
        this.x += this.vx; this.y += this.vy;
        this.life -= this.decay;
        if (this.life <= 0) this.active = false;
    }
    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 5; ctx.shadowColor = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
    }
}

class ParticleSystem {
    constructor() {
        this.pool = Array.from({ length: CONFIG.MAX_PARTICLES }, () => new Particle());
        this.activeCount = 0;
    }
    emit(x, y, count, theme, type = 'normal') {
        let emitted = 0;
        for (let p of this.pool) {
            if (!p.active) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 2 + 1;
                p.reset(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 
                        type === 'accent' ? theme.accent : (Math.random() > 0.5 ? theme.primary : theme.secondary), 
                        Math.random() * 2 + 1);
                if (++emitted >= count) break;
            }
        }
    }
    update() {
        this.activeCount = 0;
        for (let p of this.pool) { if (p.active) { p.update(); this.activeCount++; } }
    }
    draw(ctx) {
        for (let p of this.pool) { if (p.active) p.draw(ctx); }
        ctx.globalAlpha = 1.0;
    }
}

// --- GENERATIVE WEAVING ENGINE ---
class GenerativeEngine {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.particles = new ParticleSystem();
        this.symmetry = 1;
        this.useHarmonics = true;
        this.pulse = 0;
    }

    draw(hands, theme, mode) {
        this.pulse += 0.05;
        if (mode === 'OBJECT') {
            this.drawObjectMode(hands, theme);
        } else {
            this.drawWeaverMode(hands, theme);
        }
    }

    drawWeaverMode(hands, theme) {
        if (!hands || hands.length === 0) return;

        const width = this.canvas.width;
        const height = this.canvas.height;

        // Apply Symmetry
        for (let s = 0; s < this.symmetry; s++) {
            this.ctx.save();
            if (this.symmetry > 1) {
                this.ctx.translate(width / 2, height / 2);
                this.ctx.rotate((s / this.symmetry) * Math.PI * 2);
                this.ctx.translate(-width / 2, -height / 2);
            }

            this.renderWeaving(hands, theme, width, height);
            this.ctx.restore();
        }
    }

    renderWeaving(hands, theme, width, height) {
        const fingertips = [4, 8, 12, 16, 20];
        
        hands.forEach((hand, hIdx) => {
            const points = hand.landmarks;
            const hColor = hIdx === 0 ? theme.primary : theme.secondary;

            // 1. Draw "Beautified" Bone Structure
            fingertips.forEach(fIdx => {
                const tip = points[fIdx];
                const palm = points[0];
                this.drawHarmonicLine(palm.x * width, palm.y * height, tip.x * width, tip.y * height, hColor, 2);
            });

            // 2. Inter-finger Weaving
            for (let i = 0; i < fingertips.length - 1; i++) {
                const p1 = points[fingertips[i]];
                const p2 = points[fingertips[i+1]];
                this.drawHarmonicLine(p1.x * width, p1.y * height, p2.x * width, p2.y * height, theme.accent, 1.5);
            }

            // 3. Lattice Snapping (The "Algorithm" that makes it look good)
            fingertips.forEach(fIdx => {
                const p = points[fIdx];
                const snapX = Math.round((p.x * width) / CONFIG.LATTICE_SIZE) * CONFIG.LATTICE_SIZE;
                const snapY = Math.round((p.y * height) / CONFIG.LATTICE_SIZE) * CONFIG.LATTICE_SIZE;
                
                this.ctx.globalAlpha = 0.3;
                this.drawHarmonicLine(p.x * width, p.y * height, snapX, snapY, theme.accent, 0.5);
                this.ctx.globalAlpha = 1.0;
            });
        });

        // 4. Cross-Hand Generative Bridges
        if (hands.length === 2) {
            fingertips.forEach(fIdx => {
                const p1 = hands[0].landmarks[fIdx];
                const p2 = hands[1].landmarks[fIdx];
                const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
                
                if (dist < 0.4) {
                    this.drawHarmonicLine(p1.x * width, p1.y * height, p2.x * width, p2.y * height, theme.accent, 2, true);
                }
            });
        }
    }

    drawHarmonicLine(x1, y1, x2, y2, color, width, isBridge = false) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.shadowBlur = isBridge ? 15 : 5;
        this.ctx.shadowColor = color;

        if (this.useHarmonics) {
            const midX = (x1 + x2) / 2 + Math.sin(this.pulse) * 20;
            const midY = (y1 + y2) / 2 + Math.cos(this.pulse) * 20;
            this.ctx.moveTo(x1, y1);
            this.ctx.quadraticCurveTo(midX, midY, x2, y2);
        } else {
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
        }
        
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }

    drawObjectMode(hands, theme) {
        const shape = ShapeRecognizer.identify(hands);
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        document.getElementById('pattern-name').innerText = shape.toUpperCase();

        if (hands.length === 0) return;

        const center = hands.length === 2 
            ? { x: (hands[0].landmarks[0].x + hands[1].landmarks[0].x) / 2, y: (hands[0].landmarks[0].y + hands[1].landmarks[0].y) / 2 }
            : { x: hands[0].landmarks[0].x, y: hands[0].landmarks[0].y };

        this.renderObject(shape, center.x * width, center.y * height, hands, theme);
    }

    renderObject(shape, x, y, hands, theme) {
        this.ctx.strokeStyle = theme.primary;
        this.ctx.lineWidth = 3;
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = theme.primary;

        switch(shape) {
            case 'WINGS': // Bird/Butterfly
                this.drawWings(x, y, hands, theme);
                break;
            case 'TOWER': // Spire/Temple
                this.drawTower(x, y, hands, theme);
                break;
            case 'LOTUS': // Flower/Bowl
                this.drawLotus(x, y, hands, theme);
                break;
            case 'EYE': // Planet/Eye
                this.drawEye(x, y, hands, theme);
                break;
            default:
                this.drawGeneric(x, y, hands, theme);
        }
        this.ctx.shadowBlur = 0;
    }

    drawWings(x, y, hands, theme) {
        if (hands.length < 2) return;
        const h1 = hands[0].landmarks;
        const h2 = hands[1].landmarks;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Draw body
        this.drawHarmonicLine(x, y - 50, x, y + 50, theme.accent, 5);

        // Draw wings based on hand spread
        [h1, h2].forEach((hand, idx) => {
            const dir = idx === 0 ? -1 : 1;
            const tip = hand[8]; // Index finger
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.bezierCurveTo(x + dir * 100, y - 200, tip.x * w, tip.y * h - 100, tip.x * w, tip.y * h);
            this.ctx.bezierCurveTo(tip.x * w, tip.y * h + 100, x + dir * 100, y + 200, x, y);
            this.ctx.stroke();
        });
    }

    drawTower(x, y, hands, theme) {
        const h = this.canvas.height;
        const w = this.canvas.width;
        this.ctx.beginPath();
        this.ctx.moveTo(x - 50, h);
        this.ctx.lineTo(x, y);
        this.ctx.lineTo(x + 50, h);
        this.ctx.stroke();
        
        // Rings
        for(let i=0; i<3; i++) {
            this.ctx.beginPath();
            this.ctx.ellipse(x, y + i * 100, 40 - i*10, 10, 0, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    drawLotus(x, y, hands, theme) {
        const petals = 8;
        for(let i=0; i<petals; i++) {
            const angle = (i / petals) * Math.PI * 2 + this.pulse * 0.2;
            const px = x + Math.cos(angle) * 100;
            const py = y + Math.sin(angle) * 100;
            this.ctx.beginPath();
            this.ctx.ellipse(px, py, 40, 20, angle, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    drawEye(x, y, hands, theme) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 60, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(x - 120, y);
        this.ctx.quadraticCurveTo(x, y - 100, x + 120, y);
        this.ctx.quadraticCurveTo(x, y + 100, x - 120, y);
        this.ctx.stroke();
    }

    drawGeneric(x, y, hands, theme) {
        this.drawWeaverMode(hands, theme);
    }
}

// --- SHAPE RECOGNIZER ---
class ShapeRecognizer {
    static identify(hands) {
        if (!hands || hands.length === 0) return "NONE";
        
        if (hands.length === 2) {
            const h1 = hands[0].landmarks;
            const h2 = hands[1].landmarks;
            
            // 1. Wings Detection (Hands far apart, high elevation)
            const dist = Math.hypot(h1[0].x - h2[0].x, h1[0].y - h2[0].y);
            if (dist > 0.5 && h1[8].y < h1[0].y && h2[8].y < h2[0].y) return "WINGS";

            // 2. Tower Detection (Hands close, pointing up)
            if (dist < 0.2 && h1[8].y < h1[0].y - 0.1 && h2[8].y < h2[0].y - 0.1) return "TOWER";

            // 3. Lotus Detection (Hands close, palms up/spread)
            if (dist < 0.3 && h1[8].y > h1[0].y - 0.05) return "LOTUS";
        }

        if (hands.length === 1) {
            const h = hands[0].landmarks;
            const dThumbIndex = Math.hypot(h[4].x - h[8].x, h[4].y - h[8].y);
            if (dThumbIndex < 0.05) return "EYE";
        }

        return "UNKNOWN";
    }
}

// --- MAIN APPLICATION ---
class App {
    constructor() {
        this.canvas = document.getElementById('main-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.videoElement = document.getElementById('video-input');
        
        this.themeManager = new ThemeManager();
        this.engine = new GenerativeEngine(this.canvas, this.ctx);
        
        this.hands = null;
        this.mode = 'WEAVER'; // WEAVER or OBJECT
        this.isPaused = false;
        this.fps = 0; this.lastFrameTime = performance.now(); this.frameCount = 0;

        this.init();
    }

    async init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.setupEventListeners();
        this.themeManager.apply();
        this.createStars();

        const hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
        hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: CONFIG.CONFIDENCE_THRESHOLD, minTrackingConfidence: CONFIG.CONFIDENCE_THRESHOLD });
        hands.onResults((r) => this.onHandResults(r));

        const camera = new Camera(this.videoElement, {
            onFrame: async () => { if (!this.isPaused) await hands.send({ image: this.videoElement }); },
            width: 640, height: 480
        });

        camera.start().then(() => {
            document.getElementById('loading-overlay').style.opacity = '0';
            setTimeout(() => document.getElementById('loading-overlay').style.display = 'none', 1000);
        });

        this.renderLoop();
    }

    resize() { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; }

    createStars() {
        const starfield = document.getElementById('starfield');
        for (let i = 0; i < 150; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.width = star.style.height = `${Math.random() * 2 + 1}px`;
            star.style.left = `${Math.random() * 100}%`; star.style.top = `${Math.random() * 100}%`;
            star.style.animationDuration = `${Math.random() * 3 + 2}s`;
            starfield.appendChild(star);
        }
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'Space': this.themeManager.cycle(); break;
                case 'KeyM': 
                    this.mode = this.mode === 'WEAVER' ? 'OBJECT' : 'WEAVER'; 
                    document.getElementById('app-mode').innerText = this.mode;
                    break;
                case 'KeyL': this.engine.useHarmonics = !this.engine.useHarmonics; break;
                case 'KeyK': this.engine.symmetry = this.engine.symmetry === 1 ? 4 : (this.engine.symmetry === 4 ? 6 : 1); break;
                case 'KeyH': const help = document.getElementById('help-overlay'); help.style.display = help.style.display === 'flex' ? 'none' : 'flex'; break;
                case 'KeyP': this.isPaused = !this.isPaused; break;
                case 'KeyR': location.reload(); break;
                case 'Escape': document.getElementById('help-overlay').style.display = 'none'; break;
            }
        });
    }

    onHandResults(results) {
        this.hands = results.multiHandLandmarks?.length > 0 ? results.multiHandLandmarks.map(lm => ({ landmarks: lm })) : null;
        if (this.hands) {
            document.getElementById('hand-status').innerText = `LIVE (${this.hands.length})`;
            if (this.mode === 'WEAVER') document.getElementById('pattern-name').innerText = "GENERATIVE WEAVE";
        } else {
            document.getElementById('hand-status').innerText = "WAITING...";
            document.getElementById('pattern-name').innerText = "IDLE";
        }
    }

    renderLoop() {
        const now = performance.now();
        const delta = now - this.lastFrameTime;
        this.frameCount++;

        if (delta >= CONFIG.FPS_UPDATE_INTERVAL) {
            this.fps = Math.round((this.frameCount * 1000) / delta);
            this.frameCount = 0; this.lastFrameTime = now;
            document.getElementById('performance-stats').innerText = `FPS: ${this.fps} | MODE: ${this.mode}`;
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.hands && !this.isPaused) {
            this.engine.draw(this.hands, this.themeManager.currentTheme, this.mode);
        }

        this.engine.particles.update();
        this.engine.particles.draw(this.ctx);
        requestAnimationFrame(() => this.renderLoop());
    }
}

window.onload = () => new App();
