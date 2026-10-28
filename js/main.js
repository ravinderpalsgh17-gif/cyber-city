// Cyber City - Master Game Orchestrator (GTA IV Edition)
// Initializes Three.js engine with cinematic lighting, ACES filmic tone mapping, input listeners, and splash screen flow.

class InputManager {
    constructor() {
        this.keys = {};
        this.consumedKeys = {};
        this.mouse = { x: 0, y: 0, down: false, rightDown: false };
        this.mouseDelta = { x: 0, y: 0 };

        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (window.soundEngine) window.soundEngine.init();
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.consumedKeys[e.code] = false;
        });

        window.addEventListener('mousedown', (e) => {
            if (window.soundEngine) window.soundEngine.init();
            if (e.button === 0) this.mouse.down = true;
            if (e.button === 2) this.mouse.rightDown = true;
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.mouse.down = false;
            if (e.button === 2) this.mouse.rightDown = false;
        });

        window.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement) {
                this.mouseDelta.x += e.movementX;
                this.mouseDelta.y += e.movementY;
            }
        });

        window.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    consumeKey(code) {
        if (this.keys[code] && !this.consumedKeys[code]) {
            this.consumedKeys[code] = true;
            return true;
        }
        return false;
    }
}

class Game {
    constructor() {
        this.container = document.getElementById('game-container');
        this.clock = new THREE.Clock();

        try {
            this.initThree();
            this.input = new InputManager();

            // Subsystems
            this.city = new CityManager(this.scene);
            this.player = new Player(this.scene, this.city, this.camera);
            this.vehicle = new CyberVehicle(this.scene, this.city, this.city.spawns.vehicle);
            this.enemies = new EnemyManager(this.scene, this.player, this.city);
            this.weapons = new WeaponSystem(this.scene, this.player, this.enemies);
            this.missions = new MissionManager(this.scene, this.player, this.vehicle, this.city, this.enemies, this.weapons);
            this.minimap = new Minimap(this.player, this.vehicle, this.enemies, this.missions);

            this.initControls();
            this.initHUD();

            window.addEventListener('resize', () => this.onResize());
            this.animate = this.animate.bind(this);
            requestAnimationFrame(this.animate);
        } catch (err) {
            console.error("Game Initialization Error:", err);
            const errBanner = document.getElementById('error-banner');
            if (errBanner) {
                errBanner.textContent = "Error initializing game: " + err.message;
                errBanner.classList.remove('hidden');
            }
        }
    }

    initThree() {
        this.scene = new THREE.Scene();

        // GTA 4 Golden Hour Atmospheric Fog (Warm dusky haze, NOT pitch black!)
        this.scene.fog = new THREE.FogExp2(0x382c35, 0.0022);

        this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 10);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // High-Quality Soft Shadow Maps
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // ACES Filmic Tone Mapping for cinematic GTA 4 RAGE engine contrast
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.35;

        this.container.appendChild(this.renderer.domElement);

        // GTA 4 Dusk Sun Lighting
        const sunLight = new THREE.DirectionalLight(0xffd4a3, 2.4);
        sunLight.position.set(280, 160, -480);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 20;
        sunLight.shadow.camera.far = 700;
        sunLight.shadow.camera.left = -220;
        sunLight.shadow.camera.right = 220;
        sunLight.shadow.camera.top = 220;
        sunLight.shadow.camera.bottom = -220;
        sunLight.shadow.bias = -0.0004;
        this.scene.add(sunLight);

        // Warm Ambient Fill (Algonquin dusk sky + warm city bounce)
        const ambientLight = new THREE.AmbientLight(0x4f4157, 1.4);
        this.scene.add(ambientLight);

        // Hemisphere Sky Bounce Light
        const hemiLight = new THREE.HemisphereLight(0xffb07c, 0x24283b, 0.9);
        this.scene.add(hemiLight);
    }

    initControls() {
        // Start Screen Button
        const startBtn = document.getElementById('start-btn');
        const startScreen = document.getElementById('start-screen');
        const canvas = this.renderer.domElement;

        if (startBtn && startScreen) {
            startBtn.addEventListener('click', () => {
                startScreen.classList.add('hidden');
                window.soundEngine.init();
                canvas.requestPointerLock();
            });
        }

        // Click canvas to lock pointer
        canvas.addEventListener('click', () => {
            if (!document.pointerLockElement) {
                canvas.requestPointerLock();
            }
        });

        // Mouse wheel weapon switching
        window.addEventListener('wheel', (e) => {
            if (e.deltaY > 0) this.weapons.nextWeapon();
            else this.weapons.prevWeapon();
        });

        // Number keys 1 to 9 and 0 for 15 weapons
        const keyMap = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0'];
        window.addEventListener('keydown', (e) => {
            const idx = keyMap.indexOf(e.code);
            if (idx !== -1) this.weapons.selectWeapon(idx);
            if (e.code === 'Minus') this.weapons.selectWeapon(10);
            if (e.code === 'Equal') this.weapons.selectWeapon(11);
            if (e.code === 'KeyQ') this.weapons.prevWeapon();
            if (e.code === 'KeyR') {
                const track = window.soundEngine.nextTrack();
                const radioEl = document.getElementById('radio-status');
                if (radioEl) radioEl.textContent = `RADIO: ${track.toUpperCase()}`;
            }
            if (e.code === 'KeyM') {
                window.soundEngine.toggleMusic();
                const radioEl = document.getElementById('radio-status');
                if (radioEl) radioEl.textContent = window.soundEngine.musicPlaying ? `RADIO: ${window.soundEngine.getCurrentTrackName().toUpperCase()}` : 'RADIO: OFF';
            }
        });

        // Respawn button
        const respawnBtn = document.getElementById('respawn-btn');
        if (respawnBtn) {
            respawnBtn.addEventListener('click', () => {
                this.player.respawn(this.city.spawns.player);
            });
        }

        // Clickable HUD weapon slots
        document.querySelectorAll('.weapon-slot').forEach((slot, index) => {
            slot.addEventListener('click', (e) => {
                e.stopPropagation();
                this.weapons.selectWeapon(index);
            });
        });
    }

    initHUD() {
        this.weapons.updateHUD();
        this.missions.updateHUD();
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(this.animate);
        const delta = Math.min(this.clock.getDelta(), 0.1);

        if (document.pointerLockElement) {
            const sens = 0.0022;
            this.player.yaw -= this.input.mouseDelta.x * sens;
            this.player.pitch -= this.input.mouseDelta.y * sens;
            this.player.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.player.pitch));
        }
        this.input.mouseDelta.x = 0;
        this.input.mouseDelta.y = 0;

        if (this.input.mouse.down && !this.player.inVehicle && !this.player.isDead) {
            this.weapons.fire();
        }

        this.vehicle.update(delta, this.input);
        this.player.update(delta, this.input, this.vehicle);
        this.weapons.update(delta);
        this.enemies.update(delta);
        this.missions.update(delta);
        this.minimap.render();

        this.updateHUD(delta);

        this.renderer.render(this.scene, this.camera);
    }

    updateHUD(delta) {
        const hpBar = document.getElementById('health-bar-fill');
        const hpText = document.getElementById('health-text');
        const spBar = document.getElementById('shield-bar-fill');
        const spText = document.getElementById('shield-text');

        if (hpBar) hpBar.style.width = Math.max(0, this.player.health) + '%';
        if (hpText) hpText.textContent = `${Math.ceil(this.player.health)} HP`;
        if (spBar) spBar.style.width = Math.max(0, this.player.shield) + '%';
        if (spText) spText.textContent = `${Math.ceil(this.player.shield)} ARMOR`;

        const promptEl = document.getElementById('interaction-prompt');
        const speedoEl = document.getElementById('speedo-hud');
        const speedValEl = document.getElementById('speed-value');
        const nitroBar = document.getElementById('nitro-bar-fill');

        if (this.player.inVehicle) {
            if (promptEl) {
                promptEl.textContent = '[E] / [F] EXIT SUPERCAR | [SHIFT] NITRO | [SPACE] DRIFT';
                promptEl.classList.remove('hidden');
            }
            if (speedoEl) speedoEl.classList.remove('hidden');
            if (speedValEl) speedValEl.textContent = Math.abs(Math.floor(this.vehicle.speed * 3.6));
            if (nitroBar) nitroBar.style.width = this.vehicle.nitro + '%';
        } else {
            const distToCar = this.player.pos.distanceTo(this.vehicle.pos);
            if (distToCar < 5.2) {
                if (promptEl) {
                    promptEl.textContent = '[E] / [F] ENTER SUPERCAR';
                    promptEl.classList.remove('hidden');
                }
            } else {
                if (promptEl) promptEl.classList.add('hidden');
            }
            if (speedoEl) speedoEl.classList.add('hidden');
        }
    }
}

// Guaranteed Boot: Executes whether DOM is already loaded or still loading
function bootCyberCity() {
    if (!window.game) {
        window.game = new Game();
    }
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', bootCyberCity);
} else {
    bootCyberCity();
}
window.addEventListener('load', bootCyberCity);
