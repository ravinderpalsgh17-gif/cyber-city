// Cyber City - GTA-Style Minimap Radar HUD
// Real-time canvas radar rendering player heading, sports car, mission waypoints, and hostile blips.

class Minimap {
    constructor(player, vehicle, enemies, missions) {
        this.player = player;
        this.vehicle = vehicle;
        this.enemies = enemies;
        this.missions = missions;

        this.canvas = document.getElementById('minimap-canvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.width = this.canvas.width;
            this.height = this.canvas.height;
            this.radarRadius = this.width / 2;
            this.zoom = 0.85; // Scale factor (pixels per meter)
        }
    }

    render() {
        if (!this.ctx) return;
        const ctx = this.ctx;
        const cx = this.width / 2;
        const cy = this.height / 2;

        ctx.clearRect(0, 0, this.width, this.height);

        // Circular Radar Clipping Path
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, this.radarRadius - 4, 0, Math.PI * 2);
        ctx.clip();

        // Dark holographic background
        ctx.fillStyle = '#060a16';
        ctx.fillRect(0, 0, this.width, this.height);

        // Grid rings
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, 35, 0, Math.PI * 2);
        ctx.arc(cx, cy, 70, 0, Math.PI * 2);
        ctx.stroke();

        const playerPos = this.player.pos;
        const yaw = this.player.inVehicle && this.vehicle ? this.vehicle.heading : this.player.yaw;

        // Draw City Roads relative to player position
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
        ctx.lineWidth = 12;
        const step = 94; // block size + road width
        const range = 240;

        for (let x = -400; x <= 400; x += step) {
            const relX = (x - playerPos.x) * this.zoom;
            ctx.beginPath();
            ctx.moveTo(cx + relX, 0);
            ctx.lineTo(cx + relX, this.height);
            ctx.stroke();
        }

        for (let z = -400; z <= 400; z += step) {
            const relY = (z - playerPos.z) * this.zoom;
            ctx.beginPath();
            ctx.moveTo(0, cy + relY);
            ctx.lineTo(this.width, cy + relY);
            ctx.stroke();
        }

        // Draw Mission Waypoint Blip
        if (this.missions.waypointGroup.visible) {
            const wp = this.missions.waypointPos;
            const dx = (wp.x - playerPos.x) * this.zoom;
            const dy = (wp.z - playerPos.z) * this.zoom;
            const dist = Math.hypot(dx, dy);

            // Clamp blip to radar edge if far away
            let blipX = cx + dx;
            let blipY = cy + dy;
            if (dist > this.radarRadius - 16) {
                const angle = Math.atan2(dy, dx);
                blipX = cx + Math.cos(angle) * (this.radarRadius - 16);
                blipY = cy + Math.sin(angle) * (this.radarRadius - 16);
            }

            ctx.fillStyle = '#ffea00';
            ctx.shadowColor = '#ffea00';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(blipX, blipY, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Draw Vehicle Blip (if not occupied)
        if (!this.player.inVehicle && this.vehicle) {
            const vx = cx + (this.vehicle.pos.x - playerPos.x) * this.zoom;
            const vy = cy + (this.vehicle.pos.z - playerPos.z) * this.zoom;
            if (Math.hypot(vx - cx, vy - cy) < this.radarRadius - 8) {
                ctx.fillStyle = '#00f0ff';
                ctx.fillRect(vx - 4, vy - 4, 8, 8);
            }
        }

        // Draw Hostile Enemy Blips
        for (let i = 0; i < this.enemies.enemies.length; i++) {
            const e = this.enemies.enemies[i];
            const ex = cx + (e.pos.x - playerPos.x) * this.zoom;
            const ey = cy + (e.pos.z - playerPos.z) * this.zoom;

            if (Math.hypot(ex - cx, ey - cy) < this.radarRadius - 8) {
                ctx.fillStyle = e.type === 'boss' ? '#ffea00' : '#ff0055';
                ctx.shadowColor = ctx.fillStyle;
                ctx.shadowBlur = 6;
                const size = e.type === 'boss' ? 7 : (e.type === 'interceptor' ? 5 : 3.5);
                ctx.beginPath();
                ctx.arc(ex, ey, size, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }

        // Draw Player Arrow in Center
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-yaw + Math.PI);

        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(0, -9);
        ctx.lineTo(6, 7);
        ctx.lineTo(0, 4);
        ctx.lineTo(-6, 7);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.restore(); // Restore unclipped state

        // Outer Neon Ring Border
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(cx, cy, this.radarRadius - 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
}
