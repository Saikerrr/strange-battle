// Shared context keeps the current fighters and services visible without circular imports.
export function register(sbContext) {
  sbContext.updateDrones_base = function (dt) {
    for (let i = sbContext.drones.length - 1; i >= 0; i--) {
      const d = sbContext.drones[i];
      d.life -= dt;
      d.rotor += dt * 30;
      if (d.target && !d.target.dead) {
        const tx = d.target.x,
          ty = d.target.y - 170;
        const dx = tx - d.x,
          dy = ty - d.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 5) {
          const sp = Math.min(dist, 400 * dt);
          d.x += (dx / dist) * sp;
          d.y += (dy / dist) * sp;
        }
        d.fireTimer -= dt;
        if (d.fireTimer <= 0 && d.life > 0) {
          d.fireTimer = 0.4;
          const hx = d.target.x,
            hy = d.target.y - 80;
          const fdx = hx - d.x,
            fdy = hy - d.y;
          const fd = Math.hypot(fdx, fdy) || 1;
          sbContext.projectiles.push({
            x: d.x,
            y: d.y,
            vx: (fdx / fd) * 1200,
            vy: (fdy / fd) * 1200,
            r: 5,
            damage: 3,
            owner: d.owner,
            color: "#ffcc00",
            type: "drone_bullet",
            trail: [],
          });
          sbContext.playSound(700, 0.03, "square", 0.03);
        }
      }
      if (d.life <= 0) {
        if (
          d.ultBomb &&
          d.target &&
          d.target.hp > 0 &&
          Math.hypot(d.target.x - d.x, d.target.y - d.y) < 220
        ) {
          d.target.takeDamage(12, d.owner.facing);
          sbContext.spawnHitSparks(d.x, d.y, "#ffcc44");
        }
        sbContext.spawnExplosion(d.x, d.y);
        sbContext.drones.splice(i, 1);
      }
    }
  };

  sbContext.updateBears_base = function (dt) {
    for (let i = sbContext.bears.length - 1; i >= 0; i--) {
      const b = sbContext.bears[i];
      b.life -= dt;
      b.animTime += dt;
      if (b.carrying) {
        b.x += b.vx * dt;
        b.carrying.x = b.x + b.facing * 35;
        b.carrying.y = b.y;
        b.carrying.state = "carried";
        b.carrying.hp -= 12 * dt;
        if (b.carrying.hp <= 0) {
          b.carrying.hp = 0;
          b.carrying.state = "ko";
          b.carrying.carried = false;
          b.carrying.vx = b.facing * 400;
          b.carrying = null;
          b.life = 0;
          sbContext.doShake(25, 0.4);
          sbContext.playSound(100, 0.6, "sawtooth", 0.15);
          for (let k = 0; k < 3; k++) sbContext.killRandomSpectator();
        }
      } else {
        b.x += b.vx * dt;
        if (!b.target.carried && b.target.hp > 0) {
          const hb = { x: b.x + b.facing * 40, y: b.y - 70, r: 90 };
          if (sbContext.circleOverlap(hb, b.target.getHurtbox())) {
            b.carrying = b.target;
            b.target.carried = true;
            b.target.state = "carried";
            b.target.vx = 0;
            b.target.vy = 0;
            b.life = 1.0;
            sbContext.spawnHitSparks(b.x, b.y - 70, "#ffaa44");
            sbContext.doShake(15, 0.3);
            sbContext.playSound(80, 0.3, "sawtooth", 0.15);
            for (let k = 0; k < 2; k++) sbContext.killRandomSpectator();
          }
        }
      }
      if (b.x < sbContext.ARENA_LEFT + 80 || b.x > sbContext.ARENA_RIGHT - 80)
        b.life = 0;
      if (b.life <= 0) {
        if (b.carrying && !b.carrying.dead) {
          b.carrying.carried = false;
          b.carrying.hitstun = 0.5;
          b.carrying.state = "hit";
          b.carrying.vx = b.facing * 400;
          b.carrying.hp -= 8;
          if (b.carrying.hp <= 0) {
            b.carrying.hp = 0;
            b.carrying.state = "ko";
            b.carrying.vx = b.facing * 400;
          }
          sbContext.spawnHitSparks(b.carrying.x, b.carrying.y - 60, "#ffaa44");
          sbContext.doShake(12, 0.25);
        }
        sbContext.bears.splice(i, 1);
      }
    }
  };

  sbContext.updateBombs_base = function (dt) {
    for (let i = sbContext.bombs.length - 1; i >= 0; i--) {
      const b = sbContext.bombs[i];
      b.life -= dt;
      b.vy += 1400 * dt;
      b.y += b.vy * dt;
      b.x += b.vx * dt;
      b.spin += dt * 8;
      if (!b.exploded) {
        const hb = { x: b.x, y: b.y, r: 22 };
        if (
          b.target &&
          !b.target.dead &&
          sbContext.circleOverlap(hb, b.target.getHurtbox())
        ) {
          b.target.takeDamage(b.damage, Math.sign(b.vx) || 1);
          b.target.hitstun = Math.max(b.target.hitstun, 0.25);
          b.exploded = true;
          sbContext.spawnExplosion(b.x, b.y);
          b.life = 0;
          sbContext.playSound(150, 0.2, "sawtooth", 0.1);
        }
        if (!b.exploded && b.y >= sbContext.GROUND_Y) {
          b.exploded = true;
          sbContext.spawnExplosion(b.x, sbContext.GROUND_Y);
          b.life = 0;
        }
        if (!b.exploded) {
          for (const plat of sbContext.platforms) {
            if (
              b.x > plat.x &&
              b.x < plat.x + plat.w &&
              b.y > plat.y &&
              b.y < plat.y + 20
            ) {
              b.exploded = true;
              sbContext.spawnExplosion(b.x, plat.y);
              b.life = 0;
              break;
            }
          }
        }
      }
      if (b.life <= 0) sbContext.bombs.splice(i, 1);
    }
  };

  sbContext.updateProjectiles_base = function (dt) {
    for (let i = sbContext.projectiles.length - 1; i >= 0; i--) {
      const p = sbContext.projectiles[i];
      if (p.type === "missile" && p.target && !p.target.dead) {
        const dx = p.target.x - p.x,
          dy = p.target.y - 80 - p.y;
        const d = Math.hypot(dx, dy) || 1;
        const speed = Math.min(900, 200 + (1 - d / 1000) * 400);
        p.vx = (dx / d) * speed;
        p.vy = (dy / d) * speed;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > 14) p.trail.shift();

      const target = p.owner === sbContext.p1 ? sbContext.p2 : sbContext.p1;
      let hit = false;

      if (
        sbContext.circleOverlap({ x: p.x, y: p.y, r: p.r }, target.getHurtbox())
      ) {
        if (p.type === "blockade" || p.type === "blockade_ult") {
          target.takeDamage(p.damage, Math.sign(p.vx) || 1);
          if (p.type === "blockade_ult") {
            target.blockadeStunTicks = 3;
            target.blockadeStunTimer = 1;
          }
          target.vx *= 0.3;
          target.hitstun = Math.min(target.hitstun, 0.15);
          if (target.ultTimer > 0) {
            sbContext.particles.push({
              x: target.x,
              y: target.y - 200,
              vx: 0,
              vy: -40,
              life: 1.0,
              maxLife: 1.0,
              color: "#88ff44",
              size: 22,
              isText: true,
              text: "ИММУНИТЕТ!",
            });
          } else {
            target.blockedTimer = 5;
            sbContext.particles.push({
              x: target.x,
              y: target.y - 200,
              vx: 0,
              vy: -40,
              life: 1.2,
              maxLife: 1.2,
              color: "#cc66ff",
              size: 26,
              isText: true,
              text: "БЛОКИРОВКА!",
            });
          }
          sbContext.spawnHitSparks(p.x, p.y, "#cc66ff");
          sbContext.doShake(8, 0.15);
          sbContext.playSound(200, 0.15, "sawtooth", 0.1);
        } else if (p.type === "flag") {
          target.takeDamage(p.damage, Math.sign(p.vx) || 1);
          target.bleedTimer = p.isUltFlag ? 4.0 : 3.0;
          target.bleedTickTimer = 0.5;
          sbContext.spawnHitSparks(p.x, p.y, "#d52b1e");
          sbContext.doShake(8, 0.15);
          sbContext.playSound(400, 0.1, "triangle", 0.1);
        } else {
          const hpBeforeHit = target.hp;
          target.takeDamage(p.damage, Math.sign(p.vx) || 1);
          if (p.type === "missile" && p.healOwnerOnHit && p.owner) {
            const dealt = Math.max(0, hpBeforeHit - target.hp);
            p.owner.hp = Math.min(p.owner.maxHp, p.owner.hp + dealt);
            if (dealt > 0)
              sbContext.particles.push({
                x: p.owner.x,
                y: p.owner.y - 145,
                vx: 0,
                vy: -35,
                life: 0.8,
                maxLife: 0.8,
                color: "#66ff88",
                size: 20,
                isText: true,
                text: "+" + Math.ceil(dealt) + " HP",
              });
          }
          if (p.type === "missile") {
            sbContext.spawnExplosion(p.x, p.y);
            sbContext.doShake(18, 0.25);
            sbContext.flash("rgba(255,150,0,0.4)");
          } else sbContext.spawnHitSparks(p.x, p.y, p.color);
          sbContext.doShake(14, 0.2);
          sbContext.hitStopTimer = 0.08;
          for (const c of sbContext.crowd) c.excited = 2;
        }
        hit = true;
      }
      if (
        hit ||
        p.x < -50 ||
        p.x > sbContext.ARENA_RIGHT + 50 ||
        p.y < -500 ||
        p.y > 900
      )
        sbContext.projectiles.splice(i, 1);
    }
  };

  sbContext.updateBears_arena = function (dt) {
    const ultBears = sbContext.bears.filter((b) => b.isUlt);
    for (let i = sbContext.bears.length - 1; i >= 0; i--)
      if (sbContext.bears[i].isUlt) sbContext.bears.splice(i, 1);
    sbContext.updateBears_base(dt);
    for (const b of ultBears) {
      b.animTime += dt;
      b.life -= dt;
      if (b.phase === "run") {
        b.x += b.vx * dt;
        if (
          b.target &&
          b.target.hp > 0 &&
          !b.target.carried &&
          sbContext.circleOverlap(
            { x: b.x + b.facing * 55, y: b.y - 80, r: 110 },
            b.target.getHurtbox(),
          )
        ) {
          b.carrying = b.target;
          b.target.carried = true;
          b.target.state = "carried";
          b.target.vx = 0;
          b.target.vy = 0;
          b.phase = "bite";
          b.biteTimer = 1.5;
          b.biteTick = 0.5;
          b.life = 2.0;
          b.vx = 0;
          sbContext.spawnHitSparks(b.x, b.y - 80, "#ffb45b");
          sbContext.doShake(8, 0.2);
        }
        if (b.x < sbContext.ARENA_LEFT + 80 || b.x > sbContext.ARENA_RIGHT - 80)
          b.life = 0;
      } else if (b.phase === "bite" && b.carrying) {
        b.biteTimer -= dt;
        b.biteTick -= dt;
        b.x += b.facing * 130 * dt;
        b.carrying.x = b.x + b.facing * 45;
        b.carrying.y = b.y;
        if (b.biteTick <= 0) {
          b.biteTick = 0.5;
          b.carrying.takeDamage(5, b.facing);
          sbContext.spawnHitSparks(b.carrying.x, b.carrying.y - 65, "#ffb45b");
        }
        if (b.biteTimer <= 0) {
          b.carrying.carried = false;
          b.carrying.hitstun = 0.35;
          b.carrying.vx = b.facing * 420;
          b.carrying = null;
          b.life = 0;
        }
      }
      if (b.life <= 0) {
        if (b.carrying) {
          b.carrying.carried = false;
          b.carrying.hitstun = 0.35;
          b.carrying.vx = b.facing * 420;
        }
      } else sbContext.bears.push(b);
    }
  };

  sbContext.updateEagles_interface = function (dt) {
    for (let i = sbContext.eagles.length - 1; i >= 0; i--) {
      const e = sbContext.eagles[i];
      e.timer += dt;
      if (e.target) {
        e.facing = e.target.x >= e.owner.x ? 1 : -1;
        if (e.state === "swoop") {
          e.x = e.target.x + (e.laneOffset || 0);
          e.y += 1500 * dt;
          if (e.y >= e.target.y - 80) {
            e.target.takeDamage(10, e.facing);
            sbContext.spawnHitSparks(e.x, e.y, "#ffdd00");
            e.state = "fly";
            e.vy = -800;
          }
        } else {
          e.y += e.vy * dt;
          e.vy -= 500 * dt;
          e.x += (e.owner.x - e.x) * dt * 2;
          if (e.timer > 3) sbContext.eagles.splice(i, 1);
        }
      } else if (e.timer > 3) sbContext.eagles.splice(i, 1);
    }
  };

  sbContext.updateBears_interface = function (dt) {
    const special = sbContext.bears.filter((b) => b.isUlt);
    for (let i = sbContext.bears.length - 1; i >= 0; i--)
      if (sbContext.bears[i].isUlt) sbContext.bears.splice(i, 1);
    sbContext.updateBears_arena(dt);
    for (const b of special) {
      b.animTime += dt;
      b.life -= dt;
      if (b.phase === "run") {
        b.x += b.vx * dt;
        if (
          b.target &&
          b.target.hp > 0 &&
          !b.target.carried &&
          sbContext.circleOverlap(
            { x: b.x + b.facing * 55, y: b.y - 80, r: 110 },
            b.target.getHurtbox(),
          )
        ) {
          b.carrying = b.target;
          b.target.carried = true;
          b.target.state = "carried";
          b.target.vx = 0;
          b.target.vy = 0;
          b.phase = "drag";
          b.dragTimer = 0.55;
          b.biteTimer = 1.5;
          b.biteTick = 0.5;
          b.vx = b.facing * 430;
          sbContext.spawnHitSparks(b.x, b.y - 80, "#ffb45b");
          sbContext.doShake(8, 0.2);
        }
      } else if (b.phase === "drag" && b.carrying) {
        b.dragTimer -= dt;
        b.x += b.vx * dt;
        b.carrying.x = b.x + b.facing * 45;
        b.carrying.y = b.y;
        b.carrying.carried = true;
        if (b.dragTimer <= 0) {
          b.phase = "bite";
          b.vx = 0;
          sbContext.sbSparkText(b.x, b.y - 160, "КУСЬ!", "#ffb45b");
        }
      } else if (b.phase === "bite" && b.carrying) {
        b.biteTimer -= dt;
        b.biteTick -= dt;
        b.carrying.x = b.x + b.facing * 45;
        b.carrying.y = b.y;
        b.carrying.carried = true;
        if (b.biteTick <= 0) {
          b.biteTick = 0.5;
          b.carrying.takeDamage(5, b.facing);
          sbContext.spawnHitSparks(b.carrying.x, b.carrying.y - 65, "#ffb45b");
        }
        if (b.biteTimer <= 0) {
          b.carrying.carried = false;
          b.carrying.hitstun = 0.35;
          b.carrying.vx = b.facing * 420;
          b.carrying = null;
          b.life = 0;
        }
      }
      if (b.life <= 0) {
        if (b.carrying) {
          b.carrying.carried = false;
          b.carrying.hitstun = 0.35;
          b.carrying.vx = b.facing * 420;
        }
      } else sbContext.bears.push(b);
    }
  };
}
