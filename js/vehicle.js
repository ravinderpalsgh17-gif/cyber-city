// Cyber City - Drivable Cyberpunk Sports Car
// Includes arcade driving physics, drifting, nitro boost, headlights, neon underglow, and enter/exit logic.

class CyberVehicle {
    constructor(scene, city, position = new THREE.Vector3(12, 0.5, 10)) {
        this.scene = scene;
        this.city = city;
        this.pos = position.clone();
        this.heading = 0; // Angle in radians
        this.speed = 0;
        this.angularVelocity = 0;

        // Vehicle physics parameters
        this.maxSpeed = 52.0; // m/s (~185 km/h)
        this.maxReverseSpeed = -15.0;
        this.accel = 24.0;
        this.brake = 40.0;
        this.friction = 0.96;
        this.turnSpeed = 2.4;
        this.driftFriction = 0.92;

        // Nitro Boost
        this.nitro = 100;
        this.maxNitro = 100;
        this.nitroActive = false;

        this.occupied = false;
        this.radius = 2.6; // Collision radius

        this.buildCarModel();
    }

    buildCarModel() {
        this.mesh = new THREE.Group();

        // Materials
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x111625,
            metalness: 0.9,
            roughness: 0.2
        });
        const trimMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x050510,
            metalness: 0.95,
            roughness: 0.1,
            transparent: true,
            opacity: 0.85
        });
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a24, roughness: 0.7 });
        const rimMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

        // Main Chassis (wedge supercar)
        const bodyGeo = new THREE.BoxGeometry(2.4, 0.75, 4.8);
        const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        bodyMesh.position.y = 0.65;
        bodyMesh.castShadow = true;
        this.mesh.add(bodyMesh);

        // Cabin / Windshield
        const cabinGeo = new THREE.BoxGeometry(1.8, 0.55, 2.2);
        const cabinMesh = new THREE.Mesh(cabinGeo, glassMat);
        cabinMesh.position.set(0, 1.15, -0.2);
        this.mesh.add(cabinMesh);

        // Neon racing stripes
        const stripeGeo = new THREE.BoxGeometry(0.12, 0.76, 4.82);
        const stripeL = new THREE.Mesh(stripeGeo, trimMat);
        stripeL.position.set(-0.6, 0.65, 0);
        this.mesh.add(stripeL);
        const stripeR = new THREE.Mesh(stripeGeo, trimMat);
        stripeR.position.set(0.6, 0.65, 0);
        this.mesh.add(stripeR);

        // Rear Spoiler
        const spoilerWing = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.08, 0.6), bodyMat);
        spoilerWing.position.set(0, 1.35, 2.1);
        this.mesh.add(spoilerWing);
        const spoilerPostL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.45, 0.2), bodyMat);
        spoilerPostL.position.set(-0.8, 1.1, 2.1);
        this.mesh.add(spoilerPostL);
        const spoilerPostR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.45, 0.2), bodyMat);
        spoilerPostR.position.set(0.8, 1.1, 2.1);
        this.mesh.add(spoilerPostR);

        // Headlights (Neon cyan lamps + spotlights)
        const lightGeo = new THREE.BoxGeometry(0.6, 0.15, 0.2);
        const lightMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
        const hlLeft = new THREE.Mesh(lightGeo, lightMat);
        hlLeft.position.set(-0.85, 0.65, -2.4);
        this.mesh.add(hlLeft);

        const hlRight = new THREE.Mesh(lightGeo, lightMat);
        hlRight.position.set(0.85, 0.65, -2.4);
        this.mesh.add(hlRight);

        // Actual Three.js Spotlights for headlights
        this.headlight = new THREE.SpotLight(0x00f0ff, 2.0, 45, Math.PI / 4, 0.4);
        this.headlight.position.set(0, 0.7, -2.3);
        this.headlightTarget = new THREE.Object3D();
        this.headlightTarget.position.set(0, 0.2, -30);
        this.mesh.add(this.headlightTarget);
        this.headlight.target = this.headlightTarget;
        this.mesh.add(this.headlight);

        // Taillights
        const tailMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
        const tailStrip = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.14, 0.1), tailMat);
        tailStrip.position.set(0, 0.7, 2.41);
        this.mesh.add(tailStrip);

        // Neon Underglow light
        this.underglow = new THREE.PointLight(0x00f0ff, 1.5, 6);
        this.underglow.position.set(0, 0.2, 0);
        this.mesh.add(this.underglow);

        // 4 Wheels
        this.wheels = [];
        const wheelGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.4, 16);
        wheelGeo.rotateZ(Math.PI / 2);
        const wheelPositions = [
            [-1.15, 0.48, -1.5], // Front Left
            [1.15, 0.48, -1.5],  // Front Right
            [-1.15, 0.48, 1.5],  // Rear Left
            [1.15, 0.48, 1.5]    // Rear Right
        ];

        wheelPositions.forEach((p, idx) => {
            const wGroup = new THREE.Group();
            const wMesh = new THREE.Mesh(wheelGeo, wheelMat);
            const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.42, 8), rimMat);
            rim.rotateZ(Math.PI / 2);
            wGroup.add(wMesh);
            wGroup.add(rim);
            wGroup.position.set(p[0], p[1], p[2]);
            this.mesh.add(wGroup);
            this.wheels.push(wGroup);
        });

        // Exhaust Nitro Flame particles
        const flameGeo = new THREE.ConeGeometry(0.2, 1.2, 8);
        flameGeo.rotateX(-Math.PI / 2);
        const flameMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.9 });
        this.nitroFlameL = new THREE.Mesh(flameGeo, flameMat);
        this.nitroFlameL.position.set(-0.4, 0.45, 2.8);
        this.nitroFlameL.visible = false;
        this.mesh.add(this.nitroFlameL);

        this.nitroFlameR = new THREE.Mesh(flameGeo, flameMat);
        this.nitroFlameR.position.set(0.4, 0.45, 2.8);
        this.nitroFlameR.visible = false;
        this.mesh.add(this.nitroFlameR);

        this.mesh.position.copy(this.pos);
        this.scene.add(this.mesh);
    }

    update(delta, input) {
        if (!this.occupied) {
            // Apply coasting friction when parked
            this.speed *= 0.92;
            this.nitro = Math.min(this.maxNitro, this.nitro + 15 * delta);
            this.mesh.position.copy(this.pos);
            this.mesh.rotation.y = this.heading;
            return;
        }

        // Driving inputs
        let throttle = 0;
        let steering = 0;
        let handbrake = input.keys['Space'] || false;
        let wantsNitro = (input.keys['ShiftLeft'] || input.keys['ShiftRight']) && this.nitro > 5;

        if (input.keys['KeyW'] || input.keys['ArrowUp']) throttle += 1;
        if (input.keys['KeyS'] || input.keys['ArrowDown']) throttle -= 1;
        if (input.keys['KeyA'] || input.keys['ArrowLeft']) steering += 1;
        if (input.keys['KeyD'] || input.keys['ArrowRight']) steering -= 1;

        // Nitro handling
        if (wantsNitro && throttle > 0) {
            this.nitroActive = true;
            this.nitro -= 25 * delta;
            throttle *= 1.6;
            this.nitroFlameL.visible = true;
            this.nitroFlameR.visible = true;
            this.nitroFlameL.scale.set(1 + Math.random() * 0.4, 1 + Math.random() * 0.4, 1 + Math.random() * 0.4);
            this.nitroFlameR.scale.copy(this.nitroFlameL.scale);
            if (Math.random() > 0.8) window.soundEngine.playNitro();
        } else {
            this.nitroActive = false;
            this.nitroFlameL.visible = false;
            this.nitroFlameR.visible = false;
            this.nitro = Math.min(this.maxNitro, this.nitro + 12 * delta);
        }

        // Acceleration / Deceleration
        if (throttle > 0) {
            this.speed += this.accel * throttle * delta;
            const top = wantsNitro ? this.maxSpeed * 1.35 : this.maxSpeed;
            if (this.speed > top) this.speed = top;
        } else if (throttle < 0) {
            if (this.speed > 0) {
                this.speed -= this.brake * delta;
            } else {
                this.speed += this.accel * 0.6 * throttle * delta;
                if (this.speed < this.maxReverseSpeed) this.speed = this.maxReverseSpeed;
            }
        }

        // Friction & Drifting
        if (handbrake) {
            this.speed *= this.driftFriction;
            if (Math.abs(this.speed) > 10 && Math.abs(steering) > 0.2) {
                if (Math.random() > 0.85) window.soundEngine.playTireScreech();
            }
        } else {
            this.speed *= this.friction;
        }

        // Steering based on forward movement
        if (Math.abs(this.speed) > 0.2) {
            const dir = this.speed >= 0 ? 1 : -1;
            const driftMult = handbrake ? 1.6 : 1.0;
            this.heading += steering * this.turnSpeed * driftMult * dir * delta;
        }

        // Wheel animation
        const wheelSpin = (this.speed * delta) / 0.48;
        this.wheels.forEach((w, i) => {
            w.children[0].rotation.x += wheelSpin;
            // Front wheel turning
            if (i < 2) {
                w.rotation.y = steering * 0.45;
            }
        });

        // Position update
        const oldPos = this.pos.clone();
        const moveDist = this.speed * delta;
        this.pos.x -= Math.sin(this.heading) * moveDist;
        this.pos.z -= Math.cos(this.heading) * moveDist;

        // Collision with city buildings
        const resolvedPos = this.city.resolveCollision(this.pos, oldPos, this.radius);
        if (resolvedPos.distanceToSquared(this.pos) > 0.001) {
            // Impact with wall!
            this.pos.copy(resolvedPos);
            this.speed *= -0.3; // Bounce back
            window.soundEngine.playExplosion();
        }

        this.mesh.position.copy(this.pos);
        this.mesh.rotation.y = this.heading;

        // Update engine sound
        window.soundEngine.updateEngineSound(this.speed / this.maxSpeed, this.occupied);
    }

    getForward() {
        return new THREE.Vector3(-Math.sin(this.heading), 0, -Math.cos(this.heading));
    }
}
