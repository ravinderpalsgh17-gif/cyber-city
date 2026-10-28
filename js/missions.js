// Cyber City - Story Campaign & Mission System
// 5 Episodic Story Missions with voice/radio synth, 3D waypoint markers, objectives, and progression.

class MissionManager {
    constructor(scene, player, vehicle, city, enemies, weapons) {
        this.scene = scene;
        this.player = player;
        this.vehicle = vehicle;
        this.city = city;
        this.enemies = enemies;
        this.weapons = weapons;

        this.currentMissionIndex = 0;
        this.currentStep = 0;
        this.missionTimer = 0;
        this.hackProgress = 0;
        this.active = true;

        // 3D Visual Waypoint Beacon
        this.waypointGroup = new THREE.Group();
        const beamGeo = new THREE.CylinderGeometry(0.3, 0.3, 60, 16);
        const beamMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.6 });
        this.waypointGroup.add(new THREE.Mesh(beamGeo, beamMat));

        const ringGeo = new THREE.RingGeometry(1.5, 2.2, 24);
        ringGeo.rotateX(-Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide });
        this.waypointRing = new THREE.Mesh(ringGeo, ringMat);
        this.waypointRing.position.y = 0.2;
        this.waypointGroup.add(this.waypointRing);

        this.scene.add(this.waypointGroup);
        this.waypointPos = new THREE.Vector3(0, 0, 0);

        this.missions = [
            // MISSION 1
            {
                title: "1. The Awakening",
                desc: "Retrieve your hidden cyber-weapons cache in the alley and destroy scout drones.",
                steps: [
                    {
                        objective: "Go to your weapon cache in the alleyway",
                        target: () => this.city.spawns.cache,
                        check: () => this.player.pos.distanceTo(this.city.spawns.cache) < 4.0,
                        onComplete: () => {
                            this.showDialogue("Nyx", "Cache unlocked! You've got your sidearm and SMG. Look out, OmniCorp drones incoming!");
                            this.weapons.selectWeapon(0);
                            for (let i = 0; i < 3; i++) {
                                const p = this.city.spawns.cache.clone().add(new THREE.Vector3((i - 1) * 15, 6, 20));
                                this.enemies.spawnDrone(p);
                            }
                        }
                    },
                    {
                        objective: "Neutralize 3 OmniCorp Scout Drones",
                        target: () => this.player.pos,
                        check: () => this.enemies.enemies.length === 0,
                        onComplete: () => {
                            this.showDialogue("Nyx", "Area clear! Now get to your sports car parked on the main road.");
                        }
                    },
                    {
                        objective: "Enter your Cyber Sports Car [Press E]",
                        target: () => this.vehicle.pos,
                        check: () => this.player.inVehicle,
                        onComplete: () => {
                            this.showDialogue("Nyx", "Engine roaring. Sector 4 is hot, let's move!");
                            window.soundEngine.playMissionPing();
                        }
                    }
                ]
            },

            // MISSION 2
            {
                title: "2. Neon Courier",
                desc: "Deliver encrypted decryptor keys across 5 city transmission towers before time expires.",
                timeLimit: 85,
                checkpointIndex: 0,
                steps: [
                    {
                        objective: "Race through all 5 City Checkpoints",
                        target: () => this.city.spawns.checkpoints[this.missions[1].checkpointIndex],
                        check: () => {
                            const cp = this.city.spawns.checkpoints[this.missions[1].checkpointIndex];
                            if (this.player.pos.distanceTo(cp) < 12.0) {
                                this.missions[1].checkpointIndex++;
                                window.soundEngine.playMissionPing();
                                if (this.missions[1].checkpointIndex >= this.city.spawns.checkpoints.length) {
                                    return true;
                                }
                                this.setWaypoint(this.city.spawns.checkpoints[this.missions[1].checkpointIndex]);
                            }
                            return false;
                        },
                        onComplete: () => {
                            this.showDialogue("Nyx", "All transmission relays hijacked! OmniCorp central feed is bleeding.");
                            this.enemies.setWanted(2);
                        }
                    }
                ]
            },

            // MISSION 3
            {
                title: "3. The Data Purge",
                desc: "Infiltrate OmniCorp Sub-Station, eliminate guards, and hold the hack terminal.",
                steps: [
                    {
                        objective: "Reach OmniCorp Sub-Station Plaza",
                        target: () => new THREE.Vector3(120, 1, -120),
                        check: () => this.player.pos.distanceTo(new THREE.Vector3(120, 1, -120)) < 15,
                        onComplete: () => {
                            this.showDialogue("Nyx", "Heavies on site! Wipe out the security squad.");
                            for (let i = 0; i < 4; i++) {
                                this.enemies.spawnMerc(new THREE.Vector3(110 + i * 6, 1, -120 + (i % 2) * 8));
                            }
                            this.enemies.spawnDrone(new THREE.Vector3(120, 7, -120));
                        }
                    },
                    {
                        objective: "Eliminate OmniCorp Security Squad",
                        target: () => new THREE.Vector3(120, 1, -120),
                        check: () => this.enemies.enemies.length === 0,
                        onComplete: () => {
                            this.showDialogue("Nyx", "Defenses down! Stand inside the terminal ring to upload the purge virus.");
                        }
                    },
                    {
                        objective: "Hack OmniCorp Terminal (Hold position)",
                        target: () => new THREE.Vector3(120, 1, -120),
                        check: () => {
                            if (this.player.pos.distanceTo(new THREE.Vector3(120, 1, -120)) < 6) {
                                this.hackProgress += 0.08;
                                this.showDialogue("Terminal", `UPLOADING VIRUS: ${Math.min(100, Math.floor(this.hackProgress * 10))}%`);
                                if (this.hackProgress >= 10.0) return true;
                            }
                            return false;
                        },
                        onComplete: () => {
                            this.showDialogue("Nyx", "Purge complete! Civilian surveillance network is offline.");
                            window.soundEngine.playMissionPing();
                        }
                    }
                ]
            },

            // MISSION 4
            {
                title: "4. Highway Overdrive",
                desc: "Ambush the OmniCorp Heavy Armored Convoy and steal military weapon prototypes.",
                steps: [
                    {
                        objective: "Intercept Armed Convoy on the Avenue",
                        target: () => new THREE.Vector3(-120, 1, 0),
                        check: () => this.player.pos.distanceTo(new THREE.Vector3(-120, 1, 0)) < 25,
                        onComplete: () => {
                            this.showDialogue("Nyx", "Convoy spotted! Destroy the police escort vehicles and the carrier!");
                            this.enemies.spawnInterceptor(new THREE.Vector3(-120, 1, 10));
                            this.enemies.spawnInterceptor(new THREE.Vector3(-120, 1, -10));
                            this.enemies.setWanted(4);
                        }
                    },
                    {
                        objective: "Destroy Convoy Interceptors & Escorts",
                        target: () => this.player.pos,
                        check: () => this.enemies.enemies.length === 0,
                        onComplete: () => {
                            this.showDialogue("Nyx", "Convoy destroyed! We've secured experimental payloads: Rail-Sniper, Singularity & Cyber-Nuke!");
                            this.weapons.selectWeapon(14); // Equips Cyber-Nuke Launcher!
                            window.soundEngine.playMissionPing();
                        }
                    }
                ]
            },

            // MISSION 5
            {
                title: "5. Apex Protocol (Final Override)",
                desc: "Assault Central OmniCorp Spire and eliminate the colossal Apex Titan-Mech.",
                steps: [
                    {
                        objective: "Assault OmniCorp Central Spire Plaza",
                        target: () => this.city.spawns.omnicorpTower,
                        check: () => this.player.pos.distanceTo(this.city.spawns.omnicorpTower) < 35,
                        onComplete: () => {
                            this.showDialogue("Director Vane", "Voss! You think your petty rebellion can breach this citadel? Apex Titan, annihilate him!");
                            this.enemies.spawnBoss(this.city.spawns.omnicorpTower.clone().add(new THREE.Vector3(0, 0, 20)));
                        }
                    },
                    {
                        objective: "Destroy the Apex Titan-Mech Boss",
                        target: () => this.city.spawns.omnicorpTower,
                        check: () => this.enemies.boss === null,
                        onComplete: () => {
                            this.showDialogue("Nyx", "TITAN DOWN! Broadcast the liberation code to every screen in the city!");
                        }
                    },
                    {
                        objective: "Initiate Global Override at the Central Console",
                        target: () => this.city.spawns.omnicorpTower,
                        check: () => this.player.pos.distanceTo(this.city.spawns.omnicorpTower) < 8,
                        onComplete: () => {
                            this.completeCampaign();
                        }
                    }
                ]
            }
        ];

        this.startMission(0);
    }

    startMission(index) {
        if (index >= this.missions.length) {
            this.completeCampaign();
            return;
        }

        this.currentMissionIndex = index;
        this.currentStep = 0;
        this.hackProgress = 0;

        const m = this.missions[this.currentMissionIndex];
        if (m.timeLimit) this.missionTimer = m.timeLimit;
        else this.missionTimer = 0;

        this.updateWaypoint();
        this.updateHUD();

        window.soundEngine.playMissionPing();
        this.showDialogue("Nyx", `New Mission: ${m.title}. ${m.desc}`);
    }

    updateWaypoint() {
        const m = this.missions[this.currentMissionIndex];
        if (!m || !m.steps[this.currentStep]) {
            this.waypointGroup.visible = false;
            return;
        }

        const targetPos = m.steps[this.currentStep].target();
        if (targetPos) {
            this.setWaypoint(targetPos);
        }
    }

    setWaypoint(pos) {
        this.waypointPos.copy(pos);
        this.waypointGroup.position.copy(pos);
        this.waypointGroup.visible = true;
    }

    showDialogue(speaker, message) {
        const box = document.getElementById('dialogue-box');
        const speakerEl = document.getElementById('dialogue-speaker');
        const textEl = document.getElementById('dialogue-text');

        if (box && speakerEl && textEl) {
            speakerEl.textContent = speaker.toUpperCase();
            textEl.textContent = message;
            box.classList.remove('hidden');
            window.soundEngine.playDialogueBeep();

            clearTimeout(this.dialogueTimeout);
            this.dialogueTimeout = setTimeout(() => {
                box.classList.add('hidden');
            }, 6500);
        }
    }

    completeCampaign() {
        this.active = false;
        this.waypointGroup.visible = false;
        window.soundEngine.playMissionPing();
        this.showDialogue("SYSTEM", "CYBER CITY OVERRIDE SUCCESSFUL! Freedom broadcast transmitted. Free roam mode unlocked.");
        const winEl = document.getElementById('victory-screen');
        if (winEl) winEl.classList.remove('hidden');
    }

    update(delta) {
        // Rotate waypoint ring and pulse beam
        if (this.waypointGroup.visible) {
            this.waypointRing.rotation.z += 2.0 * delta;
        }

        if (!this.active) return;

        const m = this.missions[this.currentMissionIndex];
        if (!m) return;

        // Timer countdown if applicable
        if (m.timeLimit && this.missionTimer > 0) {
            this.missionTimer -= delta;
            const timerEl = document.getElementById('mission-timer');
            if (timerEl) {
                timerEl.classList.remove('hidden');
                timerEl.textContent = `TIME: ${Math.max(0, Math.ceil(this.missionTimer))}s`;
            }
            if (this.missionTimer <= 0) {
                // Mission failed, restart mission
                this.showDialogue("Nyx", "Signal timed out! Resetting decryption sequence...");
                this.startMission(this.currentMissionIndex);
                return;
            }
        } else {
            const timerEl = document.getElementById('mission-timer');
            if (timerEl) timerEl.classList.add('hidden');
        }

        // Check current step completion
        const step = m.steps[this.currentStep];
        if (step && step.check()) {
            if (step.onComplete) step.onComplete();

            this.currentStep++;
            if (this.currentStep >= m.steps.length) {
                // Completed full mission!
                window.soundEngine.playMissionPing();
                this.startMission(this.currentMissionIndex + 1);
            } else {
                this.updateWaypoint();
                this.updateHUD();
            }
        }
    }

    updateHUD() {
        const titleEl = document.getElementById('mission-title');
        const objEl = document.getElementById('mission-objective');

        const m = this.missions[this.currentMissionIndex];
        if (m && m.steps[this.currentStep]) {
            if (titleEl) titleEl.textContent = m.title;
            if (objEl) objEl.textContent = `▶ ${m.steps[this.currentStep].objective}`;
        } else if (!this.active) {
            if (titleEl) titleEl.textContent = "FREE ROAM: CYBER CITIZEN";
            if (objEl) objEl.textContent = "Explore Cyber City & dominate corporate forces.";
        }
    }
}
