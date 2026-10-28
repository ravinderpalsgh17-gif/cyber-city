// Cyber City - High-Fidelity GTA 4 Style City Generator
// Procedural Algonquin & Broker architecture, raised sidewalks, asphalt with crosswalks, rooftop water towers, and golden hour sky.

class CityManager {
    constructor(scene) {
        this.scene = scene;
        this.citySize = 850;
        this.blockSize = 72;
        this.roadWidth = 26;
        this.sidewalkWidth = 3.5;

        this.colliders = [];
        this.spawns = {
            player: new THREE.Vector3(0, 1.2, 0),
            vehicle: new THREE.Vector3(10, 0.8, 12),
            cache: new THREE.Vector3(-38, 1.0, -38),
            omnicorpTower: new THREE.Vector3(0, 0, -220),
            checkpoints: [
                new THREE.Vector3(125, 1, 0),
                new THREE.Vector3(125, 1, 210),
                new THREE.Vector3(-145, 1, 230),
                new THREE.Vector3(-190, 1, -90),
                new THREE.Vector3(0, 1, -170)
            ]
        };

        this.generateTextures();
        this.buildSkyDome();
        this.buildGroundAndStreets();
        this.buildSkyscrapers();
        this.buildStreetFurniture();
        this.buildPerimeterBarriers();
    }

    generateTextures() {
        // 1. GTA 4 Golden Hour Atmospheric Sky Gradient
        const skyCanvas = document.createElement('canvas');
        skyCanvas.width = 512;
        skyCanvas.height = 512;
        const sctx = skyCanvas.getContext('2d');
        const skyGrad = sctx.createLinearGradient(0, 0, 0, 512);
        skyGrad.addColorStop(0.0, '#101626'); // Deep zenith dusk
        skyGrad.addColorStop(0.35, '#2d2538'); // Dusty twilight purple
        skyGrad.addColorStop(0.70, '#66393b'); // Warm sunset crimson
        skyGrad.addColorStop(0.92, '#c4622b'); // Golden amber horizon haze
        skyGrad.addColorStop(1.0, '#f2994a'); // Sun glare glow
        sctx.fillStyle = skyGrad;
        sctx.fillRect(0, 0, 512, 512);
        this.skyTexture = new THREE.CanvasTexture(skyCanvas);

        // 2. Realistic GTA 4 Asphalt with Yellow Centerlines & Zebra Crosswalks
        const roadCanvas = document.createElement('canvas');
        roadCanvas.width = 1024;
        roadCanvas.height = 1024;
        const rctx = roadCanvas.getContext('2d');

        // Dark grey asphalt grain
        rctx.fillStyle = '#1e2229';
        rctx.fillRect(0, 0, 1024, 1024);

        // Asphalt texture speckles
        for (let i = 0; i < 9000; i++) {
            const val = 25 + Math.floor(Math.random() * 25);
            rctx.fillStyle = `rgb(${val},${val + 2},${val + 5})`;
            rctx.fillRect(Math.random() * 1024, Math.random() * 1024, 2, 2);
        }

        // Double solid yellow centerlines
        rctx.strokeStyle = '#f5b041';
        rctx.lineWidth = 8;
        rctx.beginPath();
        rctx.moveTo(506, 0); rctx.lineTo(506, 1024);
        rctx.moveTo(518, 0); rctx.lineTo(518, 1024);
        rctx.stroke();

        // White dashed lane dividers
        rctx.strokeStyle = '#e0e0e0';
        rctx.lineWidth = 6;
        rctx.setLineDash([36, 32]);
        rctx.beginPath();
        rctx.moveTo(256, 0); rctx.lineTo(256, 1024);
        rctx.moveTo(768, 0); rctx.lineTo(768, 1024);
        rctx.stroke();
        rctx.setLineDash([]);

        // White edge solid shoulder lines
        rctx.lineWidth = 5;
        rctx.beginPath();
        rctx.moveTo(32, 0); rctx.lineTo(32, 1024);
        rctx.moveTo(992, 0); rctx.lineTo(992, 1024);
        rctx.stroke();

        // Zebra crosswalk pedestrian lines at top and bottom
        rctx.fillStyle = '#f0f0f0';
        for (let x = 60; x < 964; x += 44) {
            rctx.fillRect(x, 15, 24, 90);
            rctx.fillRect(x, 919, 24, 90);
        }

        this.roadTexture = new THREE.CanvasTexture(roadCanvas);
        this.roadTexture.wrapS = THREE.RepeatWrapping;
        this.roadTexture.wrapT = THREE.RepeatWrapping;
        this.roadTexture.repeat.set(1, 8);

        // 3. Concrete Sidewalk Slab Texture
        const walkCanvas = document.createElement('canvas');
        walkCanvas.width = 256;
        walkCanvas.height = 256;
        const wctx = walkCanvas.getContext('2d');
        wctx.fillStyle = '#8f949e';
        wctx.fillRect(0, 0, 256, 256);
        // Concrete slab joints
        wctx.strokeStyle = '#5b616b';
        wctx.lineWidth = 3;
        wctx.strokeRect(4, 4, 248, 248);
        wctx.strokeRect(4, 128, 248, 1);
        wctx.strokeRect(128, 4, 1, 248);
        this.sidewalkTexture = new THREE.CanvasTexture(walkCanvas);
        this.sidewalkTexture.wrapS = THREE.RepeatWrapping;
        this.sidewalkTexture.wrapT = THREE.RepeatWrapping;
        this.sidewalkTexture.repeat.set(2, 2);

        // 4. Brick & Brownstone Window Texture (Liberty City style)
        const brickCanvas = document.createElement('canvas');
        brickCanvas.width = 512;
        brickCanvas.height = 512;
        const bctx = brickCanvas.getContext('2d');
        bctx.fillStyle = '#3a2723';
        bctx.fillRect(0, 0, 512, 512);

        // Weathered brick mortar lines
        bctx.fillStyle = '#4e342e';
        for (let y = 0; y < 512; y += 12) {
            bctx.fillRect(0, y, 512, 2);
        }

        // Multi-pane windows with glowing warm interiors
        for (let y = 16; y < 500; y += 42) {
            for (let x = 18; x < 500; x += 38) {
                const lit = Math.random() > 0.45;
                bctx.fillStyle = lit ? (Math.random() > 0.3 ? '#ffecb3' : '#80d8ff') : '#1a1412';
                bctx.fillRect(x, y, 22, 28);

                // Window frame
                bctx.strokeStyle = '#231b18';
                bctx.lineWidth = 2;
                bctx.strokeRect(x, y, 22, 28);
                bctx.beginPath();
                bctx.moveTo(x + 11, y); bctx.lineTo(x + 11, y + 28);
                bctx.moveTo(x, y + 14); bctx.lineTo(x + 22, y + 14);
                bctx.stroke();
            }
        }
        this.brickTexture = new THREE.CanvasTexture(brickCanvas);
        this.brickTexture.wrapS = THREE.RepeatWrapping;
        this.brickTexture.wrapT = THREE.RepeatWrapping;

        // 5. Modern High-Rise Glass Facade
        const glassCanvas = document.createElement('canvas');
        glassCanvas.width = 256;
        glassCanvas.height = 512;
        const gctx = glassCanvas.getContext('2d');
        gctx.fillStyle = '#152136';
        gctx.fillRect(0, 0, 256, 512);

        for (let y = 10; y < 510; y += 18) {
            for (let x = 8; x < 250; x += 18) {
                const lit = Math.random() > 0.35;
                gctx.fillStyle = lit ? (Math.random() > 0.2 ? '#ffe082' : '#00e5ff') : '#0c1322';
                gctx.fillRect(x, y, 14, 12);
            }
        }
        this.glassTexture = new THREE.CanvasTexture(glassCanvas);
        this.glassTexture.wrapS = THREE.RepeatWrapping;
        this.glassTexture.wrapT = THREE.RepeatWrapping;
    }

    buildSkyDome() {
        // Giant atmospheric sky dome
        const skyGeo = new THREE.SphereGeometry(720, 32, 16);
        const skyMat = new THREE.MeshBasicMaterial({
            map: this.skyTexture,
            side: THREE.BackSide
        });
        const skyMesh = new THREE.Mesh(skyGeo, skyMat);
        this.scene.add(skyMesh);

        // Cinematic Sun Disc at golden hour angle
        const sunGeo = new THREE.SphereGeometry(24, 16, 16);
        const sunMat = new THREE.MeshBasicMaterial({ color: 0xffaa44 });
        const sunMesh = new THREE.Mesh(sunGeo, sunMat);
        sunMesh.position.set(280, 110, -520);
        this.scene.add(sunMesh);

        // Sun Corona Flare Ring
        const flareGeo = new THREE.RingGeometry(25, 60, 32);
        const flareMat = new THREE.MeshBasicMaterial({ color: 0xff7722, transparent: true, opacity: 0.45, side: THREE.DoubleSide });
        const flare = new THREE.Mesh(flareGeo, flareMat);
        flare.position.copy(sunMesh.position);
        flare.lookAt(0, 0, 0);
        this.scene.add(flare);
    }

    buildGroundAndStreets() {
        // Base terrain (wet asphalt foundation)
        const groundGeo = new THREE.PlaneGeometry(this.citySize, this.citySize);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x181a20,
            roughness: 0.4,
            metalness: 0.3
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        const halfSize = this.citySize / 2;
        const step = this.blockSize + this.roadWidth;

        // Roads Grid (North-South & East-West)
        for (let pos = -halfSize + step / 2; pos <= halfSize; pos += step) {
            // N-S Road
            const roadGeoNS = new THREE.PlaneGeometry(this.roadWidth, this.citySize);
            const roadMatNS = new THREE.MeshStandardMaterial({
                map: this.roadTexture,
                roughness: 0.35,
                metalness: 0.4
            });
            const roadNS = new THREE.Mesh(roadGeoNS, roadMatNS);
            roadNS.rotation.x = -Math.PI / 2;
            roadNS.position.set(pos, 0.03, 0);
            roadNS.receiveShadow = true;
            this.scene.add(roadNS);

            // E-W Road
            const roadGeoEW = new THREE.PlaneGeometry(this.citySize, this.roadWidth);
            const roadMatEW = new THREE.MeshStandardMaterial({
                map: this.roadTexture,
                roughness: 0.35,
                metalness: 0.4
            });
            const roadEW = new THREE.Mesh(roadGeoEW, roadMatEW);
            roadEW.rotation.x = -Math.PI / 2;
            roadEW.rotation.z = Math.PI / 2;
            roadEW.position.set(0, 0.04, pos);
            roadEW.receiveShadow = true;
            this.scene.add(roadEW);
        }

        // Raised 3D Concrete Sidewalks on every city block
        const curbHeight = 0.22;
        const curbMat = new THREE.MeshStandardMaterial({
            map: this.sidewalkTexture,
            roughness: 0.6,
            metalness: 0.1
        });

        for (let x = -halfSize + step; x < halfSize - step / 2; x += step) {
            for (let z = -halfSize + step; z < halfSize - step / 2; z += step) {
                if (Math.abs(x) < 25 && Math.abs(z) < 25) continue; // Start plaza

                const curbGeo = new THREE.BoxGeometry(this.blockSize, curbHeight, this.blockSize);
                const curbMesh = new THREE.Mesh(curbGeo, curbMat);
                curbMesh.position.set(x, curbHeight / 2 + 0.04, z);
                curbMesh.receiveShadow = true;
                this.scene.add(curbMesh);
            }
        }
    }

    createStorefrontSign(text, color, width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#0f141f';
        ctx.fillRect(0, 0, 512, 128);

        ctx.strokeStyle = color;
        ctx.lineWidth = 6;
        ctx.strokeRect(8, 8, 496, 112);

        ctx.fillStyle = color;
        ctx.font = '900 48px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 256, 64);

        const tex = new THREE.CanvasTexture(canvas);
        const geo = new THREE.PlaneGeometry(width, height);
        const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
        return new THREE.Mesh(geo, mat);
    }

    buildSkyscrapers() {
        const halfSize = this.citySize / 2;
        const step = this.blockSize + this.roadWidth;
        const storeBrands = [
            { text: "LIBERTY ARMS", color: "#ff3333" },
            { text: "TW@ INTERNET", color: "#00f0ff" },
            { text: "CLUCKIN' BELL", color: "#ffaa00" },
            { text: "69 EXCHANGE", color: "#00ff66" },
            { text: "STAR JUNCTION", color: "#ff0077" },
            { text: "OMNICORP TOWER", color: "#ffd700" }
        ];

        for (let x = -halfSize + step; x < halfSize - step / 2; x += step) {
            for (let z = -halfSize + step; z < halfSize - step / 2; z += step) {
                const isCenter = Math.abs(x) < 40 && Math.abs(z - (-220)) < 40;
                const isPlayerSpawn = Math.abs(x) < 30 && Math.abs(z) < 30;
                if (isPlayerSpawn) continue;

                let bHeight, bWidth, bDepth, buildingMat;
                const styleRoll = Math.random();

                if (isCenter) {
                    // Massive OmniCorp Citadel Spire (Algonquin Empire Spire)
                    bHeight = 250;
                    bWidth = 62;
                    bDepth = 62;
                    buildingMat = new THREE.MeshStandardMaterial({
                        map: this.glassTexture,
                        roughness: 0.25,
                        metalness: 0.85
                    });
                } else if (styleRoll < 0.45) {
                    // Liberty Brick Brownstone Tower
                    bHeight = 45 + Math.random() * 55;
                    bWidth = 46 + Math.random() * 12;
                    bDepth = 46 + Math.random() * 12;
                    buildingMat = new THREE.MeshStandardMaterial({
                        map: this.brickTexture,
                        roughness: 0.7,
                        metalness: 0.15
                    });
                } else {
                    // Modern Glass High-Rise
                    bHeight = 65 + Math.random() * 105;
                    bWidth = 48 + Math.random() * 10;
                    bDepth = 48 + Math.random() * 10;
                    buildingMat = new THREE.MeshStandardMaterial({
                        map: this.glassTexture,
                        roughness: 0.25,
                        metalness: 0.85
                    });
                }

                // Main Tower Mesh
                const boxGeo = new THREE.BoxGeometry(bWidth, bHeight, bDepth);
                const building = new THREE.Mesh(boxGeo, buildingMat);
                building.position.set(x, bHeight / 2, z);
                building.castShadow = true;
                building.receiveShadow = true;
                this.scene.add(building);

                // Add Classic GTA 4 Rooftop Clutter
                this.buildRooftopClutter(x, bHeight, z, bWidth, bDepth, isCenter);

                // Ground Floor Storefront Signage
                const brand = storeBrands[Math.floor(Math.random() * storeBrands.length)];
                const sign = this.createStorefrontSign(isCenter ? "OMNICORP HQ" : brand.text, brand.color, bWidth * 0.7, 7.5);
                sign.position.set(x, 6.5, z + bDepth / 2 + 0.4);
                this.scene.add(sign);

                // Physical Collider Box
                this.colliders.push({
                    min: new THREE.Vector3(x - bWidth / 2 - 1.2, 0, z - bDepth / 2 - 1.2),
                    max: new THREE.Vector3(x + bWidth / 2 + 1.2, bHeight, z + bDepth / 2 + 1.2)
                });
            }
        }
    }

    buildRooftopClutter(x, y, z, width, depth, isCenter) {
        if (isCenter) {
            // Massive radio broadcasting spire with aviation beacon
            const spireGeo = new THREE.CylinderGeometry(0.5, 2.5, 45, 8);
            const spireMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50, metalness: 0.9, roughness: 0.2 });
            const spire = new THREE.Mesh(spireGeo, spireMat);
            spire.position.set(x, y + 22.5, z);
            this.scene.add(spire);

            const beacon = new THREE.Mesh(new THREE.SphereGeometry(1.8, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff0033 }));
            beacon.position.set(x, y + 45, z);
            this.scene.add(beacon);
            return;
        }

        // 1. Classic NYC / GTA 4 Wooden Water Tower on Rooftops
        if (Math.random() > 0.4) {
            const tankGroup = new THREE.Group();
            const tankMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.9 });
            const roofMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.8 });
            const stiltMat = new THREE.MeshStandardMaterial({ color: 0x212121, metalness: 0.8 });

            // Wooden barrel
            const barrel = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 7, 14), tankMat);
            barrel.position.y = 8;
            tankGroup.add(barrel);

            // Conical roof
            const roof = new THREE.Mesh(new THREE.ConeGeometry(4.2, 3.2, 14), roofMat);
            roof.position.y = 13;
            tankGroup.add(roof);

            // 4 Steel legs / stilts
            for (let i = 0; i < 4; i++) {
                const angle = (i * Math.PI) / 2 + Math.PI / 4;
                const leg = new THREE.Mesh(new THREE.BoxGeometry(0.35, 6, 0.35), stiltMat);
                leg.position.set(Math.cos(angle) * 2.8, 3, Math.sin(angle) * 2.8);
                tankGroup.add(leg);
            }

            tankGroup.position.set(x + (Math.random() - 0.5) * (width * 0.4), y, z + (Math.random() - 0.5) * (depth * 0.4));
            this.scene.add(tankGroup);
        }

        // 2. HVAC Units & Elevator machinery penthouse
        if (Math.random() > 0.3) {
            const hvacGeo = new THREE.BoxGeometry(7, 4, 7);
            const hvacMat = new THREE.MeshStandardMaterial({ color: 0x607d8b, metalness: 0.6, roughness: 0.4 });
            const hvac = new THREE.Mesh(hvacGeo, hvacMat);
            hvac.position.set(x, y + 2, z);
            this.scene.add(hvac);
        }
    }

    buildStreetFurniture() {
        const halfSize = this.citySize / 2 - 40;
        const step = this.blockSize + this.roadWidth;

        // Street Lamps casting warm incandescent light
        const poleGeo = new THREE.CylinderGeometry(0.25, 0.35, 9.5, 8);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x1f242d, metalness: 0.8, roughness: 0.3 });
        const lampHeadGeo = new THREE.BoxGeometry(1.6, 0.35, 0.65);
        const lampHeadMat = new THREE.MeshBasicMaterial({ color: 0xffe082 });

        for (let x = -halfSize; x <= halfSize; x += step) {
            for (let z = -halfSize; z <= halfSize; z += step / 2) {
                if (Math.abs(x) > 390 || Math.abs(z) > 390) continue;

                const pole = new THREE.Mesh(poleGeo, poleMat);
                pole.position.set(x - 14, 4.75, z);
                this.scene.add(pole);

                const head = new THREE.Mesh(lampHeadGeo, lampHeadMat);
                head.position.set(x - 13.2, 9.4, z);
                this.scene.add(head);

                // Add real point lights for dramatic street lighting
                if (Math.random() > 0.65) {
                    const streetLight = new THREE.PointLight(0xffe082, 1.4, 42);
                    streetLight.position.set(x - 13, 8.8, z);
                    this.scene.add(streetLight);
                }
            }
        }
    }

    buildPerimeterBarriers() {
        const halfSize = this.citySize / 2;
        const barrierGeo = new THREE.BoxGeometry(this.citySize, 25, 8);
        const barrierMat = new THREE.MeshStandardMaterial({ color: 0x1b202e, metalness: 0.8, roughness: 0.3 });

        // North & South
        const wallN = new THREE.Mesh(barrierGeo, barrierMat);
        wallN.position.set(0, 12.5, -halfSize);
        this.scene.add(wallN);

        const wallS = new THREE.Mesh(barrierGeo, barrierMat);
        wallS.position.set(0, 12.5, halfSize);
        this.scene.add(wallS);

        // East & West
        const wallGeoEW = new THREE.BoxGeometry(8, 25, this.citySize);
        const wallE = new THREE.Mesh(wallGeoEW, barrierMat);
        wallE.position.set(halfSize, 12.5, 0);
        this.scene.add(wallE);

        const wallW = new THREE.Mesh(wallGeoEW, barrierMat);
        wallW.position.set(-halfSize, 12.5, 0);
        this.scene.add(wallW);

        this.colliders.push({ min: new THREE.Vector3(-halfSize - 20, 0, -halfSize - 20), max: new THREE.Vector3(halfSize + 20, 100, -halfSize + 4) });
        this.colliders.push({ min: new THREE.Vector3(-halfSize - 20, 0, halfSize - 4), max: new THREE.Vector3(halfSize + 20, 100, halfSize + 20) });
        this.colliders.push({ min: new THREE.Vector3(-halfSize - 20, 0, -halfSize - 20), max: new THREE.Vector3(-halfSize + 4, 100, halfSize + 20) });
        this.colliders.push({ min: new THREE.Vector3(halfSize - 4, 0, -halfSize - 20), max: new THREE.Vector3(halfSize + 20, 100, halfSize + 20) });
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
        const testX = new THREE.Vector3(pos.x, pos.y, oldPos.z);
        if (!this.checkCollision(testX, radius)) return testX;
        const testZ = new THREE.Vector3(oldPos.x, pos.y, pos.z);
        if (!this.checkCollision(testZ, radius)) return testZ;
        return oldPos.clone();
    }
}
