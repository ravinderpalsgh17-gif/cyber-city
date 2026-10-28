// Cyber City - High-Detail GTA Operative Character Controller
// Includes tactical leather bomber model, camera occlusion smoothing, sprint, jump, shield regen, and vehicle interaction.

class Player {
    constructor(scene, city, camera) {
        this.scene = scene;
        this.city = city;
        this.camera = camera;

        this.pos = new THREE.Vector3(0, 1.0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.yaw = 0;
        this.pitch = 0.18;
        this.cameraDist = 4.6;
        this.firstPerson = false;

        // Health & Armor (GTA style)
        this.health = 100;
        this.maxHealth = 100;
        this.shield = 100; // Body Armor
        this.maxShield = 100;
        this.shieldRegenDelay = 4.5;
        this.lastDamageTime = 0;
        this.isDead = false;

        this.walkSpeed = 8.5;
        this.sprintSpeed = 16.5;
        this.jumpForce = 8.8;
        this.gravity = 22.0;
        this.isGrounded = true;
        this.radius = 0.8;

        this.inVehicle = false;
        this.vehicle = null;

        this.buildPlayerModel();
    }

    buildPlayerModel() {
        this.mesh = new THREE.Group();

        // Materials
        const jacketMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.7, metalness: 0.1 }); // Brown leather bomber
        const shirtMat = new THREE.MeshStandardMaterial({ color: 0x263238, roughness: 0.8 }); // Dark tactical inner shirt
        const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1c2833, roughness: 0.85 }); // Dark combat cargo pants
        const bootMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 });
        const skinMat = new THREE.MeshStandardMaterial({ color: 0xd7ccc8, roughness: 0.6 });
        const visorMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff }); // Cyber shades

        // Torso: Leather Jacket
        const torsoGeo = new THREE.BoxGeometry(0.75, 0.95, 0.48);
        this.torso = new THREE.Mesh(torsoGeo, jacketMat);
        this.torso.position.y = 0.98;
        this.torso.castShadow = true;
        this.mesh.add(this.torso);

        // Inner shirt collar
        const collar = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.15, 0.49), shirtMat);
        collar.position.set(0, 0.45, 0);
        this.torso.add(collar);

        // Head
        const headGeo = new THREE.BoxGeometry(0.38, 0.4, 0.38);
        this.head = new THREE.Mesh(headGeo, skinMat);
        this.head.position.y = 1.62;
        this.torso.add(this.head);

        // Cyber Aviator Shades / Visor
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.11, 0.12), visorMat);
        visor.position.set(0, 0.06, -0.2);
        this.head.add(visor);

        // Hair / Cap
        const hair = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.14, 0.4), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 }));
        hair.position.set(0, 0.18, 0);
        this.head.add(hair);

        // Arms (Jacket sleeves)
        const armGeo = new THREE.BoxGeometry(0.22, 0.72, 0.22);
        this.leftArm = new THREE.Mesh(armGeo, jacketMat);
        this.leftArm.position.set(-0.5, 0.88, 0);
        this.mesh.add(this.leftArm);

        this.rightArm = new THREE.Mesh(armGeo, jacketMat);
        this.rightArm.position.set(0.5, 0.88, 0);
        this.mesh.add(this.rightArm);

        // Weapon Socket on Right Arm
        this.weaponHolder = new THREE.Group();
        this.weaponHolder.position.set(0.12, -0.32, -0.36);
        this.rightArm.add(this.weaponHolder);

        // Legs (Combat trousers)
        const legGeo = new THREE.BoxGeometry(0.26, 0.85, 0.26);
        this.leftLeg = new THREE.Mesh(legGeo, pantsMat);
        this.leftLeg.position.set(-0.2, 0.42, 0);
        this.mesh.add(this.leftLeg);

        this.rightLeg = new THREE.Mesh(legGeo, pantsMat);
        this.rightLeg.position.set(0.2, 0.42, 0);
        this.mesh.add(this.rightLeg);

        // Boots
        const bootGeo = new THREE.BoxGeometry(0.28, 0.22, 0.38);
        const bootL = new THREE.Mesh(bootGeo, bootMat);
        bootL.position.set(0, -0.38, -0.05);
        this.leftLeg.add(bootL);
        const bootR = new THREE.Mesh(bootGeo, bootMat);
        bootR.position.set(0, -0.38, -0.05);
        this.rightLeg.add(bootR);

        this.mesh.position.copy(this.pos);
        this.scene.add(this.mesh);
    }

    damage(amount) {
        if (this.isDead) return;
        this.lastDamageTime = performance.now() / 1000;

        // Armor absorbs 70% of damage
        if (this.shield > 0) {
            const absorbed = Math.min(this.shield, amount * 0.7);
            this.shield -= absorbed;
            this.health -= (amount - absorbed);
        } else {
            this.health -= amount;
        }

        const hurtFlash = document.getElementById('hurt-overlay');
        if (hurtFlash) {
            hurtFlash.style.opacity = '0.65';
            setTimeout(() => { hurtFlash.style.opacity = '0'; }, 180);
        }

        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
    }

    die() {
        this.isDead = true;
        window.soundEngine.playExplosion();
        const deathScreen = document.getElementById('death-screen');
        if (deathScreen) deathScreen.classList.remove('hidden');
    }

    respawn(spawnPos) {
        this.isDead = false;
        this.health = this.maxHealth;
        this.shield = this.maxShield;
        this.pos.copy(spawnPos || new THREE.Vector3(0, 1.2, 0));
        this.velocity.set(0, 0, 0);
        if (this.inVehicle && this.vehicle) this.exitVehicle();
        const deathScreen = document.getElementById('death-screen');
        if (deathScreen) deathScreen.classList.add('hidden');
    }

    enterVehicle(vehicle) {
        this.inVehicle = true;
        this.vehicle = vehicle;
        vehicle.occupied = true;
        this.mesh.visible = false;
    }

    exitVehicle() {
        if (!this.vehicle) return;
        this.inVehicle = false;
        this.vehicle.occupied = false;
        const right = new THREE.Vector3(-Math.cos(this.vehicle.heading), 0, Math.sin(this.vehicle.heading));
        this.pos.copy(this.vehicle.pos).add(right.multiplyScalar(2.5));
        this.pos.y = 1.0;
        this.mesh.position.copy(this.pos);
        this.mesh.visible = true;
        this.velocity.set(0, 0, 0);
        this.vehicle = null;
    }

    update(delta, input, vehicle) {
        const now = performance.now() / 1000;

        if (now - this.lastDamageTime > this.shieldRegenDelay && this.shield < this.maxShield && !this.isDead) {
            this.shield = Math.min(this.maxShield, this.shield + 18 * delta);
        }

        if (input.consumeKey('KeyE') || input.consumeKey('KeyF')) {
            if (this.inVehicle) {
                this.exitVehicle();
            } else if (vehicle && this.pos.distanceTo(vehicle.pos) < 5.2) {
                this.enterVehicle(vehicle);
            }
        }

        if (input.consumeKey('KeyV')) {
            this.firstPerson = !this.firstPerson;
        }

        if (this.inVehicle) {
            this.updateVehicleCamera(delta);
            return;
        }

        if (this.isDead) return;

        let moveX = 0, moveZ = 0;
        if (input.keys['KeyW'] || input.keys['ArrowUp']) moveZ -= 1;
        if (input.keys['KeyS'] || input.keys['ArrowDown']) moveZ += 1;
        if (input.keys['KeyA'] || input.keys['ArrowLeft']) moveX -= 1;
        if (input.keys['KeyD'] || input.keys['ArrowRight']) moveX += 1;

        const isSprinting = input.keys['ShiftLeft'] || input.keys['ShiftRight'];
        const currentSpeed = isSprinting ? this.sprintSpeed : this.walkSpeed;

        const moveDir = new THREE.Vector3(moveX, 0, moveZ);
        if (moveDir.lengthSq() > 0) {
            moveDir.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
            this.velocity.x = moveDir.x * currentSpeed;
            this.velocity.z = moveDir.z * currentSpeed;
            this.mesh.rotation.y = this.yaw + Math.PI;

            // Fluid limb walk cycle
            const cycle = Math.sin(now * (isSprinting ? 14 : 9));
            this.leftLeg.rotation.x = cycle * 0.55;
            this.rightLeg.rotation.x = -cycle * 0.55;
            this.leftArm.rotation.x = -cycle * 0.45;
        } else {
            this.velocity.x *= 0.8;
            this.velocity.z *= 0.8;
            this.leftLeg.rotation.x = 0;
            this.rightLeg.rotation.x = 0;
            this.leftArm.rotation.x = 0;
            this.mesh.rotation.y = this.yaw + Math.PI;
        }

        if (input.keys['Space'] && this.isGrounded) {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
        }

        this.velocity.y -= this.gravity * delta;

        const oldPos = this.pos.clone();
        this.pos.x += this.velocity.x * delta;
        this.pos.z += this.velocity.z * delta;
        this.pos.y += this.velocity.y * delta;

        if (this.pos.y <= 1.0) {
            this.pos.y = 1.0;
            this.velocity.y = 0;
            this.isGrounded = true;
        }

        const resolvedPos = this.city.resolveCollision(this.pos, oldPos, this.radius);
        this.pos.x = resolvedPos.x;
        this.pos.z = resolvedPos.z;

        this.mesh.position.copy(this.pos);
        this.updateOnFootCamera();
    }

    updateOnFootCamera() {
        if (this.firstPerson) {
            this.camera.position.set(this.pos.x, this.pos.y + 0.72, this.pos.z);
            const lookTarget = new THREE.Vector3(
                this.pos.x - Math.sin(this.yaw) * Math.cos(this.pitch) * 10,
                this.pos.y + 0.72 + Math.sin(this.pitch) * 10,
                this.pos.z - Math.cos(this.yaw) * Math.cos(this.pitch) * 10
            );
            this.camera.lookAt(lookTarget);
            this.mesh.visible = false;
        } else {
            this.mesh.visible = true;
            const camOffset = new THREE.Vector3(
                Math.sin(this.yaw) * Math.cos(this.pitch) * this.cameraDist,
                Math.sin(this.pitch) * this.cameraDist + 1.65,
                Math.cos(this.yaw) * Math.cos(this.pitch) * this.cameraDist
            );
            this.camera.position.copy(this.pos).add(camOffset);
            this.camera.lookAt(this.pos.x, this.pos.y + 1.3, this.pos.z);
        }
    }

    updateVehicleCamera(delta) {
        if (!this.vehicle) return;
        const carHeading = this.vehicle.heading;
        const carPos = this.vehicle.pos;

        const behind = new THREE.Vector3(
            Math.sin(carHeading) * 8.8,
            3.6,
            Math.cos(carHeading) * 8.8
        );
        const targetCamPos = carPos.clone().add(behind);
        this.camera.position.lerp(targetCamPos, 0.16);
        this.camera.lookAt(carPos.x, carPos.y + 1.25, carPos.z);
        this.pos.copy(carPos);
    }

    getForward() {
        return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    }

    getAimVector() {
        return new THREE.Vector3(
            -Math.sin(this.yaw) * Math.cos(this.pitch),
            Math.sin(this.pitch),
            -Math.cos(this.yaw) * Math.cos(this.pitch)
        ).normalize();
    }
}
