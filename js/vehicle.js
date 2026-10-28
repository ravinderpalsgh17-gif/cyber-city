// Cyber City - High-Fidelity GTA 4 Supercar
// Features realistic chassis geometry, metallic paint, projector headlights, suspension roll/pitch, tire burnout smoke, and nitro boost.

class CyberVehicle {
    constructor(scene, city, position = new THREE.Vector3(10, 0.5, 12)) {
        this.scene = scene;
        this.city = city;
        this.pos = position.clone();
        this.heading = 0;
        this.speed = 0;
        this.angularVelocity = 0;

        // Vehicle physics
        this.maxSpeed = 54.0;
        this.maxReverseSpeed = -16.0;
        this.accel = 26.0;
        this.brake = 42.0;
        this.friction = 0.965;
        this.turnSpeed = 2.45;
        this.driftFriction = 0.915;

        // Suspension pitch/roll
        this.pitchAngle = 0;
        this.rollAngle = 0;

        // Nitro
        this.nitro = 100;
        this.maxNitro = 100;
        this.nitroActive = false;

        this.occupied = false;
        this.radius = 2.7;

        // Tire smoke particle system
        this.tireParticles = [];

        this.buildCarModel();
    }

    buildCarModel() {
        this.mesh = new THREE.Group();
        this.bodyGroup = new THREE.Group(); // Inner group for suspension tilt
        this.mesh.add(this.bodyGroup);

        // Materials: High-Gloss Metallic Car Paint
        const paintMat = new THREE.MeshStandardMaterial({
            color: 0xd32f2f, // Crimson red supercar
            metalness: 0.85,
            roughness: 0.18
        });
        const carbonMat = new THREE.MeshStandardMaterial({
            color: 0x18181f,
            metalness: 0.9,
            roughness: 0.4
        });
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x0a101d,
            metalness: 0.95,
            roughness: 0.08,
            transparent: true,
            opacity: 0.85
        });
        const chromeMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.95, roughness: 0.1 });
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111116, roughness: 0.8 });
        const rimMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.95, roughness: 0.15 });

        // Lower Chassis & Aerodynamic Floorpan
        const floorGeo = new THREE.BoxGeometry(2.3, 0.35, 4.8);
        const floorMesh = new THREE.Mesh(floorGeo, carbonMat);
        floorMesh.position.y = 0.35;
        this.bodyGroup.add(floorMesh);

        // Sculpted Supercar Main Body
        const mainBodyGeo = new THREE.BoxGeometry(2.2, 0.55, 4.6);
        const mainBody = new THREE.Mesh(mainBodyGeo, paintMat);
        mainBody.position.y = 0.65;
        mainBody.castShadow = true;
        this.bodyGroup.add(mainBody);

        // Slanted Aerodynamic Hood
        const hoodGeo = new THREE.BoxGeometry(2.0, 0.25, 1.6);
        const hood = new THREE.Mesh(hoodGeo, paintMat);
        hood.position.set(0, 0.72, -1.4);
        hood.rotation.x = 0.12;
        this.bodyGroup.add(hood);

        // Front Aero Splitter
        const splitter = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.08, 0.5), carbonMat);
        splitter.position.set(0, 0.22, -2.4);
        this.bodyGroup.add(splitter);

        // Sleek Glass Cockpit Canopy
        const canopyGeo = new THREE.BoxGeometry(1.7, 0.52, 2.2);
        const canopy = new THREE.Mesh(canopyGeo, glassMat);
        canopy.position.set(0, 1.15, -0.15);
        this.bodyGroup.add(canopy);

        // Rear Spoiler Wing
        const wing = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.08, 0.55), carbonMat);
        wing.position.set(0, 1.35, 2.15);
        this.bodyGroup.add(wing);

        const strutL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.2), carbonMat);
        strutL.position.set(-0.75, 1.1, 2.15);
        this.bodyGroup.add(strutL);
        const strutR = strutL.clone();
        strutR.position.set(0.75, 1.1, 2.15);
        this.bodyGroup.add(strutR);

        // Dual Projector Headlights
        const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.2), hlMat);
        hlL.position.set(-0.8, 0.62, -2.32);
        this.bodyGroup.add(hlL);
        const hlR = hlL.clone();
        hlR.position.set(0.8, 0.62, -2.32);
        this.bodyGroup.add(hlR);

        // Forward Projector Spotlight
        this.headlight = new THREE.SpotLight(0xfff4e0, 2.4, 55, Math.PI / 4.2, 0.4);
        this.headlight.position.set(0, 0.7, -2.2);
        this.headlightTarget = new THREE.Object3D();
        this.headlightTarget.position.set(0, 0.2, -35);
        this.bodyGroup.add(this.headlightTarget);
        this.headlight.target = this.headlightTarget;
        this.bodyGroup.add(this.headlight);

        // Taillights (Change intensity when braking)
        this.tailMat = new THREE.MeshBasicMaterial({ color: 0xff1122 });
        const tailStrip = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.12, 0.1), this.tailMat);
        tailStrip.position.set(0, 0.68, 2.32);
        this.bodyGroup.add(tailStrip);

        // Dual Chrome Exhaust Pipes
        const exhaustGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.4, 12);
        exhaustGeo.rotateX(Math.PI / 2);
        const exhL = new THREE.Mesh(exhaustGeo, chromeMat);
        exhL.position.set(-0.55, 0.35, 2.4);
        this.bodyGroup.add(exhL);
        const exhR = exhL.clone();
        exhR.position.set(0.55, 0.35, 2.4);
        this.bodyGroup.add(exhR);

        // Nitro exhaust flames
        const flameGeo = new THREE.ConeGeometry(0.18, 1.4, 8);
        flameGeo.rotateX(-Math.PI / 2);
        const flameMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.9 });
        this.nitroFlameL = new THREE.Mesh(flameGeo, flameMat);
        this.nitroFlameL.position.set(-0.55, 0.35, 3.1);
        this.nitroFlameL.visible = false;
        this.bodyGroup.add(this.nitroFlameL);

        this.nitroFlameR = this.nitroFlameL.clone();
        this.nitroFlameR.position.set(0.55, 0.35, 3.1);
        this.nitroFlameR.visible = false;
        this.bodyGroup.add(this.nitroFlameR);

        // 4 High-Detail Alloy Wheels
        this.wheels = [];
        const wheelGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.38, 18);
        wheelGeo.rotateZ(Math.PI / 2);

        const rimGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.4, 8);
        rimGeo.rotateZ(Math.PI / 2);

        const positions = [
            [-1.15, 0.48, -1.45], // Front Left
            [1.15, 0.48, -1.45],  // Front Right
            [-1.15, 0.48, 1.45],  // Rear Left
            [1.15, 0.48, 1.45]    // Rear Right
        ];

        positions.forEach((p, idx) => {
            const wGroup = new THREE.Group();
            const tire = new THREE.Mesh(wheelGeo, wheelMat);
            const rim = new THREE.Mesh(rimGeo, rimMat);
            wGroup.add(tire);
            wGroup.add(rim);
            wGroup.position.set(p[0], p[1], p[2]);
            this.mesh.add(wGroup);
            this.wheels.push(wGroup);
        });

        this.mesh.position.copy(this.pos);
        this.scene.add(this.mesh);
    }

    update(delta, input) {
        if (!this.occupied) {
            this.speed *= 0.93;
            this.nitro = Math.min(this.maxNitro, this.nitro + 15 * delta);
            this.mesh.position.copy(this.pos);
            this.mesh.rotation.y = this.heading;
            this.bodyGroup.rotation.set(0, 0, 0);
            return;
        }

        let throttle = 0;
        let steering = 0;
        const handbrake = input.keys['Space'] || false;
        const wantsNitro = (input.keys['ShiftLeft'] || input.keys['ShiftRight']) && this.nitro > 5;

        if (input.keys['KeyW'] || input.keys['ArrowUp']) throttle += 1;
        if (input.keys['KeyS'] || input.keys['ArrowDown']) throttle -= 1;
        if (input.keys['KeyA'] || input.keys['ArrowLeft']) steering += 1;
        if (input.keys['KeyD'] || input.keys['ArrowRight']) steering -= 1;

        // Nitro handling
        if (wantsNitro && throttle > 0) {
            this.nitroActive = true;
            this.nitro -= 26 * delta;
            throttle *= 1.55;
            this.nitroFlameL.visible = true;
            this.nitroFlameR.visible = true;
            const flicker = 1 + (Math.random() - 0.5) * 0.3;
            this.nitroFlameL.scale.set(flicker, flicker, flicker);
            this.nitroFlameR.scale.set(flicker, flicker, flicker);
            if (Math.random() > 0.8) window.soundEngine.playNitro();
        } else {
            this.nitroActive = false;
            this.nitroFlameL.visible = false;
            this.nitroFlameR.visible = false;
            this.nitro = Math.min(this.maxNitro, this.nitro + 12 * delta);
        }

        // Acceleration & Braking
        if (throttle > 0) {
            this.speed += this.accel * throttle * delta;
            const top = wantsNitro ? this.maxSpeed * 1.35 : this.maxSpeed;
            if (this.speed > top) this.speed = top;
            this.tailMat.color.setHex(0xff1122);
        } else if (throttle < 0) {
            if (this.speed > 0) {
                this.speed -= this.brake * delta;
                this.tailMat.color.setHex(0xffffff); // Bright reverse/brake
            } else {
                this.speed += this.accel * 0.6 * throttle * delta;
                if (this.speed < this.maxReverseSpeed) this.speed = this.maxReverseSpeed;
                this.tailMat.color.setHex(0xffffff);
            }
        } else {
            this.tailMat.color.setHex(0x990011);
        }

        // Friction & Drifting
        if (handbrake) {
            this.speed *= this.driftFriction;
            if (Math.abs(this.speed) > 12 && Math.abs(steering) > 0.15) {
                if (Math.random() > 0.82) window.soundEngine.playTireScreech();
                this.spawnTireSmoke();
            }
        } else {
            this.speed *= this.friction;
        }

        // Steering based on velocity
        if (Math.abs(this.speed) > 0.2) {
            const dir = this.speed >= 0 ? 1 : -1;
            const driftMult = handbrake ? 1.6 : 1.0;
            this.heading += steering * this.turnSpeed * driftMult * dir * delta;
        }

        // GTA 4 Style Suspension Pitch and Roll
        const targetPitch = (throttle > 0 ? -0.04 : (throttle < 0 ? 0.06 : 0));
        const targetRoll = -steering * Math.min(1.0, Math.abs(this.speed) / 25) * (handbrake ? 0.08 : 0.04);
        this.pitchAngle += (targetPitch - this.pitchAngle) * 8.0 * delta;
        this.rollAngle += (targetRoll - this.rollAngle) * 8.0 * delta;
        this.bodyGroup.rotation.x = this.pitchAngle;
        this.bodyGroup.rotation.z = this.rollAngle;

        // Wheels animation
        const wheelSpin = (this.speed * delta) / 0.48;
        this.wheels.forEach((w, i) => {
            w.children[0].rotation.x += wheelSpin;
            w.children[1].rotation.x += wheelSpin;
            if (i < 2) w.rotation.y = steering * 0.42;
        });

        // Position movement & collision
        const oldPos = this.pos.clone();
        const moveDist = this.speed * delta;
        this.pos.x -= Math.sin(this.heading) * moveDist;
        this.pos.z -= Math.cos(this.heading) * moveDist;

        const resolvedPos = this.city.resolveCollision(this.pos, oldPos, this.radius);
        if (resolvedPos.distanceToSquared(this.pos) > 0.001) {
            this.pos.copy(resolvedPos);
            this.speed *= -0.35;
            window.soundEngine.playExplosion();
        }

        this.mesh.position.copy(this.pos);
        this.mesh.rotation.y = this.heading;

        // Update tire smoke particles
        this.updateTireSmoke(delta);

        // Sound Engine engine pitch update
        window.soundEngine.updateEngineSound(this.speed / this.maxSpeed, this.occupied);
    }

    spawnTireSmoke() {
        const rearL = this.pos.clone().add(new THREE.Vector3(-Math.sin(this.heading + 2.5) * 2.2, 0.25, -Math.cos(this.heading + 2.5) * 2.2));
        const rearR = this.pos.clone().add(new THREE.Vector3(-Math.sin(this.heading - 2.5) * 2.2, 0.25, -Math.cos(this.heading - 2.5) * 2.2));

        [rearL, rearR].forEach(pos => {
            const smokeGeo = new THREE.SphereGeometry(0.35 + Math.random() * 0.3, 6, 6);
            const smokeMat = new THREE.MeshBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.5 });
            const smoke = new THREE.Mesh(smokeGeo, smokeMat);
            smoke.position.copy(pos);
            this.scene.add(smoke);
            this.tireParticles.push({ mesh: smoke, life: 0.6, maxLife: 0.6 });
        });
    }

    updateTireSmoke(delta) {
        for (let i = this.tireParticles.length - 1; i >= 0; i--) {
            const p = this.tireParticles[i];
            p.life -= delta;
            p.mesh.position.y += 1.2 * delta;
            p.mesh.scale.addScalar(2.0 * delta);
            p.mesh.material.opacity = (p.life / p.maxLife) * 0.45;
            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                this.tireParticles.splice(i, 1);
            }
        }
    }

    getForward() {
        return new THREE.Vector3(-Math.sin(this.heading), 0, -Math.cos(this.heading));
    }
}
