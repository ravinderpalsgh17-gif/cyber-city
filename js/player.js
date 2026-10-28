// Cyber City - On-Foot Cyberpunk Player Controller
// Includes 3rd-person movement, sprint, jump, cyber-shield regeneration, vehicle entry/exit, and camera control.

class Player {
    constructor(scene, city, camera) {
        this.scene = scene;
        this.city = city;
        this.camera = camera;

        // Position & Physics
        this.pos = new THREE.Vector3(0, 1.0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.yaw = 0; // Mouse look horizontal angle
        this.pitch = 0.2; // Mouse look vertical angle
        this.cameraDist = 4.5;
        this.firstPerson = false;

        // Stats
        this.health = 100;
        this.maxHealth = 100;
        this.shield = 100;
        this.maxShield = 100;
        this.shieldRegenDelay = 4.0;
        this.lastDamageTime = 0;
        this.isDead = false;

        // Movement constants
        this.walkSpeed = 9.0;
        this.sprintSpeed = 16.0;
        this.jumpForce = 8.5;
        this.gravity = 22.0;
        this.isGrounded = true;
        this.radius = 0.8;

        // Vehicle interaction
        this.inVehicle = false;
        this.vehicle = null;

        this.buildPlayerModel();
    }

    buildPlayerModel() {
        this.mesh = new THREE.Group();

        const armorMat = new THREE.MeshStandardMaterial({
            color: 0x141a29,
            metalness: 0.85,
            roughness: 0.25
        });
        const visorMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
        const accentMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });

        // Torso
        const torsoGeo = new THREE.BoxGeometry(0.7, 0.9, 0.45);
        this.torso = new THREE.Mesh(torsoGeo, armorMat);
        this.torso.position.y = 0.95;
        this.torso.castShadow = true;
        this.mesh.add(this.torso);

        // Cyber Head
        const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        this.head = new THREE.Mesh(headGeo, armorMat);
        this.head.position.y = 1.6;
        this.torso.add(this.head);

        // Glowing Visor
        const visorGeo = new THREE.BoxGeometry(0.35, 0.12, 0.1);
        const visor = new THREE.Mesh(visorGeo, visorMat);
        visor.position.set(0, 0.05, -0.21);
        this.head.add(visor);

        // Neon cyber collar
        const collar = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.08, 0.45), accentMat);
        collar.position.set(0, -0.15, 0);
        this.head.add(collar);

        // Arms & Weapon Mount
        const armGeo = new THREE.BoxGeometry(0.2, 0.7, 0.2);
        this.leftArm = new THREE.Mesh(armGeo, armorMat);
        this.leftArm.position.set(-0.48, 0.85, 0);
        this.mesh.add(this.leftArm);

        this.rightArm = new THREE.Mesh(armGeo, armorMat);
        this.rightArm.position.set(0.48, 0.85, 0);
        this.mesh.add(this.rightArm);

        // Weapon Anchor Point
        this.weaponHolder = new THREE.Group();
        this.weaponHolder.position.set(0.1, -0.3, -0.35);
        this.rightArm.add(this.weaponHolder);

        // Legs
        const legGeo = new THREE.BoxGeometry(0.25, 0.8, 0.25);
        this.leftLeg = new THREE.Mesh(legGeo, armorMat);
        this.leftLeg.position.set(-0.2, 0.4, 0);
        this.mesh.add(this.leftLeg);

        this.rightLeg = new THREE.Mesh(legGeo, armorMat);
        this.rightLeg.position.set(0.2, 0.4, 0);
        this.mesh.add(this.rightLeg);

        this.mesh.position.copy(this.pos);
        this.scene.add(this.mesh);
    }

    damage(amount) {
        if (this.isDead) return;
        this.lastDamageTime = performance.now() / 1000;

        // Shields absorb damage first
        if (this.shield > 0) {
            this.shield -= amount;
            if (this.shield < 0) {
                this.health += this.shield; // remaining bleeds to health
                this.shield = 0;
            }
        } else {
            this.health -= amount;
        }

        // Damage effect on UI
        const hurtFlash = document.getElementById('hurt-overlay');
        if (hurtFlash) {
            hurtFlash.style.opacity = '0.6';
            setTimeout(() => { hurtFlash.style.opacity = '0'; }, 150);
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
        if (this.inVehicle && this.vehicle) {
            this.exitVehicle();
        }
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
        // Place player safely next to driver door
        const right = new THREE.Vector3(-Math.cos(this.vehicle.heading), 0, Math.sin(this.vehicle.heading));
        this.pos.copy(this.vehicle.pos).add(right.multiplyScalar(2.4));
        this.pos.y = 1.0;
        this.mesh.position.copy(this.pos);
        this.mesh.visible = true;
        this.velocity.set(0, 0, 0);
        this.vehicle = null;
    }

    update(delta, input, vehicle) {
        const now = performance.now() / 1000;

        // Regenerate shield over time
        if (now - this.lastDamageTime > this.shieldRegenDelay && this.shield < this.maxShield && !this.isDead) {
            this.shield = Math.min(this.maxShield, this.shield + 20 * delta);
        }

        // Toggle vehicle entry/exit with 'E' or 'F'
        if (input.consumeKey('KeyE') || input.consumeKey('KeyF')) {
            if (this.inVehicle) {
                this.exitVehicle();
            } else if (vehicle && this.pos.distanceTo(vehicle.pos) < 5.0) {
                this.enterVehicle(vehicle);
            }
        }

        // Toggle 1st/3rd person view
        if (input.consumeKey('KeyV')) {
            this.firstPerson = !this.firstPerson;
        }

        if (this.inVehicle) {
            this.updateVehicleCamera(delta);
            return;
        }

        if (this.isDead) return;

        // On-foot movement calculation
        let moveX = 0;
        let moveZ = 0;
        if (input.keys['KeyW'] || input.keys['ArrowUp']) moveZ -= 1;
        if (input.keys['KeyS'] || input.keys['ArrowDown']) moveZ += 1;
        if (input.keys['KeyA'] || input.keys['ArrowLeft']) moveX -= 1;
        if (input.keys['KeyD'] || input.keys['ArrowRight']) moveX += 1;

        const isSprinting = input.keys['ShiftLeft'] || input.keys['ShiftRight'];
        const currentSpeed = isSprinting ? this.sprintSpeed : this.walkSpeed;

        const moveDir = new THREE.Vector3(moveX, 0, moveZ);
        if (moveDir.lengthSq() > 0) {
            moveDir.normalize();
            // Orient movement to camera yaw
            moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

            this.velocity.x = moveDir.x * currentSpeed;
            this.velocity.z = moveDir.z * currentSpeed;

            // Player mesh faces movement direction smoothly
            this.mesh.rotation.y = this.yaw + Math.PI;

            // Animate limbs walking
            const walkCycle = Math.sin(now * (isSprinting ? 14 : 9));
            this.leftLeg.rotation.x = walkCycle * 0.55;
            this.rightLeg.rotation.x = -walkCycle * 0.55;
            this.leftArm.rotation.x = -walkCycle * 0.45;
        } else {
            this.velocity.x *= 0.8;
            this.velocity.z *= 0.8;
            this.leftLeg.rotation.x = 0;
            this.rightLeg.rotation.x = 0;
            this.leftArm.rotation.x = 0;
            // Face aim yaw
            this.mesh.rotation.y = this.yaw + Math.PI;
        }

        // Jumping & Gravity
        if (input.keys['Space'] && this.isGrounded) {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
        }

        this.velocity.y -= this.gravity * delta;

        // Position update
        const oldPos = this.pos.clone();
        this.pos.x += this.velocity.x * delta;
        this.pos.z += this.velocity.z * delta;
        this.pos.y += this.velocity.y * delta;

        // Floor collision
        if (this.pos.y <= 1.0) {
            this.pos.y = 1.0;
            this.velocity.y = 0;
            this.isGrounded = true;
        }

        // Building collisions
        const resolvedPos = this.city.resolveCollision(this.pos, oldPos, this.radius);
        this.pos.x = resolvedPos.x;
        this.pos.z = resolvedPos.z;

        this.mesh.position.copy(this.pos);

        // Update Camera
        this.updateOnFootCamera();
    }

    updateOnFootCamera() {
        if (this.firstPerson) {
            this.camera.position.set(this.pos.x, this.pos.y + 0.7, this.pos.z);
            const lookTarget = new THREE.Vector3(
                this.pos.x - Math.sin(this.yaw) * Math.cos(this.pitch) * 10,
                this.pos.y + 0.7 + Math.sin(this.pitch) * 10,
                this.pos.z - Math.cos(this.yaw) * Math.cos(this.pitch) * 10
            );
            this.camera.lookAt(lookTarget);
            this.mesh.visible = false;
        } else {
            this.mesh.visible = true;
            // 3rd-person chase camera
            const camOffset = new THREE.Vector3(
                Math.sin(this.yaw) * Math.cos(this.pitch) * this.cameraDist,
                Math.sin(this.pitch) * this.cameraDist + 1.6,
                Math.cos(this.yaw) * Math.cos(this.pitch) * this.cameraDist
            );
            this.camera.position.copy(this.pos).add(camOffset);
            this.camera.lookAt(this.pos.x, this.pos.y + 1.2, this.pos.z);
        }
    }

    updateVehicleCamera(delta) {
        if (!this.vehicle) return;
        // Smooth chase camera behind the sports car
        const carHeading = this.vehicle.heading;
        const carPos = this.vehicle.pos;

        const behind = new THREE.Vector3(
            Math.sin(carHeading) * 8.5,
            3.5,
            Math.cos(carHeading) * 8.5
        );
        const targetCamPos = carPos.clone().add(behind);
        this.camera.position.lerp(targetCamPos, 0.15);
        this.camera.lookAt(carPos.x, carPos.y + 1.2, carPos.z);

        // Keep player position anchored to car for minimap and distance checks
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
