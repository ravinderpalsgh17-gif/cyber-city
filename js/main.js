// Cyber City - Master Game Orchestrator
// Initializes Three.js engine, renderer, input listeners, HUD bindings, and main game loop.

class InputManager {
    constructor() {
        this.keys = {};
        this.consumedKeys = {};
        this.mouse = { x: 0, y: 0, down: false, rightDown: false };
        this.mouseDelta = { x: 0, y: 0 };
        this.isPointerLocked = false;

        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            window.soundEngine.init(); // Auto-start audio context on first interaction
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.consumedKeys[e.code] = false;
        });

        window.addEventListener('mousedown', (e) => {
            window.soundEngine.init();
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
    }

    initThree() {
        this.scene = new THREE.Scene();
        // Cyberpunk night atmosphere
        this.scene.background = new THREE.Color(0x050711);
        this.scene.fog = new THREE.FogExp2(0x050711, 0.0065);

        this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 10);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.25;

        this.container.appendChild(this.renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x1a2138, 1.2);
        this.scene.add(ambientLight);

        const moonLight = new THREE.DirectionalLight(0x4466aa, 1.4);
        moonLight.position.set(100, 180, 80);
        moonLight.castShadow = true;
        moonLight.shadow.mapSize.width = 1024;
        moonLight.shadow.mapSize.height = 1024;
        moonLight.shadow.camera.near = 10;
        moonLight.shadow.camera.far = 400;
        moonLight.shadow.camera.left = -150;
        moonLight.shadow.camera.right = 150;
        moonLight.shadow.camera.top = 150;
        moonLight.shadow.camera.bottom = -150;
        this.scene.add(moonLight);

        // Neon Sky Horizon Glow
        const skyGlow = new THREE.HemisphereLight(0x00f0ff, 0xff0055, 0.4);
        this.scene.add(skyGlow);
    }

    initControls() {
        // Pointer Lock on click
        const canvas = this.renderer.domElement;
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

        // Quick weapon select keys 1 to 9 and 0
        const keyMap = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0'];
        window.addEventListener('keydown', (e) => {
            const idx = keyMap.indexOf(e.code);
            if (idx !== -1) {
                this.weapons.selectWeapon(idx);
            }
            if (e.code === 'Minus') this.weapons.selectWeapon(10);
            if (e.code === 'Equal') this.weapons.selectWeapon(11);
            if (e.code === 'KeyQ') this.weapons.prevWeapon();
            if (e.code === 'KeyR') {
                // Cycle Radio station
                const trackName = window.soundEngine.nextTrack();
                const radioEl = document.getElementById('radio-status');
                if (radioEl) radioEl.textContent = `RADIO: ${trackName.toUpperCase()}`;
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

        // Process mouse look
        if (document.pointerLockElement) {
            const sens = 0.0022;
            this.player.yaw -= this.input.mouseDelta.x * sens;
            this.player.pitch -= this.input.mouseDelta.y * sens;
            this.player.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.player.pitch));
        }
        this.input.mouseDelta.x = 0;
        this.input.mouseDelta.y = 0;

        // Firing weapon
        if (this.input.mouse.down && !this.player.inVehicle && !this.player.isDead) {
            this.weapons.fire();
        }

        // Subsystem updates
        this.vehicle.update(delta, this.input);
        this.player.update(delta, this.input, this.vehicle);
        this.weapons.update(delta);
        this.enemies.update(delta);
        this.missions.update(delta);
        this.minimap.render();

        // Update HUD elements
        this.updateHUD(delta);

        this.renderer.render(this.scene, this.camera);
    }

    updateHUD(delta) {
        // Health & Shield Bars
        const hpBar = document.getElementById('health-bar-fill');
        const hpText = document.getElementById('health-text');
        const spBar = document.getElementById('shield-bar-fill');
        const spText = document.getElementById('shield-text');

        if (hpBar) hpBar.style.width = Math.max(0, this.player.health) + '%';
        if (hpText) hpText.textContent = `${Math.ceil(this.player.health)} HP`;
        if (spBar) spBar.style.width = Math.max(0, this.player.shield) + '%';
        if (spText) spText.textContent = `${Math.ceil(this.player.shield)} SHIELD`;

        // Vehicle Interaction Prompt & Speedometer
        const promptEl = document.getElementById('interaction-prompt');
        const speedoEl = document.getElementById('speedo-hud');
        const speedValEl = document.getElementById('speed-value');
        const nitroBar = document.getElementById('nitro-bar-fill');

        if (this.player.inVehicle) {
            if (promptEl) {
                promptEl.textContent = '[E] / [F] EXIT VEHICLE | [SHIFT] NITRO | [SPACE] HANDBRAKE DRIFT';
                promptEl.classList.remove('hidden');
            }
            if (speedoEl) speedoEl.classList.remove('hidden');
            if (speedValEl) speedValEl.textContent = Math.abs(Math.floor(this.vehicle.speed * 3.6));
            if (nitroBar) nitroBar.style.width = this.vehicle.nitro + '%';
        } else {
            const distToCar = this.player.pos.distanceTo(this.vehicle.pos);
            if (distToCar < 5.0) {
                if (promptEl) {
                    promptEl.textContent = '[E] / [F] ENTER CYBER CAR';
                    promptEl.classList.remove('hidden');
                }
            } else {
                if (promptEl) promptEl.classList.add('hidden');
            }
            if (speedoEl) speedoEl.classList.add('hidden');
        }
    }
}

// Boot game when window is ready
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
