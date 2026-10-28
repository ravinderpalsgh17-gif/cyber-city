// Cyber City - Enemy AI, Police Interceptors, Boss Titan-Mech, and Wanted System

class EnemyManager {
    constructor(scene, player, city) {
        this.scene = scene;
        this.player = player;
        this.city = city;

        this.enemies = [];
        this.enemyProjectiles = [];
        this.wantedLevel = 0; // 0 to 5 stars
        this.lastWantedCrimeTime = 0;
        this.spawnTimer = 0;

        this.boss = null;
    }

    spawnDrone(pos) {
        const droneGroup = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color: 0x1f2438, metalness: 0.9, roughness: 0.2 });
        const glowRed = new THREE.MeshBasicMaterial({ color: 0xff0055 });

        // Disc body
        const body = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 0.8, 0.4, 8), mat);
        droneGroup.add(body);

        // Red sensor eye
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), glowRed);
        eye.position.set(0, -0.2, 0.6);
        droneGroup.add(eye);

        // 4 Rotors
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2;
            const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1.4), mat);
            arm.position.set(Math.cos(angle) * 1.0, 0.1, Math.sin(angle) * 1.0);
            arm.rotation.y = angle;
            droneGroup.add(arm);

            const blade = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.02, 0.1), glowRed);
            blade.position.set(Math.cos(angle) * 1.6, 0.15, Math.sin(angle) * 1.6);
            droneGroup.add(blade);
        }

        // Searchlight cone
        const lightCone = new THREE.Mesh(
            new THREE.ConeGeometry(2.5, 7, 8, 1, true),
            new THREE.MeshBasicMaterial({ color: 0xff0055, transparent: true, opacity: 0.25, side: THREE.DoubleSide })
        );
        lightCone.position.set(0, -3.5, 0);
        droneGroup.add(lightCone);

        droneGroup.position.copy(pos || new THREE.Vector3(20, 6, 20));
        this.scene.add(droneGroup);

        const drone = {
            type: 'drone',
            mesh: droneGroup,
            pos: droneGroup.position,
            health: 80,
            maxHealth: 80,
            speed: 14.0,
            hoverHeight: 6.5,
            attackCooldown: 1.5,
            lastAttack: 0,
            radius: 1.5,
            damage: (dmg) => this.handleDamage(drone, dmg)
        };

        this.enemies.push(drone);
        return drone;
    }

    spawnMerc(pos) {
        const mercGroup = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color: 0x1a2130, metalness: 0.8, roughness: 0.3 });
        const redVisor = new THREE.MeshBasicMaterial({ color: 0xff0033 });

        // Torso
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.45), mat);
        torso.position.y = 0.95;
        mercGroup.add(torso);

        // Head
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.38), mat);
        head.position.y = 1.6;
        torso.add(head);

        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.1, 0.1), redVisor);
        visor.position.set(0, 0.05, -0.2);
        head.add(visor);

        mercGroup.position.copy(pos || new THREE.Vector3(15, 1, 15));
        this.scene.add(mercGroup);

        const merc = {
            type: 'merc',
            mesh: mercGroup,
            pos: mercGroup.position,
            health: 120,
            maxHealth: 120,
            speed: 8.5,
            attackCooldown: 1.2,
            lastAttack: 0,
            radius: 1.0,
            damage: (dmg) => this.handleDamage(merc, dmg)
        };

        this.enemies.push(merc);
        return merc;
    }

    spawnInterceptor(pos) {
        const carGroup = new THREE.Group();
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x050814, metalness: 0.9, roughness: 0.2 });
        const sirenMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });

        const body = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.7, 4.6), bodyMat);
        body.position.y = 0.6;
        carGroup.add(body);

        // Flashing police lightbar
        const lightbar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, 0.3), sirenMat);
        lightbar.position.set(0, 1.25, 0);
        carGroup.add(lightbar);

        carGroup.position.copy(pos || new THREE.Vector3(30, 0.5, 30));
        this.scene.add(carGroup);

        const interceptor = {
            type: 'interceptor',
            mesh: carGroup,
            pos: carGroup.position,
            health: 300,
            maxHealth: 300,
            speed: 28.0,
            heading: 0,
            attackCooldown: 2.0,
            lastAttack: 0,
            radius: 2.8,
            damage: (dmg) => this.handleDamage(interceptor, dmg)
        };

        this.enemies.push(interceptor);
        return interceptor;
    }

    spawnBoss(pos) {
        const bossGroup = new THREE.Group();
        const armorMat = new THREE.MeshStandardMaterial({ color: 0x161c2b, metalness: 0.95, roughness: 0.15 });
        const redGlow = new THREE.MeshBasicMaterial({ color: 0xff0055 });

        // Massive Mech Torso
        const torso = new THREE.Mesh(new THREE.BoxGeometry(4.5, 5.0, 3.5), armorMat);
        torso.position.y = 7.0;
        bossGroup.add(torso);

        // Mech Head / Central Core
        const core = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 16), redGlow);
        core.position.set(0, 8.5, 1.2);
        bossGroup.add(core);

        // Dual Heavy Cannons
        const cannonL = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 5.0, 8), armorMat);
        cannonL.position.set(-3.2, 6.5, 1.5);
        cannonL.rotation.x = Math.PI / 2;
        bossGroup.add(cannonL);

        const cannonR = cannonL.clone();
        cannonR.position.set(3.2, 6.5, 1.5);
        bossGroup.add(cannonR);

        // Massive Hydraulic Legs
        const legGeo = new THREE.BoxGeometry(1.4, 5.5, 1.4);
        const legL = new THREE.Mesh(legGeo, armorMat);
        legL.position.set(-1.8, 2.75, 0);
        bossGroup.add(legL);

        const legR = new THREE.Mesh(legGeo, armorMat);
        legR.position.set(1.8, 2.75, 0);
        bossGroup.add(legR);

        bossGroup.position.copy(pos || new THREE.Vector3(0, 0, -200));
        this.scene.add(bossGroup);

        this.boss = {
            type: 'boss',
            mesh: bossGroup,
            pos: bossGroup.position,
            health: 2500,
            maxHealth: 2500,
            speed: 9.0,
            attackCooldown: 1.2,
            lastAttack: 0,
            radius: 4.8,
            damage: (dmg) => {
                this.handleDamage(this.boss, dmg);
                this.updateBossHUD();
            }
        };

        this.enemies.push(this.boss);

        // Show Boss HUD
        const bossBar = document.getElementById('boss-hud');
        if (bossBar) bossBar.classList.remove('hidden');

        return this.boss;
    }

    updateBossHUD() {
        if (!this.boss) return;
        const bar = document.getElementById('boss-health-fill');
        const text = document.getElementById('boss-health-text');
        const pct = Math.max(0, (this.boss.health / this.boss.maxHealth) * 100);
        if (bar) bar.style.width = pct + '%';
        if (text) text.textContent = `${Math.ceil(this.boss.health)} / ${this.boss.maxHealth} HP`;
    }

    handleDamage(enemy, amount) {
        enemy.health -= amount;
        this.triggerCrime();

        // Flash enemy red
        if (enemy.mesh) {
            enemy.mesh.traverse(child => {
                if (child.isMesh && child.material && child.material.color) {
                    const orig = child.material.color.getHex();
                    child.material.color.setHex(0xffffff);
                    setTimeout(() => child.material.color.setHex(orig), 80);
                }
            });
        }

        if (enemy.health <= 0) {
            this.killEnemy(enemy);
        }
    }

    killEnemy(enemy) {
        window.soundEngine.playExplosion();
        this.scene.remove(enemy.mesh);
        const idx = this.enemies.indexOf(enemy);
        if (idx !== -1) this.enemies.splice(idx, 1);

        if (enemy === this.boss) {
            this.boss = null;
            const bossBar = document.getElementById('boss-hud');
            if (bossBar) bossBar.classList.add('hidden');
        }
    }

    triggerCrime() {
        const now = performance.now() / 1000;
        this.lastWantedCrimeTime = now;
        if (this.wantedLevel === 0) this.setWanted(1);
    }

    setWanted(level) {
        this.wantedLevel = Math.min(5, Math.max(0, level));
        const starsEl = document.getElementById('wanted-stars');
        if (starsEl) {
            let s = '';
            for (let i = 0; i < 5; i++) {
                s += (i < this.wantedLevel) ? '★' : '☆';
            }
            starsEl.textContent = s;
        }
    }

    update(delta) {
        const now = performance.now() / 1000;

        // Wanted level cooldown if player stays clean for 20 seconds
        if (this.wantedLevel > 0 && now - this.lastWantedCrimeTime > 20) {
            this.setWanted(this.wantedLevel - 1);
            this.lastWantedCrimeTime = now;
        }

        // Ambient police / drone reinforcements based on wanted level
        this.spawnTimer += delta;
        if (this.wantedLevel > 0 && this.spawnTimer > Math.max(3.0, 12 - this.wantedLevel * 2)) {
            this.spawnTimer = 0;
            if (this.enemies.length < 5 + this.wantedLevel * 3) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 55 + Math.random() * 25;
                const spawnPos = this.player.pos.clone().add(new THREE.Vector3(Math.cos(angle) * dist, 1, Math.sin(angle) * dist));

                if (this.wantedLevel >= 3 && Math.random() > 0.4) {
                    this.spawnInterceptor(spawnPos);
                } else if (Math.random() > 0.4) {
                    this.spawnDrone(spawnPos.add(new THREE.Vector3(0, 6, 0)));
                } else {
                    this.spawnMerc(spawnPos);
                }
            }
        }

        // Update enemy AI behaviors
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            const distToPlayer = e.pos.distanceTo(this.player.pos);

            if (e.type === 'drone') {
                // Drone hover and strafe
                const targetPos = this.player.pos.clone().add(new THREE.Vector3(0, e.hoverHeight, 0));
                const dir = targetPos.sub(e.pos).normalize();
                if (distToPlayer > 18) {
                    e.pos.add(dir.multiplyScalar(e.speed * delta));
                } else {
                    // Circle around player
                    const strafe = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(e.speed * 0.7 * delta);
                    e.pos.add(strafe);
                }
                e.mesh.lookAt(this.player.pos.x, e.pos.y, this.player.pos.z);

                // Shoot laser bolt at player
                if (distToPlayer < 45 && now - e.lastAttack > e.attackCooldown) {
                    e.lastAttack = now;
                    this.fireEnemyLaser(e.pos, this.player.pos, 14);
                }

            } else if (e.type === 'merc') {
                // Ground troops sprint toward player
                const dir = this.player.pos.clone().sub(e.pos).setY(0).normalize();
                if (distToPlayer > 12) {
                    e.pos.add(dir.multiplyScalar(e.speed * delta));
                }
                e.mesh.lookAt(this.player.pos.x, e.pos.y, this.player.pos.z);

                if (distToPlayer < 35 && now - e.lastAttack > e.attackCooldown) {
                    e.lastAttack = now;
                    this.fireEnemyLaser(e.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), this.player.pos.clone().add(new THREE.Vector3(0, 1, 0)), 12);
                }

            } else if (e.type === 'interceptor') {
                // Vehicle pursuit
                const toPlayer = this.player.pos.clone().sub(e.pos).setY(0);
                const targetAngle = Math.atan2(-toPlayer.x, -toPlayer.z);
                e.mesh.rotation.y = targetAngle;
                const fwd = new THREE.Vector3(-Math.sin(targetAngle), 0, -Math.cos(targetAngle));
                e.pos.add(fwd.multiplyScalar(e.speed * delta));

                // Ram player or shoot
                if (distToPlayer < 4.0) {
                    this.player.damage(25);
                    window.soundEngine.playExplosion();
                } else if (distToPlayer < 40 && now - e.lastAttack > e.attackCooldown) {
                    e.lastAttack = now;
                    this.fireEnemyLaser(e.pos.clone().add(new THREE.Vector3(0, 1, 0)), this.player.pos, 16);
                }

            } else if (e.type === 'boss') {
                // Apex Titan-Mech AI
                const toPlayer = this.player.pos.clone().sub(e.pos).setY(0);
                e.mesh.lookAt(this.player.pos.x, e.pos.y, this.player.pos.z);

                if (distToPlayer > 22) {
                    e.pos.add(toPlayer.normalize().multiplyScalar(e.speed * delta));
                }

                // Boss Attacks: Dual Heavy Blasters & Missile Volley
                if (now - e.lastAttack > e.attackCooldown) {
                    e.lastAttack = now;
                    // Fire left and right cannons
                    const leftOrigin = e.pos.clone().add(new THREE.Vector3(-3, 6.5, 2));
                    const rightOrigin = e.pos.clone().add(new THREE.Vector3(3, 6.5, 2));
                    this.fireEnemyLaser(leftOrigin, this.player.pos, 22);
                    this.fireEnemyLaser(rightOrigin, this.player.pos, 22);
                }
            }
        }

        // Update enemy projectiles
        for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
            const ep = this.enemyProjectiles[i];
            ep.life -= delta;
            ep.mesh.position.add(ep.dir.clone().multiplyScalar(ep.speed * delta));

            // Check hit against player
            const targetPos = this.player.inVehicle && this.player.vehicle ? this.player.vehicle.pos : this.player.pos;
            if (ep.mesh.position.distanceTo(targetPos) < 2.0) {
                this.player.damage(ep.damage);
                this.scene.remove(ep.mesh);
                this.enemyProjectiles.splice(i, 1);
                continue;
            }

            if (ep.life <= 0) {
                this.scene.remove(ep.mesh);
                this.enemyProjectiles.splice(i, 1);
            }
        }
    }

    fireEnemyLaser(from, to, damage) {
        const dir = to.clone().sub(from).normalize();
        const geo = new THREE.CylinderGeometry(0.08, 0.08, 1.2, 6);
        geo.rotateX(Math.PI / 2);
        const mat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(from);
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir);
        this.scene.add(mesh);

        this.enemyProjectiles.push({
            mesh: mesh,
            dir: dir,
            speed: 65.0,
            damage: damage,
            life: 2.5
        });

        window.soundEngine.playWeaponSound(0);
    }

    pullTowards(center, radius, force) {
        for (let i = 0; i < this.enemies.length; i++) {
            const e = this.enemies[i];
            if (e.type === 'boss') continue;
            const dist = e.pos.distanceTo(center);
            if (dist < radius && dist > 0.5) {
                const pullDir = center.clone().sub(e.pos).normalize();
                e.pos.add(pullDir.multiplyScalar(force));
            }
        }
    }

    checkRaycast(raycaster, damage) {
        for (let i = 0; i < this.enemies.length; i++) {
            const e = this.enemies[i];
            const ray = raycaster.ray;
            const dist = ray.distanceToPoint(e.pos);
            if (dist < e.radius) {
                e.damage(damage);
                return { point: e.pos.clone() };
            }
        }
        return null;
    }

    checkSphere(center, radius, damage) {
        const hits = [];
        for (let i = 0; i < this.enemies.length; i++) {
            const e = this.enemies[i];
            if (e.pos.distanceTo(center) <= radius + e.radius) {
                e.damage(damage);
                hits.push(e);
            }
        }
        return hits;
    }

    checkPointCollision(point, radius = 1.0) {
        for (let i = 0; i < this.enemies.length; i++) {
            const e = this.enemies[i];
            if (e.pos.distanceTo(point) <= radius + e.radius) {
                return e;
            }
        }
        return null;
    }

    getClosestEnemy(pos, maxDist = 100) {
        let best = null;
        let bestDist = maxDist;
        for (let i = 0; i < this.enemies.length; i++) {
            const e = this.enemies[i];
            const d = e.pos.distanceTo(pos);
            if (d < bestDist) {
                bestDist = d;
                best = e;
            }
        }
        return best;
    }
}
