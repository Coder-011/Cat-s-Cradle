/**
 * STIMULI - Neon Cat's Cradle Pattern Weaver
 * Hand Gesture Interactive Web Application
 */

const CONFIG = {
    CONFIDENCE_THRESHOLD: 0.7,
    MAX_PARTICLES: 1500,
    SMOOTHING_FACTOR: 0.2,
    FPS_UPDATE_INTERVAL: 500
};

// --- THEME SYSTEM ---
const themes = [
    {
        name: "CYBER NEON",
        primary: "#00FFFF",
        secondary: "#FF00FF",
        accent: "#00FF00",
        bg: "#000000",
        glow: "rgba(0, 255, 255, 0.5)"
    },
    {
        name: "DREAM PASTEL",
        primary: "#FF77FF",
        secondary: "#77FFFF",
        accent: "#DD77FF",
        bg: "#050510",
        glow: "rgba(255, 119, 255, 0.5)"
    },
    {
        name: "FIRE NEON",
        primary: "#FF6600",
        secondary: "#FF0033",
        accent: "#FFFF00",
        bg: "#0a0000",
        glow: "rgba(255, 102, 0, 0.5)"
    },
    {
        name: "OCEAN NEON",
        primary: "#0088FF",
        secondary: "#00FFFF",
        accent: "#0044FF",
        bg: "#000510",
        glow: "rgba(0, 136, 255, 0.5)"
    },
    {
        name: "GALAXY NEON",
        primary: "#BB00FF",
        secondary: "#FF00BB",
        accent: "#00FFBB",
        bg: "#050010",
        glow: "rgba(187, 0, 255, 0.5)"
    }
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
        root.style.setProperty('--theme-primary', this.currentTheme.primary);
        root.style.setProperty('--theme-secondary', this.currentTheme.secondary);
        root.style.setProperty('--theme-accent', this.currentTheme.accent);
        root.style.setProperty('--theme-bg', this.currentTheme.bg);
        root.style.setProperty('--theme-glow', this.currentTheme.glow);
        
        document.getElementById('theme-display').innerText = this.currentTheme.name;
    }
}

// --- PARTICLE SYSTEM ---
class Particle {
    constructor() {
        this.reset();
    }

    reset(x = 0, y = 0, vx = 0, vy = 0, color = "#fff", size = 2) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.size = size;
        this.color = color;
        this.alpha = 1.0;
        this.life = 1.0;
        this.decay = 0.01 + Math.random() * 0.02;
        this.active = true;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.alpha = this.life;
        if (this.life <= 0) this.active = false;
    }

    draw(ctx) {
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 5;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
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
                const speed = Math.random() * 3 + 1;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed;
                const color = type === 'accent' ? theme.accent : (Math.random() > 0.5 ? theme.primary : theme.secondary);
                const size = Math.random() * 2 + 1;
                
                p.reset(x, y, vx, vy, color, size);
                emitted++;
                if (emitted >= count) break;
            }
        }
    }

    update() {
        this.activeCount = 0;
        for (let p of this.pool) {
            if (p.active) {
                p.update();
                this.activeCount++;
            }
        }
    }

    draw(ctx) {
        for (let p of this.pool) {
            if (p.active) p.draw(ctx);
        }
        ctx.globalAlpha = 1.0;
    }
}

// --- PATTERN GENERATOR ---
class PatternGenerator {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.particles = new ParticleSystem();
        this.rotation = 0;
        this.pulse = 0;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawString(x1, y1, x2, y2, color, thickness = 2, glow = 10) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = thickness;
        this.ctx.shadowBlur = glow;
        this.ctx.shadowColor = color;
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }

    drawPoint(x, y, color, size = 5) {
        this.ctx.fillStyle = color;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }

    // Patterns
    drawConstellation(hands, theme) {
        this.pulse += 0.05;
        const glow = 10 + Math.sin(this.pulse) * 5;
        
        // Connect within each hand
        hands.forEach(hand => {
            const landmarks = hand.landmarks;
            const fingertips = [4, 8, 12, 16, 20];
            const palm = landmarks[0];

            // Connect adjacent fingertips
            for (let i = 0; i < fingertips.length - 1; i++) {
                const p1 = landmarks[fingertips[i]];
                const p2 = landmarks[fingertips[i+1]];
                this.drawString(p1.x * this.canvas.width, p1.y * this.canvas.height, p2.x * this.canvas.width, p2.y * this.canvas.height, theme.primary, 2, glow);
            }

            // Connect fingertips to palm
            fingertips.forEach(fIdx => {
                const p = landmarks[fIdx];
                this.drawString(palm.x * this.canvas.width, palm.y * this.canvas.height, p.x * this.canvas.width, p.y * this.canvas.height, theme.secondary, 1, glow / 2);
                this.drawPoint(p.x * this.canvas.width, p.y * this.canvas.height, theme.primary, 4);
                
                if (Math.random() > 0.95) {
                    this.particles.emit(p.x * this.canvas.width, p.y * this.canvas.height, 1, theme);
                }
            });
        });

        // Cross-hand connections
        if (hands.length === 2) {
            const fingertips = [4, 8, 12, 16, 20];
            fingertips.forEach(fIdx => {
                const p1 = hands[0].landmarks[fIdx];
                const p2 = hands[1].landmarks[fIdx];
                this.drawString(p1.x * this.canvas.width, p1.y * this.canvas.height, p2.x * this.canvas.width, p2.y * this.canvas.height, theme.accent, 1, glow);
            });
        }
    }

    drawMandala(hands, theme) {
        if (hands.length < 2) return;
        
        const center = {
            x: ((hands[0].landmarks[0].x + hands[1].landmarks[0].x) / 2) * this.canvas.width,
            y: ((hands[0].landmarks[0].y + hands[1].landmarks[0].y) / 2) * this.canvas.height
        };

        this.rotation += 0.01;
        this.pulse += 0.03;

        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + this.rotation;
            const dist = 100 + Math.sin(this.pulse) * 50;
            
            const x = center.x + Math.cos(angle) * dist;
            const y = center.y + Math.sin(angle) * dist;

            this.drawString(center.x, center.y, x, y, i % 2 === 0 ? theme.primary : theme.secondary, 2, 15);
            this.drawPoint(x, y, theme.accent, 6);
            
            // Outer circles
            this.ctx.beginPath();
            this.ctx.strokeStyle = theme.secondary;
            this.ctx.arc(center.x, center.y, dist, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    drawSpiralGalaxy(hands, theme) {
        this.rotation += 0.05;
        hands.forEach(hand => {
            const center = {
                x: hand.landmarks[0].x * this.canvas.width,
                y: hand.landmarks[0].y * this.canvas.height
            };

            for (let i = 0; i < 50; i++) {
                const angle = i * 0.2 + this.rotation;
                const r = i * 5;
                const x = center.x + Math.cos(angle) * r;
                const y = center.y + Math.sin(angle) * r;
                
                const alpha = 1 - (i / 50);
                this.ctx.globalAlpha = alpha;
                this.drawPoint(x, y, theme.primary, 2);
                
                if (i % 10 === 0) {
                    this.drawString(center.x, center.y, x, y, theme.secondary, 1, 5);
                }
            }
        });
        this.ctx.globalAlpha = 1.0;
    }

    drawWovenTapestry(hands, theme) {
        if (hands.length < 2) return;
        
        const h1 = hands[0].landmarks;
        const h2 = hands[1].landmarks;
        const width = this.canvas.width;
        const height = this.canvas.height;

        for (let i = 0; i < 21; i++) {
            const p1 = h1[i];
            const p2 = h2[i];
            
            this.ctx.globalAlpha = 0.6;
            this.drawString(p1.x * width, p1.y * height, p2.x * width, p2.y * height, i % 2 === 0 ? theme.primary : theme.secondary, 3, 10);
            
            // Interweave lines
            if (i < 20) {
                const p1next = h1[i+1];
                const p2next = h2[i+1];
                this.drawString(p1.x * width, p1.y * height, p2next.x * width, p2next.y * height, theme.accent, 1, 5);
            }
        }
        this.ctx.globalAlpha = 1.0;
    }

    drawSacredGeometry(hands, theme) {
        hands.forEach(hand => {
            // Pinch point (usually between thumb 4 and index 8)
            const p1 = hand.landmarks[4];
            const p2 = hand.landmarks[8];
            const centerX = ((p1.x + p2.x) / 2) * this.canvas.width;
            const centerY = ((p1.y + p2.y) / 2) * this.canvas.height;

            this.pulse += 0.1;
            const scale = 50 + Math.sin(this.pulse) * 10;

            // Hexagon
            this.ctx.beginPath();
            this.ctx.strokeStyle = theme.accent;
            this.ctx.lineWidth = 2;
            for (let i = 0; i <= 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const x = centerX + Math.cos(angle) * scale;
                const y = centerY + Math.sin(angle) * scale;
                if (i === 0) this.ctx.moveTo(x, y);
                else this.ctx.lineTo(x, y);
            }
            this.ctx.stroke();

            // Flower of life (simplified)
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const x = centerX + Math.cos(angle) * (scale / 2);
                const y = centerY + Math.sin(angle) * (scale / 2);
                this.ctx.beginPath();
                this.ctx.arc(x, y, scale / 2, 0, Math.PI * 2);
                this.ctx.stroke();
            }
            
            if (Math.random() > 0.8) {
                this.particles.emit(centerX, centerY, 5, theme, 'accent');
            }
        });
    }

    drawFlowerPattern(hand, theme) {
        const center = hand.landmarks[0];
        const fingertips = [4, 8, 12, 16, 20];
        const width = this.canvas.width;
        const height = this.canvas.height;

        fingertips.forEach((fIdx, i) => {
            const tip = hand.landmarks[fIdx];
            const cx = center.x * width;
            const cy = center.y * height;
            const tx = tip.x * width;
            const ty = tip.y * height;

            // Petal
            this.ctx.beginPath();
            this.ctx.strokeStyle = theme.primary;
            this.ctx.lineWidth = 3;
            this.ctx.moveTo(cx, cy);
            this.ctx.quadraticCurveTo((cx + tx) / 2 + 50, (cy + ty) / 2, tx, ty);
            this.ctx.quadraticCurveTo((cx + tx) / 2 - 50, (cy + ty) / 2, cx, cy);
            this.ctx.stroke();
            
            this.drawPoint(tx, ty, theme.secondary, 5);
        });
    }

    drawMirrorFlip(hands, theme) {
        this.drawConstellation(hands, theme);
        
        this.ctx.save();
        this.ctx.scale(-1, 1);
        this.ctx.translate(-this.canvas.width, 0);
        this.ctx.globalAlpha = 0.5;
        this.drawConstellation(hands, theme);
        this.ctx.restore();
    }
}

// --- GESTURE DETECTION ---
class GestureDetector {
    static calculateDistance(p1, p2) {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }

    static getHandSpread(hand) {
        const palm = hand.landmarks[0];
        const tips = [4, 8, 12, 16, 20];
        let totalDist = 0;
        tips.forEach(t => totalDist += this.calculateDistance(palm, hand.landmarks[t]));
        return (totalDist / 5) * 1000; // Normalized
    }

    static detect(hands) {
        if (!hands || hands.length === 0) return "IDLE";
        
        if (hands.length === 1) {
            const hand = hands[0];
            
            // Pinch Check
            const dThumbIndex = this.calculateDistance(hand.landmarks[4], hand.landmarks[8]);
            if (dThumbIndex < 0.05) return "PINCH";
            
            // Flip Check (Looking at palm orientation - simplified by looking at thumb/pinky relative position)
            const isFlipped = hand.landmarks[4].x > hand.landmarks[20].x; // Crude check for right hand
            // if (isFlipped) return "FLIP";

            return "SINGLE_HAND";
        }

        const h1 = hands[0];
        const h2 = hands[1];
        const dist = this.calculateDistance(h1.landmarks[0], h2.landmarks[0]);
        const spread1 = this.getHandSpread(h1);
        const spread2 = this.getHandSpread(h2);

        if (dist < 0.2) return "HANDS_CLOSE";
        if (spread1 > 150 && spread2 > 150 && dist > 0.4) return "HANDS_APART";
        
        // Rotation check would need previous frames, let's keep it simple
        return "HANDS_APART"; // Default to constellation
    }
}

// --- MAIN APPLICATION ---
class App {
    constructor() {
        this.canvas = document.getElementById('main-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.videoElement = document.getElementById('video-input');
        
        this.themeManager = new ThemeManager();
        this.patterns = new PatternGenerator(this.canvas, this.ctx);
        
        this.hands = null;
        this.currentGesture = "IDLE";
        this.isPaused = false;
        
        this.fps = 0;
        this.lastFrameTime = performance.now();
        this.frameCount = 0;

        this.init();
    }

    async init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.setupEventListeners();
        this.themeManager.apply();
        this.createStars();

        // Initialize MediaPipe Hands
        const hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: CONFIG.CONFIDENCE_THRESHOLD,
            minTrackingConfidence: CONFIG.CONFIDENCE_THRESHOLD
        });

        hands.onResults((results) => {
            this.onHandResults(results);
        });

        const camera = new Camera(this.videoElement, {
            onFrame: async () => {
                if (!this.isPaused) {
                    await hands.send({ image: this.videoElement });
                }
            },
            width: 640,
            height: 480
        });

        camera.start().then(() => {
            document.getElementById('loading-overlay').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('loading-overlay').style.display = 'none';
            }, 1000);
        });

        this.renderLoop();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createStars() {
        const starfield = document.getElementById('starfield');
        for (let i = 0; i < 150; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            const size = Math.random() * 2 + 1;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.animationDuration = `${Math.random() * 3 + 2}s`;
            star.style.animationDelay = `${Math.random() * 5}s`;
            starfield.appendChild(star);
        }
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'Space':
                    this.themeManager.cycle();
                    break;
                case 'KeyH':
                    const help = document.getElementById('help-overlay');
                    help.style.display = help.style.display === 'flex' ? 'none' : 'flex';
                    break;
                case 'KeyP':
                    this.isPaused = !this.isPaused;
                    break;
                case 'KeyR':
                    location.reload();
                    break;
                case 'KeyS':
                    this.takeScreenshot();
                    break;
                case 'Escape':
                    document.getElementById('help-overlay').style.display = 'none';
                    break;
            }
        });
    }

    onHandResults(results) {
        this.hands = results.multiHandLandmarks && results.multiHandLandmarks.length > 0 ? results.multiHandLandmarks.map(lm => ({ landmarks: lm })) : null;
        
        if (this.hands) {
            this.currentGesture = GestureDetector.detect(this.hands);
            document.getElementById('hand-status').innerText = `Hands Detected (${this.hands.length}/2)`;
            document.getElementById('hand-status').style.color = 'var(--theme-accent)';
        } else {
            this.currentGesture = "IDLE";
            document.getElementById('hand-status').innerText = "WAITING...";
            document.getElementById('hand-status').style.color = 'var(--theme-primary)';
        }

        const patternNames = {
            "IDLE": "SEARCHING...",
            "HANDS_APART": "CONSTELLATION",
            "HANDS_CLOSE": "MANDALA",
            "PINCH": "SACRED GEOMETRY",
            "SINGLE_HAND": "FLOWER PATTERN",
            "WEAVING": "WOVEN TAPESTRY",
            "ROTATING": "SPIRAL GALAXY"
        };
        document.getElementById('pattern-name').innerText = patternNames[this.currentGesture] || "UNKNOWN";
    }

    renderLoop() {
        const now = performance.now();
        const delta = now - this.lastFrameTime;
        this.frameCount++;

        if (delta >= CONFIG.FPS_UPDATE_INTERVAL) {
            this.fps = Math.round((this.frameCount * 1000) / delta);
            this.frameCount = 0;
            this.lastFrameTime = now;
            document.getElementById('performance-stats').innerText = `FPS: ${this.fps} | PARTICLES: ${this.patterns.particles.activeCount}`;
        }

        this.patterns.clear();
        
        if (this.hands && !this.isPaused) {
            const theme = this.themeManager.currentTheme;
            switch(this.currentGesture) {
                case "HANDS_APART": this.patterns.drawConstellation(this.hands, theme); break;
                case "HANDS_CLOSE": this.patterns.drawMandala(this.hands, theme); break;
                case "PINCH": this.patterns.drawSacredGeometry(this.hands, theme); break;
                case "SINGLE_HAND": this.patterns.drawFlowerPattern(this.hands[0], theme); break;
                // Simplified fallbacks
                default: this.patterns.drawConstellation(this.hands, theme); break;
            }
        }

        this.patterns.particles.update();
        this.patterns.particles.draw(this.ctx);

        requestAnimationFrame(() => this.renderLoop());
    }

    takeScreenshot() {
        const link = document.createElement('a');
        link.download = `stimuli-pattern-${Date.now()}.png`;
        link.href = this.canvas.toDataURL();
        link.click();
    }
}

// Start the app
window.onload = () => {
    new App();
};
