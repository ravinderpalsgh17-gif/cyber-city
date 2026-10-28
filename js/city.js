// Cyber City - Procedural Cyberpunk City Generator
// Generates skyscrapers, neon billboards, road grids, wet street shaders, and collision colliders.

class CityManager {
    constructor(scene) {
        this.scene = scene;
        this.citySize = 800; // 800x800m world
        this.blockSize = 70;
        this.roadWidth = 24;
        this.buildings = [];
        this.colliders = [];
        this.billboards = [];
        this.neonSigns = [];
        this.spawns = {
            player: new THREE.Vector3(0, 1.2, 0),
            vehicle: new THREE.Vector3(12, 0.8, 10),
            cache: new THREE.Vector3(-35, 1.0, -35),
            omnicorpTower: new THREE.Vector3(0, 0, -200),
            checkpoints: [
                new THREE.Vector3(120, 1, 0),
                new THREE.Vector3(120, 1, 200),
                new THREE.Vector3(-140, 1, 220),
                new THREE.Vector3(-180, 1, -80),
                new THREE.Vector3(0, 1, -160)
            ]
        };

        this.generateTextures();
        this.buildGroundAndRoads();
        this.buildSkyscrapers();
        this.buildPerimeterBarriers();
        this.buildStreetLights();
    }

    generateTextures() {
        // Procedural window texture for skyscrapers
        const winCanvas = document.createElement('canvas');
        winCanvas.width = 256;
        winCanvas.height = 512;
        const ctx = winCanvas.getContext('2d');
        ctx.fillStyle = '#060814';
        ctx.fillRect(0, 0, 256, 512);

        const neonColors = ['#00f0ff', '#ff0055', '#ffea00', '#7928ca', '#ffffff', '#00ff66'];

        for (let y = 10; y < 500; y += 14) {
            for (let x = 8; x < 248; x += 16) {
                if (Math.random() > 0.45) {
                    ctx.fillStyle = neonColors[Math.floor(Math.random() * neonColors.length)];
                    ctx.globalAlpha = 0.5 + Math.random() * 0.5;
                    ctx.fillRect(x, y, 10, 8);
                } else {
                    ctx.fillStyle = '#0d1326';
                    ctx.globalAlpha = 0.9;
                    ctx.fillRect(x, y, 10, 8);
                }
            }
        }
        ctx.globalAlpha = 1.0;
        this.windowTexture = new THREE.CanvasTexture(winCanvas);
        this.windowTexture.wrapS = THREE.RepeatWrapping;
        this.windowTexture.wrapT = THREE.RepeatWrapping;

        // Road texture with glowing neon markings
        const roadCanvas = document.createElement('canvas');
        roadCanvas.width = 512;
        roadCanvas.height = 512;
        const rctx = roadCanvas.getContext('2d');
        rctx.fillStyle = '#0a0d16';
        rctx.fillRect(0, 0, 512, 512);

        // Asphalt grain
        rctx.fillStyle = 'rgba(25, 30, 45, 0.4)';
        for (let i = 0; i < 3000; i++) {
            rctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
        }

        // Glowing center dash
        rctx.strokeStyle = '#00f0ff';
        rctx.lineWidth = 6;
        rctx.shadowColor = '#00f0ff';
        rctx.shadowBlur = 12;
        rctx.setLineDash([28, 20]);
        rctx.beginPath();
        rctx.moveTo(256, 0);
        rctx.lineTo(256, 512);
        rctx.stroke();

        // Edge curbs
        rctx.strokeStyle = '#ff0055';
        rctx.lineWidth = 4;
        rctx.shadowColor = '#ff0055';
        rctx.shadowBlur = 10;
        rctx.setLineDash([]);
        rctx.beginPath();
        rctx.moveTo(16, 0);
        rctx.lineTo(16, 512);
        rctx.moveTo(496, 0);
        rctx.lineTo(496, 512);
        rctx.stroke();

        this.roadTexture = new THREE.CanvasTexture(roadCanvas);
        this.roadTexture.wrapS = THREE.RepeatWrapping;
        this.roadTexture.wrapT = THREE.RepeatWrapping;
        this.roadTexture.repeat.set(1, 10);
    }

    buildGroundAndRoads() {
        // Base ground plane (wet dark pavement)
        const groundGeo = new THREE.PlaneGeometry(this.citySize, this.citySize, 32, 32);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x05070e,
            roughness: 0.25,
            metalness: 0.85
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Road Grid
        const halfSize = this.citySize / 2;
        const step = this.blockSize + this.roadWidth;

        // North-South and East-West Roads
        for (let pos = -halfSize + step / 2; pos <= halfSize; pos += step) {
            // N-S road
            const roadGeoNS = new THREE.PlaneGeometry(this.roadWidth, this.citySize);
            const roadMatNS = new THREE.MeshStandardMaterial({
                map: this.roadTexture,
                roughness: 0.3,
                metalness: 0.7
            });
            const roadNS = new THREE.Mesh(roadGeoNS, roadMatNS);
            roadNS.rotation.x = -Math.PI / 2;
            roadNS.position.set(pos, 0.02, 0);
            roadNS.receiveShadow = true;
            this.scene.add(roadNS);

            // E-W road
            const roadGeoEW = new THREE.PlaneGeometry(this.citySize, this.roadWidth);
            const roadMatEW = new THREE.MeshStandardMaterial({
                map: this.roadTexture,
                roughness: 0.3,
                metalness: 0.7
            });
            const roadEW = new THREE.Mesh(roadGeoEW, roadMatEW);
            roadEW.rotation.x = -Math.PI / 2;
            roadEW.rotation.z = Math.PI / 2;
            roadEW.position.set(0, 0.03, pos);
            roadEW.receiveShadow = true;
            this.scene.add(roadEW);
        }
    }

    createNeonBillboard(text, color, width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Dark background
        ctx.fillStyle = '#05070f';
        ctx.fillRect(0, 0, 512, 128);

        // Neon border
        ctx.strokeStyle = color;
        ctx.lineWidth = 6;
        ctx.shadowColor = color;
        ctx.shadowBlur = 18;
        ctx.strokeRect(8, 8, 496, 112);

        // Neon text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 44px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = color;
        ctx.shadowBlur = 24;
        ctx.fillText(text, 256, 64);

        const tex = new THREE.CanvasTexture(canvas);
        const geo = new THREE.PlaneGeometry(width, height);
        const mat = new THREE.MeshBasicMaterial({
            map: tex,
            side: THREE.DoubleSide
        });
        const mesh = new THREE.Mesh(geo, mat);
        return mesh;
    }

    buildSkyscrapers() {
        const halfSize = this.citySize / 2;
        const step = this.blockSize + this.roadWidth;
        const billboardTexts = [
            { text: "OMNICORP", color: "#00f0ff" },
            { text: "CYBERDYNE", color: "#ff0055" },
            { text: "NEON OVERRIDE", color: "#ffea00" },
            { text: "K-NET 2099", color: "#7928ca" },
            { text: "SYNTH-CORP", color: "#00ff66" },
            { text: "NEO-TOKYO 2.0", color: "#ff5500" },
            { text: "RETRO RUNNER", color: "#00e5ff" }
        ];

        for (let x = -halfSize + step; x < halfSize - step / 2; x += step) {
            for (let z = -halfSize + step; z < halfSize - step / 2; z += step) {
                // Is this the central plaza?
                const isCenter = Math.abs(x) < 40 && Math.abs(z - (-200)) < 40;
                const isPlayerSpawn = Math.abs(x) < 30 && Math.abs(z) < 30;

                if (isPlayerSpawn) {
                    // Leave clear for starting plaza
                    continue;
                }

                let height, bWidth, bDepth;
                if (isCenter) {
                    // OmniCorp Mega Spire
                    height = 240;
                    bWidth = 65;
                    bDepth = 65;
                } else {
                    height = 45 + Math.random() * 120;
                    bWidth = 45 + Math.random() * 15;
                    bDepth = 45 + Math.random() * 15;
                }

                // Skyscraper mesh
                const boxGeo = new THREE.BoxGeometry(bWidth, height, bDepth);
                const boxMat = new THREE.MeshStandardMaterial({
                    color: 0x0a0e1c,
                    map: this.windowTexture,
                    roughness: 0.35,
                    metalness: 0.8
                });
                const building = new THREE.Mesh(boxGeo, boxMat);
                building.position.set(x, height / 2, z);
                building.castShadow = true;
                building.receiveShadow = true;
                this.scene.add(building);

                // Add rooftop spire / antenna
                if (Math.random() > 0.4 || isCenter) {
                    const spireHeight = 20 + Math.random() * 30;
                    const spireGeo = new THREE.CylinderGeometry(0.4, 1.2, spireHeight, 6);
                    const spireMat = new THREE.MeshBasicMaterial({ color: isCenter ? 0xff0055 : 0x00f0ff });
                    const spire = new THREE.Mesh(spireGeo, spireMat);
                    spire.position.set(x, height + spireHeight / 2, z);
                    this.scene.add(spire);

                    // Beacon light
                    const beaconGeo = new THREE.SphereGeometry(1.2, 8, 8);
                    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
                    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
                    beacon.position.set(x, height + spireHeight, z);
                    this.scene.add(beacon);
                }

                // Add Holographic Neon Billboard to some buildings
                if (Math.random() > 0.45 || isCenter) {
                    const ad = billboardTexts[Math.floor(Math.random() * billboardTexts.length)];
                    const board = this.createNeonBillboard(isCenter ? "OMNICORP HQ" : ad.text, isCenter ? "#ff0055" : ad.color, bWidth * 0.75, 14);
                    // Mount on facade facing road
                    board.position.set(x, height * 0.65, z + bDepth / 2 + 0.6);
                    this.scene.add(board);
                    this.billboards.push(board);
                }

                // Add AABB collider for physical collisions
                this.colliders.push({
                    min: new THREE.Vector3(x - bWidth / 2 - 1, 0, z - bDepth / 2 - 1),
                    max: new THREE.Vector3(x + bWidth / 2 + 1, height, z + bDepth / 2 + 1)
                });
            }
        }
    }

    buildStreetLights() {
        const halfSize = this.citySize / 2 - 30;
        const step = this.blockSize + this.roadWidth;

        const poleGeo = new THREE.CylinderGeometry(0.3, 0.4, 10, 8);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x1a2133, metalness: 0.9, roughness: 0.2 });

        const headGeo = new THREE.BoxGeometry(2, 0.4, 0.8);
        const headMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

        for (let x = -halfSize; x <= halfSize; x += step) {
            for (let z = -halfSize; z <= halfSize; z += step / 2) {
                if (Math.abs(x) > 380 || Math.abs(z) > 380) continue;

                const pole = new THREE.Mesh(poleGeo, poleMat);
                pole.position.set(x - 13, 5, z);
                this.scene.add(pole);

                const head = new THREE.Mesh(headGeo, headMat);
                head.position.set(x - 12.2, 9.8, z);
                this.scene.add(head);

                // Add point lights strategically to illuminate neon streets
                if (Math.random() > 0.75) {
                    const light = new THREE.PointLight(0x00f0ff, 1.2, 35);
                    light.position.set(x - 12, 9, z);
                    this.scene.add(light);
                }
            }
        }
    }

    buildPerimeterBarriers() {
        // Holographic forcefield walls enclosing Cyber City
        const halfSize = this.citySize / 2;
        const wallMat = new THREE.MeshBasicMaterial({
            color: 0x00f0ff,
            transparent: true,
            opacity: 0.25,
            wireframe: true
        });

        // North & South walls
        const wallGeoNS = new THREE.PlaneGeometry(this.citySize, 80, 32, 8);
        const wallN = new THREE.Mesh(wallGeoNS, wallMat);
        wallN.position.set(0, 40, -halfSize);
        this.scene.add(wallN);

        const wallS = new THREE.Mesh(wallGeoNS, wallMat);
        wallS.position.set(0, 40, halfSize);
        wallS.rotation.y = Math.PI;
        this.scene.add(wallS);

        // East & West walls
        const wallGeoEW = new THREE.PlaneGeometry(this.citySize, 80, 32, 8);
        const wallE = new THREE.Mesh(wallGeoEW, wallMat);
        wallE.position.set(halfSize, 40, 0);
        wallE.rotation.y = -Math.PI / 2;
        this.scene.add(wallE);

        const wallW = new THREE.Mesh(wallGeoEW, wallMat);
        wallW.position.set(-halfSize, 40, 0);
        wallW.rotation.y = Math.PI / 2;
        this.scene.add(wallW);

        // Colliders for outer bounds
        this.colliders.push({ min: new THREE.Vector3(-halfSize - 10, 0, -halfSize - 10), max: new THREE.Vector3(halfSize + 10, 100, -halfSize) });
        this.colliders.push({ min: new THREE.Vector3(-halfSize - 10, 0, halfSize), max: new THREE.Vector3(halfSize + 10, 100, halfSize + 10) });
        this.colliders.push({ min: new THREE.Vector3(-halfSize - 10, 0, -halfSize - 10), max: new THREE.Vector3(-halfSize, 100, halfSize + 10) });
        this.colliders.push({ min: new THREE.Vector3(halfSize, 0, -halfSize - 10), max: new THREE.Vector3(halfSize + 10, 100, halfSize + 10) });
    }

    checkCollision(pos, radius = 1.0) {
        for (let i = 0; i < this.colliders.length; i++) {
            const b = this.colliders[i];
            if (pos.x + radius > b.min.x && pos.x - radius < b.max.x &&
                pos.z + radius > b.min.z && pos.z - radius < b.max.z &&
                pos.y < b.max.y) {
                return true;
            }
        }
        return false;
    }

    resolveCollision(pos, oldPos, radius = 1.0) {
        if (!this.checkCollision(pos, radius)) return pos;
        // Try sliding on X
        const testX = new THREE.Vector3(pos.x, pos.y, oldPos.z);
        if (!this.checkCollision(testX, radius)) return testX;

        // Try sliding on Z
        const testZ = new THREE.Vector3(oldPos.x, pos.y, pos.z);
        if (!this.checkCollision(testZ, radius)) return testZ;

        // Revert to old position if blocked
        return oldPos.clone();
    }
}
