// Cyber City - 15 Weapon Arsenal System
// Full definitions, 3D projectile systems, continuous beam lasers, homing micro-missiles, and particle effects.

class WeaponSystem {
    constructor(scene, player, enemies) {
        this.scene = scene;
        this.player = player;
        this.enemies = enemies;

        this.projectiles = [];
        this.particles = [];
        this.beams = [];

        this.weapons = [
            { id: 0, name: "Neon Striker", type: "Pistol", color: 0x00f0ff, damage: 30, fireRate: 0.22, ammo: Infinity, maxAmmo: Infinity, speed: 120, range: 100, desc: "Standard-issue high-precision cyber energy sidearm" },
            { id: 1, name: "Pulse-9 SMG", type: "SMG", color: 0xc400ff, damage: 18, fireRate: 0.08, ammo: 240, maxAmmo: 360, speed: 140, range: 90, desc: "Rapid-fire plasma submachine gun for close quarters" },
            { id: 2, name: "Viper Cyber-AR", type: "Rifle", color: 0x00ff66, damage: 32, fireRate: 0.13, ammo: 180, maxAmmo: 300, speed: 160, range: 140, desc: "Holographic assault rifle firing high-velocity green rounds" },
            { id: 3, name: "Scatter-Tech 12", type: "Shotgun", color: 0xffaa00, damage: 16, fireRate: 0.75, ammo: 48, maxAmmo: 64, pellets: 8, speed: 110, range: 45, desc: "Heavy ion shotgun blasting 8 kinetic energy pellets" },
            { id: 4, name: "Specter Rail-Sniper", type: "Sniper", color: 0xff0055, damage: 190, fireRate: 1.2, ammo: 20, maxAmmo: 30, isHitscan: true, range: 250, desc: "Hyper-velocity railgun piercing through armor instantaneously" },
            { id: 5, name: "Arc Caster", type: "Tesla", color: 0x33bbff, damage: 55, fireRate: 0.45, ammo: 60, maxAmmo: 120, isArc: true, range: 60, desc: "Discharges branching chain lightning that shocks target squads" },
            { id: 6, name: "Plasma Flamethrower", type: "Pyro", color: 0xff3300, damage: 14, fireRate: 0.05, ammo: 250, maxAmmo: 400, isSpray: true, range: 35, desc: "Continuous torrent of superheated blue/pink plasma" },
            { id: 7, name: "Micro-Missile Pod", type: "Launcher", color: 0xffe600, damage: 75, fireRate: 0.35, ammo: 24, maxAmmo: 48, isHoming: true, speed: 70, range: 120, desc: "Fires spiraling micro-rockets that track hostile drones" },
            { id: 8, name: "Vortex Grenade Cannon", type: "Grenade", color: 0x9900ff, damage: 130, fireRate: 0.85, ammo: 18, maxAmmo: 30, isGrenade: true, speed: 45, range: 80, desc: "Bouncing energy grenades detonating with gravitational blast" },
            { id: 9, name: "Katana 'Zero'", type: "Melee", color: 0x00ffff, damage: 120, fireRate: 0.32, ammo: Infinity, maxAmmo: Infinity, isMelee: true, range: 4.5, desc: "High-frequency cyber blade delivering lethal slashing waves" },
            { id: 10, name: "Thermal Beam Cannon", type: "Beam", color: 0xff0033, damage: 16, fireRate: 0.04, ammo: 200, maxAmmo: 400, isContinuous: true, range: 75, desc: "Sustained high-temperature laser ray melting enemy armor" },
            { id: 11, name: "EMP Disruptor", type: "Shockwave", color: 0x00e5ff, damage: 85, fireRate: 0.95, ammo: 15, maxAmmo: 30, isEMP: true, range: 25, desc: "Expanding electromagnetic shockwave disabling electronics" },
            { id: 12, name: "Tachyon Minigun", type: "Heavy", color: 0xff9900, damage: 24, fireRate: 0.06, ammo: 400, maxAmmo: 600, speed: 170, range: 110, desc: "Six-barrel rotary cannon delivering overwhelming bullet storms" },
            { id: 13, name: "Singularity Rifle", type: "Vortex", color: 0xaa00ff, damage: 180, fireRate: 1.4, ammo: 10, maxAmmo: 20, isSingularity: true, speed: 40, range: 90, desc: "Shoots a dark-matter orb that pulls enemies into its core" },
            { id: 14, name: "Cyber-Nuke Launcher", type: "Super", color: 0x00ffbb, damage: 550, fireRate: 2.2, ammo: 4, maxAmmo: 8, isNuke: true, speed: 38, range: 130, desc: "Tactical shoulder-fired mini nuclear warhead with massive blast" }
        ];

        this.currentWeaponIndex = 0;
        this.lastFireTime = 0;
        this.gunMesh = null;

        this.createGunModel();
    }

    get currentWeapon() {
        return this.weapons[this.currentWeaponIndex];
    }

    createGunModel() {
        if (this.gunMesh) {
            this.player.weaponHolder.remove(this.gunMesh);
        }

        const w = this.currentWeapon;
        this.gunMesh = new THREE.Group();

        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x111625, metalness: 0.9, roughness: 0.2 });
        const glowMat = new THREE.MeshBasicMaterial({ color: w.color });

        if (w.isMelee) {
            // Katana blade
            const bladeGeo = new THREE.BoxGeometry(0.06, 0.9, 0.02);
            const blade = new THREE.Mesh(bladeGeo, glowMat);
            blade.position.set(0, 0.45, 0);
            this.gunMesh.add(blade);

            const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.25, 8), bodyMat);
            hilt.position.set(0, -0.05, 0);
            this.gunMesh.add(hilt);
        } else {
            // Futuristic Gun Chassis
            const barrelLen = w.type === 'Sniper' || w.type === 'Heavy' ? 0.9 : 0.5;
            const receiverGeo = new THREE.BoxGeometry(0.12, 0.18, 0.35);
            const receiver = new THREE.Mesh(receiverGeo, bodyMat);
            this.gunMesh.add(receiver);

            const barrelGeo = new THREE.CylinderGeometry(0.035, 0.035, barrelLen, 8);
            barrelGeo.rotateX(Math.PI / 2);
            const barrel = new THREE.Mesh(barrelGeo, bodyMat);
            barrel.position.set(0, 0.05, -barrelLen / 2 - 0.15);
            this.gunMesh.add(barrel);

            // Glowing neon trim
            const glowStrip = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.04, 0.3), glowMat);
            glowStrip.position.set(0, 0.08, -0.05);
            this.gunMesh.add(glowStrip);
        }

        this.player.weaponHolder.add(this.gunMesh);
    }

    selectWeapon(index) {
        if (index < 0 || index >= this.weapons.length) return;
        this.currentWeaponIndex = index;
        this.createGunModel();
        this.updateHUD();
        window.soundEngine.playWeaponSound(0); // click feedback
    }

    nextWeapon() {
        this.selectWeapon((this.currentWeaponIndex + 1) % this.weapons.length);
    }

    prevWeapon() {
        this.selectWeapon((this.currentWeaponIndex - 1 + this.weapons.length) % this.weapons.length);
    }

    fire() {
        const now = performance.now() / 1000;
        const w = this.currentWeapon;

        if (now - this.lastFireTime < w.fireRate) return;
        if (w.ammo <= 0) return;

        this.lastFireTime = now;
        if (w.ammo !== Infinity) w.ammo--;

        // Audio trigger
        window.soundEngine.playWeaponSound(w.id);

        // Calculate fire origin and direction
        const aimDir = this.player.getAimVector();
        const origin = this.player.pos.clone().add(new THREE.Vector3(0, 1.4, 0)).add(aimDir.clone().multiplyScalar(0.8));

        // Weapon behavior dispatch
        if (w.isMelee) {
            this.fireMelee(origin, aimDir, w);
        } else if (w.isHitscan) {
            this.fireRailSniper(origin, aimDir, w);
        } else if (w.isContinuous) {
            this.fireBeam(origin, aimDir, w);
        } else if (w.isEMP) {
            this.fireEMP(origin, w);
        } else if (w.isArc) {
            this.fireArc(origin, aimDir, w);
        } else if (w.isSpray) {
            this.firePlasmaSpray(origin, aimDir, w);
        } else if (w.pellets) {
            // Shotgun spread
            for (let i = 0; i < w.pellets; i++) {
                const spreadDir = aimDir.clone().add(new THREE.Vector3(
                    (Math.random() - 0.5) * 0.16,
                    (Math.random() - 0.5) * 0.16,
                    (Math.random() - 0.5) * 0.16
                )).normalize();
                this.spawnProjectile(origin, spreadDir, w, 2.5);
            }
        } else {
            // Standard projectile or special launcher
            this.spawnProjectile(origin, aimDir, w);
        }

        this.updateHUD();
    }

    spawnProjectile(origin, dir, weapon, lifetime = 3.0) {
        let geo;
        if (weapon.isNuke) {
            geo = new THREE.CylinderGeometry(0.2, 0.35, 1.2, 8);
            geo.rotateX(Math.PI / 2);
        } else if (weapon.isHoming || weapon.isGrenade) {
            geo = new THREE.SphereGeometry(0.35, 8, 8);
        } else if (weapon.isSingularity) {
            geo = new THREE.SphereGeometry(0.6, 12, 12);
        } else {
            geo = new THREE.CylinderGeometry(0.06, 0.06, 0.9, 6);
            geo.rotateX(Math.PI / 2);
        }

        const mat = new THREE.MeshBasicMaterial({ color: weapon.color });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(origin);
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir);
        this.scene.add(mesh);

        this.projectiles.push({
            mesh: mesh,
            dir: dir.clone(),
            speed: weapon.speed || 120,
            weapon: weapon,
            life: lifetime,
            gravity: weapon.isGrenade ? 18.0 : 0,
            velY: weapon.isGrenade ? 5.0 : 0
        });
    }

    fireRailSniper(origin, dir, weapon) {
        // Instant laser beam raycast
        const raycaster = new THREE.Raycaster(origin, dir, 0, weapon.range);
        const hitResult = this.enemies.checkRaycast(raycaster, weapon.damage);

        const endPoint = hitResult ? hitResult.point : origin.clone().add(dir.clone().multiplyScalar(weapon.range));

        // Create lingering visual laser cylinder
        const dist = origin.distanceTo(endPoint);
        const beamGeo = new THREE.CylinderGeometry(0.08, 0.08, dist, 8);
        beamGeo.rotateX(Math.PI / 2);
        const beamMat = new THREE.MeshBasicMaterial({ color: 0xff0055, transparent: true, opacity: 0.9 });
        const beamMesh = new THREE.Mesh(beamGeo, beamMat);

        beamMesh.position.copy(origin).add(dir.clone().multiplyScalar(dist / 2));
        beamMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir);
        this.scene.add(beamMesh);

        this.beams.push({ mesh: beamMesh, life: 0.18 });

        if (hitResult) {
            this.spawnExplosion(hitResult.point, 0xff0055, 1.5);
        }
    }

    fireBeam(origin, dir, weapon) {
        const raycaster = new THREE.Raycaster(origin, dir, 0, weapon.range);
        const hit = this.enemies.checkRaycast(raycaster, weapon.damage);
        const end = hit ? hit.point : origin.clone().add(dir.clone().multiplyScalar(weapon.range));

        const dist = origin.distanceTo(end);
        const beamGeo = new THREE.CylinderGeometry(0.12, 0.12, dist, 6);
        beamGeo.rotateX(Math.PI / 2);
        const beamMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
        const beamMesh = new THREE.Mesh(beamGeo, beamMat);
        beamMesh.position.copy(origin).add(dir.clone().multiplyScalar(dist / 2));
        beamMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir);
        this.scene.add(beamMesh);
        this.beams.push({ mesh: beamMesh, life: 0.06 });
    }

    fireMelee(origin, dir, weapon) {
        // Forward lunge slash
        const hitEnemies = this.enemies.checkSphere(origin.clone().add(dir.multiplyScalar(2.0)), weapon.range, weapon.damage);
        // Visual slash arc
        const arcGeo = new THREE.TorusGeometry(2.0, 0.08, 6, 24, Math.PI / 1.5);
        const arcMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8 });
        const arcMesh = new THREE.Mesh(arcGeo, arcMat);
        arcMesh.position.copy(this.player.pos).add(new THREE.Vector3(0, 1.2, 0));
        arcMesh.rotation.y = this.player.yaw + Math.PI / 2;
        this.scene.add(arcMesh);
        this.beams.push({ mesh: arcMesh, life: 0.15 });
    }

    fireEMP(origin, weapon) {
        // Expanding EMP Ring
        const sphereGeo = new THREE.SphereGeometry(1, 16, 16);
        const sphereMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, wireframe: true, transparent: true, opacity: 0.8 });
        const empMesh = new THREE.Mesh(sphereGeo, sphereMat);
        empMesh.position.copy(origin);
        this.scene.add(empMesh);

        this.particles.push({
            mesh: empMesh,
            scaleSpeed: 38,
            life: 0.65,
            isEmpSphere: true
        });

        // Damage all enemies in radius
        this.enemies.checkSphere(origin, weapon.range, weapon.damage);
    }

    fireArc(origin, dir, weapon) {
        const target = this.enemies.getClosestEnemy(origin, weapon.range);
        if (target) {
            target.damage(weapon.damage);
            // Draw electric lightning bolt segments
            const boltGroup = new THREE.Group();
            let curr = origin.clone();
            const segs = 6;
            const deltaVec = target.pos.clone().sub(origin).divideScalar(segs);

            for (let i = 0; i < segs; i++) {
                const next = curr.clone().add(deltaVec).add(new THREE.Vector3(
                    (Math.random() - 0.5) * 1.5,
                    (Math.random() - 0.5) * 1.5,
                    (Math.random() - 0.5) * 1.5
                ));
                const segDist = curr.distanceTo(next);
                const segGeo = new THREE.CylinderGeometry(0.06, 0.06, segDist, 4);
                segGeo.rotateX(Math.PI / 2);
                const segMat = new THREE.MeshBasicMaterial({ color: 0x33bbff });
                const seg = new THREE.Mesh(segGeo, segMat);
                seg.position.copy(curr).add(next.clone().sub(curr).multiplyScalar(0.5));
                seg.lookAt(next);
                boltGroup.add(seg);
                curr = next;
            }
            this.scene.add(boltGroup);
            this.beams.push({ mesh: boltGroup, life: 0.15 });
        }
    }

    firePlasmaSpray(origin, dir, weapon) {
        for (let i = 0; i < 3; i++) {
            const spread = dir.clone().add(new THREE.Vector3(
                (Math.random() - 0.5) * 0.25,
                (Math.random() - 0.5) * 0.25,
                (Math.random() - 0.5) * 0.25
            )).normalize();
            this.spawnProjectile(origin, spread, weapon, 0.6);
        }
    }

    spawnExplosion(pos, color = 0xff0055, radius = 4.0) {
        const sphereGeo = new THREE.SphereGeometry(radius, 12, 12);
        const sphereMat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.85 });
        const explosion = new THREE.Mesh(sphereGeo, sphereMat);
        explosion.position.copy(pos);
        this.scene.add(explosion);

        this.particles.push({
            mesh: explosion,
            scaleSpeed: radius * 5,
            life: 0.35,
            isExplosion: true
        });

        window.soundEngine.playExplosion();
    }

    update(delta) {
        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.life -= delta;

            if (p.weapon.isGrenade) {
                p.velY -= p.gravity * delta;
                p.mesh.position.y += p.velY * delta;
                p.mesh.position.add(p.dir.clone().multiplyScalar(p.speed * delta));
                if (p.mesh.position.y < 0.3) {
                    p.mesh.position.y = 0.3;
                    p.velY *= -0.5; // Bounce!
                }
            } else if (p.weapon.isHoming) {
                // Seek nearest enemy
                const nearest = this.enemies.getClosestEnemy(p.mesh.position, 100);
                if (nearest) {
                    const toTarget = nearest.pos.clone().sub(p.mesh.position).normalize();
                    p.dir.lerp(toTarget, 4.0 * delta).normalize();
                    p.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), p.dir);
                }
                p.mesh.position.add(p.dir.clone().multiplyScalar(p.speed * delta));
            } else if (p.weapon.isSingularity) {
                // Pull nearby enemies towards itself
                this.enemies.pullTowards(p.mesh.position, 25, 40 * delta);
                p.mesh.position.add(p.dir.clone().multiplyScalar(p.speed * delta));
            } else {
                p.mesh.position.add(p.dir.clone().multiplyScalar(p.speed * delta));
            }

            // Check enemy collision
            const hitEnemy = this.enemies.checkPointCollision(p.mesh.position, p.weapon.isNuke ? 3.0 : 1.2);
            const expired = p.life <= 0;

            if (hitEnemy || expired) {
                if (p.weapon.isNuke) {
                    this.spawnExplosion(p.mesh.position, 0x00ffbb, 18.0);
                    this.enemies.checkSphere(p.mesh.position, 35, p.weapon.damage);
                } else if (p.weapon.isGrenade || p.weapon.isSingularity) {
                    this.spawnExplosion(p.mesh.position, p.weapon.color, 6.0);
                    this.enemies.checkSphere(p.mesh.position, 10, p.weapon.damage);
                } else if (hitEnemy) {
                    hitEnemy.damage(p.weapon.damage);
                    this.spawnExplosion(p.mesh.position, p.weapon.color, 1.0);
                }

                this.scene.remove(p.mesh);
                this.projectiles.splice(i, 1);
            }
        }

        // Update lingering beams
        for (let i = this.beams.length - 1; i >= 0; i--) {
            const b = this.beams[i];
            b.life -= delta;
            if (b.life <= 0) {
                this.scene.remove(b.mesh);
                this.beams.splice(i, 1);
            }
        }

        // Update particle explosions & EMP spheres
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const pt = this.particles[i];
            pt.life -= delta;
            pt.mesh.scale.addScalar(pt.scaleSpeed * delta);
            if (pt.mesh.material) {
                pt.mesh.material.opacity = Math.max(0, pt.life * 2);
            }

            if (pt.life <= 0) {
                this.scene.remove(pt.mesh);
                this.particles.splice(i, 1);
            }
        }
    }

    updateHUD() {
        const nameEl = document.getElementById('weapon-name');
        const ammoEl = document.getElementById('weapon-ammo');
        const descEl = document.getElementById('weapon-desc');
        const countEl = document.getElementById('weapon-counter');

        const w = this.currentWeapon;
        if (nameEl) nameEl.textContent = `${w.id + 1}. ${w.name}`;
        if (ammoEl) ammoEl.textContent = w.ammo === Infinity ? "AMMO: ∞" : `AMMO: ${w.ammo} / ${w.maxAmmo}`;
        if (descEl) descEl.textContent = w.desc;
        if (countEl) countEl.textContent = `[${w.id + 1} / ${this.weapons.length}]`;

        // Highlight active HUD slot
        document.querySelectorAll('.weapon-slot').forEach((slot, idx) => {
            if (idx === this.currentWeaponIndex) {
                slot.classList.add('active');
            } else {
                slot.classList.remove('active');
            }
        });
    }
}
