// Cyber City - Procedural Web Audio API Sound Engine
// Generates all SFX and Synthwave Radio music in real-time without external audio files.

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.engineOsc = null;
        this.engineGain = null;
        this.initialized = false;

        // Music state
        this.musicPlaying = false;
        this.currentTrack = 0;
        this.tempo = 120;
        this.step = 0;
        this.musicTimer = null;
        this.tracks = [
            { name: "Neon Skyline", tempo: 118, bassPattern: [36, 36, 48, 36, 41, 36, 43, 41], leadScale: [60, 63, 65, 67, 70, 72] },
            { name: "Cyber Drift", tempo: 128, bassPattern: [33, 33, 45, 33, 38, 33, 40, 38], leadScale: [57, 60, 62, 65, 69, 72] },
            { name: "Overdrive Protocol", tempo: 135, bassPattern: [31, 31, 43, 31, 36, 31, 38, 36], leadScale: [55, 58, 62, 65, 67, 70] }
        ];
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();

            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.8;
            this.masterGain.connect(this.ctx.destination);

            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = 0.35;
            this.musicGain.connect(this.masterGain);

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = 0.6;
            this.sfxGain.connect(this.masterGain);

            this.initEngineSound();
            this.initialized = true;
            this.startMusic();
        } catch (e) {
            console.warn("Web Audio not supported or blocked", e);
        }
    }

    // Vehicle engine sound synthesis
    initEngineSound() {
        if (!this.ctx) return;
        this.engineOsc = this.ctx.createOscillator();
        this.engineOsc.type = 'sawtooth';
        this.engineOsc.frequency.setValueAtTime(45, this.ctx.currentTime);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(280, this.ctx.currentTime);

        this.engineGain = this.ctx.createGain();
        this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);

        this.engineOsc.connect(filter);
        filter.connect(this.engineGain);
        this.engineGain.connect(this.sfxGain);

        this.engineOsc.start();
    }

    updateEngineSound(speedRatio, inVehicle) {
        if (!this.engineGain || !this.ctx) return;
        if (!inVehicle) {
            this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
            return;
        }
        const targetFreq = 40 + Math.abs(speedRatio) * 160;
        const targetVol = 0.12 + Math.abs(speedRatio) * 0.15;
        this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.08);
        this.engineGain.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.08);
    }

    // Procedural Synthwave Radio Music Player
    startMusic() {
        if (!this.ctx || this.musicPlaying) return;
        this.musicPlaying = true;
        this.step = 0;
        this.scheduleMusicStep();
    }

    toggleMusic() {
        if (!this.initialized) {
            this.init();
            return;
        }
        if (this.musicPlaying) {
            this.musicPlaying = false;
            clearTimeout(this.musicTimer);
        } else {
            this.startMusic();
        }
    }

    nextTrack() {
        this.currentTrack = (this.currentTrack + 1) % this.tracks.length;
        this.step = 0;
        return this.tracks[this.currentTrack].name;
    }

    getCurrentTrackName() {
        return this.tracks[this.currentTrack].name;
    }

    scheduleMusicStep() {
        if (!this.musicPlaying || !this.ctx) return;

        const track = this.tracks[this.currentTrack];
        const stepTime = (60 / track.tempo) / 4; // 16th note
        const t = this.ctx.currentTime;

        // Kick on 0, 4, 8, 12
        if (this.step % 4 === 0) {
            this.playKick(t);
        }

        // Snare on 4, 12
        if (this.step % 8 === 4) {
            this.playSnare(t);
        }

        // Hihat on every offbeat
        if (this.step % 2 === 1) {
            this.playHihat(t);
        }

        // Bassline on 16th notes
        const bassNote = track.bassPattern[(this.step >> 1) % track.bassPattern.length];
        if (this.step % 2 === 0) {
            this.playSynthBass(t, this.midiToFreq(bassNote), stepTime * 1.5);
        }

        // Arpeggiated Cyber Lead
        if (this.step % 2 === 0 && Math.random() > 0.3) {
            const leadNote = track.leadScale[Math.floor(Math.random() * track.leadScale.length)];
            this.playSynthLead(t, this.midiToFreq(leadNote), stepTime * 1.2);
        }

        this.step = (this.step + 1) % 64;
        this.musicTimer = setTimeout(() => this.scheduleMusicStep(), stepTime * 1000);
    }

    midiToFreq(m) {
        return 440 * Math.pow(2, (m - 69) / 12);
    }

    playKick(t) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(35, t + 0.12);
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(t);
        osc.stop(t + 0.16);
    }

    playSnare(t) {
        // Noise buffer
        const bufferSize = this.ctx.sampleRate * 0.12;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1000, t);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        noise.start(t);
    }

    playHihat(t) {
        const osc = this.ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(9000, t);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(t);
        osc.stop(t + 0.05);
    }

    playSynthBass(t, freq, duration) {
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, t);
        filter.frequency.exponentialRampToValueAtTime(120, t + duration);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        osc.start(t);
        osc.stop(t + duration);
    }

    playSynthLead(t, freq, duration) {
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(t);
        osc.stop(t + duration);
    }

    // 15 Distinct Procedural Weapon SFX
    playWeaponSound(weaponId) {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;

        switch (weaponId) {
            case 0: // Neon Striker (Pistol)
                this.playTone(850, 180, 'sine', 0.12, 0.35);
                break;
            case 1: // Pulse-9 SMG (Rapid Plasma)
                this.playTone(1100, 320, 'sawtooth', 0.07, 0.25);
                break;
            case 2: // Viper Cyber-AR (Burst)
                this.playTone(600, 140, 'square', 0.1, 0.3);
                break;
            case 3: // Scatter-Tech 12 (Shotgun)
                this.playNoiseBlast(0.22, 0.5, 400);
                this.playTone(180, 50, 'sawtooth', 0.2, 0.4);
                break;
            case 4: // Specter Rail-Sniper (Hyper Piercing)
                this.playTone(2200, 80, 'sine', 0.45, 0.5);
                this.playNoiseBlast(0.15, 0.3, 1200);
                break;
            case 5: // Arc Caster (Tesla)
                this.playZap(0.18);
                break;
            case 6: // Plasma Flamethrower (Sizzle)
                this.playHiss(0.15);
                break;
            case 7: // Micro-Missile Pod
                this.playTone(300, 900, 'triangle', 0.25, 0.35);
                break;
            case 8: // Vortex Grenade Launcher
                this.playThump(0.3);
                break;
            case 9: // Katana "Zero" (Slash)
                this.playSlash(0.15);
                break;
            case 10: // Thermal Beam Cannon
                this.playHum(0.12);
                break;
            case 11: // EMP Disruptor
                this.playEmpWave(0.35);
                break;
            case 12: // Tachyon Minigun
                this.playTone(450, 90, 'square', 0.05, 0.35);
                break;
            case 13: // Singularity Rifle
                this.playSingularity(0.4);
                break;
            case 14: // Cyber-Nuke Launcher
                this.playNukeLaunch(0.6);
                break;
            default:
                this.playTone(500, 200, 'sine', 0.1, 0.2);
        }
    }

    playTone(startFreq, endFreq, type, duration, vol) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        const t = this.ctx.currentTime;
        osc.frequency.setValueAtTime(startFreq, t);
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), t + duration);
        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + duration);
    }

    playNoiseBlast(duration, vol, cutoff) {
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(cutoff, this.ctx.currentTime);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        noise.start();
    }

    playZap(duration) {
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(300, this.ctx.currentTime + duration);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playHiss(duration) {
        this.playNoiseBlast(duration, 0.25, 2500);
    }

    playThump(duration) {
        this.playTone(120, 30, 'sine', duration, 0.45);
    }

    playSlash(duration) {
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + duration);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playHum(duration) {
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, this.ctx.currentTime);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playEmpWave(duration) {
        this.playTone(2000, 60, 'sine', duration, 0.4);
    }

    playSingularity(duration) {
        this.playTone(80, 480, 'sine', duration, 0.5);
    }

    playNukeLaunch(duration) {
        this.playTone(180, 800, 'sawtooth', duration, 0.6);
        this.playNoiseBlast(duration, 0.4, 600);
    }

    playExplosion() {
        if (!this.ctx) return;
        this.playNoiseBlast(0.65, 0.65, 450);
        this.playTone(160, 25, 'sine', 0.5, 0.7);
    }

    playMissionPing() {
        if (!this.ctx) return;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, High C
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                this.playTone(freq, freq * 0.95, 'sine', 0.15, 0.25);
            }, idx * 90);
        });
    }

    playDialogueBeep() {
        if (!this.ctx) return;
        this.playTone(700 + Math.random() * 200, 600, 'sine', 0.04, 0.12);
    }

    playNitro() {
        if (!this.ctx) return;
        this.playNoiseBlast(0.4, 0.35, 1800);
        this.playTone(200, 600, 'triangle', 0.4, 0.3);
    }

    playTireScreech() {
        if (!this.ctx) return;
        this.playTone(950 + Math.random() * 200, 850, 'sawtooth', 0.12, 0.15);
    }
}

// Global Sound Engine Instance
window.soundEngine = new SoundEngine();
