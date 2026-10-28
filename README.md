# 🌆 CYBER CITY 2099

An in-browser, high-octane 3D cyberpunk open-world game built with **Three.js** and **WebGL**. Drive high-performance neon sports cars, wield an arsenal of 15 futuristic energy weapons, complete story missions against the OmniCorp Megacorporation, and liberate Cyber City.

---

## 🎮 Playable Features

- **Drivable Cyber Sports Car**: Realistic arcade vehicle physics with acceleration, high-speed drifting, nitro boost (`Shift`), headlights, and neon underglow.
- **On-Foot Operative**: 3rd-person & 1st-person camera modes, sprinting, jumping, dynamic cyber-shield regeneration, and fluid weapon aiming.
- **Procedural Cyberpunk City**: 800m × 800m city grid with illuminated skyscrapers, holographic animated neon billboards, streetlights, and collision physics.
- **GTA-Style Minimap**: Real-time 2D radar displaying roads, player heading, sports car location, mission objective waypoints, and hostile enemy blips.
- **Wanted Level System**: 1 to 5 Cyber-Stars triggering relentless OmniCorp surveillance drones and police interceptors.
- **Procedural Web Audio Engine**: Zero external audio files required! Synthesizes vehicle engine revving, tire screeches, 15 weapon firing SFX, explosions, and a 3-track retro Synthwave Radio station in real-time.

---

## ⚡ 15 Cyberpunk Weapons Arsenal

| # | Weapon | Class | Damage | Special Trait |
|---|---|---|---|---|
| **1** | **Neon Striker** | Pistol | 30 | High-precision semi-auto cyan energy sidearm (infinite ammo) |
| **2** | **Pulse-9 SMG** | SMG | 18 | Rapid-fire purple plasma sprayer for close quarters |
| **3** | **Viper Cyber-AR** | Assault Rifle | 32 | Holographic assault rifle firing high-velocity green rounds |
| **4** | **Scatter-Tech 12** | Shotgun | 16 × 8 | Heavy ion scattergun firing 8 kinetic pellets with massive knockback |
| **5** | **Specter Rail-Sniper**| Sniper | 190 | Instant piercing red hitscan laser beam |
| **6** | **Arc Caster** | Tesla | 55 | Discharges branching chain lightning jumping to nearby hostiles |
| **7** | **Plasma Flamethrower**| Pyro | 14/tick| Continuous torrent of superheated pink/cyan plasma stream |
| **8** | **Micro-Missile Pod** | Launcher | 75 | Fires salvos of spiraling micro-rockets that track target drones |
| **9** | **Vortex Grenade Cannon**| Grenade | 130 | Bouncing gravity grenades detonating with localized implosion |
| **10**| **Katana "Zero"** | Melee | 120 | High-frequency cyber blade delivering lethal slashing waves |
| **11**| **Thermal Beam Cannon**| Beam | 16/tick| Sustained scorching laser beam melting enemy armor |
| **12**| **EMP Disruptor** | Shockwave | 85 | Expanding holographic EMP dome disabling robotic units |
| **13**| **Tachyon Minigun** | Heavy | 24 | Six-barrel rotary cannon delivering devastating bullet storms |
| **14**| **Singularity Rifle** | Vortex | 180 | Dark-matter orb that pulls enemies into its vortex core |
| **15**| **Cyber-Nuke Launcher** | Super | 550 | Tactical shoulder-fired mini nuclear warhead wiping the block |

---

## 📜 Story Campaign: "NEON SYNDICATE: OVERRIDE"

Take on the role of **Kaelen Voss**, an ex-operative betrayed by OmniCorp Director Vane:

1. **Mission 1: The Awakening**  
   Retrieve your hidden cyber weapon cache from the back alley, neutralize 3 scout drones, and commandeer your cyber sports car.
2. **Mission 2: Neon Courier**  
   Race through 5 transmission relay checkpoints across the city before the 85-second encryption countdown expires while evading police cruisers.
3. **Mission 3: The Data Purge**  
   Infiltrate the OmniCorp Sub-Station, eliminate the heavy guard squad, and hold the hack terminal to upload the surveillance kill-code.
4. **Mission 4: Highway Overdrive**  
   Intercept and destroy an armored OmniCorp military convoy in a high-speed vehicle firefight to secure prototype weapons.
5. **Mission 5: Apex Protocol (Final Override)**  
   Assault Central OmniCorp Tower, destroy the 12-meter tall **Apex Titan-Mech**, and broadcast the liberation override signal!
6. **Free Roam Mode**: Endless sandbox exploration, vehicle drifting, and combat across Cyber City.

---

## 🕹️ Controls

| Action | Key / Control |
|---|---|
| **Move / Steer Car** | `W`, `A`, `S`, `D` or Arrow Keys |
| **Aim / Look** | Mouse (Click canvas to lock pointer) |
| **Fire Weapon / Attack** | Left Mouse Button |
| **Enter / Exit Vehicle** | `E` or `F` |
| **Nitro Boost (In Car)** | `Shift` (Hold) |
| **Handbrake Drift (In Car)** | `Space` (Hold while turning) |
| **Sprint (On Foot)** | `Shift` (Hold) |
| **Jump (On Foot)** | `Space` |
| **Toggle 1st / 3rd Person** | `V` |
| **Select Weapons 1–15** | Keys `1` to `9`, `0`, `-`, `=`, Mouse Wheel, or HUD buttons |
| **Next Radio Track** | `R` (Cycles through 3 synthwave tracks) |
| **Mute / Unmute Radio** | `M` |

---

## 🚀 How to Run Locally

Because all 3D geometry, neon textures, and audio synthesis are generated procedurally in pure JavaScript, **no build step, Node.js, or server installation is required**:

1. Open `index.html` directly in any modern browser (Chrome, Edge, Firefox, Brave).
2. Alternatively, serve via any local web server:
   ```bash
   npx serve .
   # or
   python -m http.server 8000
   ```
3. Click anywhere on the screen to lock the mouse pointer and activate the audio synthesizer!

---

## 🌐 Deploy to GitHub Pages

1. Push this repository to GitHub.
2. Go to your repository **Settings** → **Pages**.
3. Under **Branch**, select `main` (or `master`) and `/root`, then click **Save**.
4. Your 3D Cyber City game is live worldwide!

---

## 📄 License

MIT License. Free for personal, educational, and commercial game development use.
