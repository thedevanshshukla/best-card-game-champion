// Aetherbound: Runes of the Void - HTML5 Canvas Rendering Engine
// Module: renderer.js

import { ELEMENTS, GAME_CONFIG } from './config.js';

export class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = GAME_CONFIG.CANVAS_WIDTH;
    this.height = GAME_CONFIG.CANVAS_HEIGHT;

    // Animation variables
    this.runicRotation = 0;
    this.ambientParticles = this.createAmbientParticles(45);
    this.burstParticles = [];
    this.floatingTexts = [];
  }

  createAmbientParticles(count) {
    const particles = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: Math.random() * 2 + 1,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: -Math.random() * 0.5 - 0.2,
        alpha: Math.random() * 0.6 + 0.2,
        color: ['#00D2FF', '#FF3366', '#00E676', '#C084FC', '#FACC15'][Math.floor(Math.random() * 5)],
      });
    }
    return particles;
  }

  addBurstParticles(x, y, color, count = 18) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      this.burstParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 3 + 2,
        color,
        alpha: 1.0,
        decay: Math.random() * 0.03 + 0.02,
      });
    }
  }

  addFloatingText(text, x, y, color = '#FFFFFF', fontSize = 24) {
    this.floatingTexts.push({
      text,
      x,
      y,
      color,
      fontSize,
      alpha: 1.0,
      vy: -1.4,
    });
  }

  updateAnimations(delta = 0.016) {
    this.runicRotation += delta * 0.25;

    // Update ambient particles
    this.ambientParticles.forEach((p) => {
      p.x += p.speedX;
      p.y += p.speedY;
      if (p.y < 0) p.y = this.height;
      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
    });

    // Update burst particles
    for (let i = this.burstParticles.length - 1; i >= 0; i--) {
      const p = this.burstParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        this.burstParticles.splice(i, 1);
      }
    }

    // Update floating text
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 0.015;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  // ==========================================
  // RENDERING SCENES & COMPONENTS
  // ==========================================

  renderTableBackground() {
    const ctx = this.ctx;
    // Deep cosmic felt gradient
    const grad = ctx.createRadialGradient(this.width / 2, this.height / 2, 80, this.width / 2, this.height / 2, 750);
    grad.addColorStop(0, '#16192E');
    grad.addColorStop(0.5, '#0E1020');
    grad.addColorStop(1, '#06070D');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Ornate table border with wood/obsidian inlay
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
    ctx.lineWidth = 4;
    ctx.strokeRect(18, 18, this.width - 36, this.height - 36);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.strokeRect(26, 26, this.width - 52, this.height - 52);

    // Corner ornate brackets
    this.renderCornerBracket(24, 24, 0);
    this.renderCornerBracket(this.width - 24, 24, Math.PI / 2);
    this.renderCornerBracket(this.width - 24, this.height - 24, Math.PI);
    this.renderCornerBracket(24, this.height - 24, -Math.PI / 2);

    // Central Mystic Runic Duel Circle
    ctx.save();
    ctx.translate(this.width / 2, this.height / 2 - 10);
    ctx.rotate(this.runicRotation);

    ctx.strokeStyle = 'rgba(120, 140, 220, 0.12)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 180, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.16)';
    ctx.beginPath();
    ctx.arc(0, 0, 145, 0, Math.PI * 2);
    ctx.stroke();

    // Runic spokes and elemental quadrants
    const quadrants = [
      { glyph: '☼', col: '#FF3366', angle: 0 },
      { glyph: '☽', col: '#00D2FF', angle: Math.PI / 2 },
      { glyph: '✤', col: '#00E676', angle: Math.PI },
      { glyph: '✦', col: '#C084FC', angle: (Math.PI * 3) / 2 },
    ];

    quadrants.forEach((q) => {
      ctx.save();
      ctx.rotate(q.angle);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(30, 0);
      ctx.lineTo(170, 0);
      ctx.stroke();

      ctx.fillStyle = q.col;
      ctx.font = 'bold 22px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(q.glyph, 120, 0);
      ctx.restore();
    });

    ctx.restore();

    // Ambient floating particles
    this.ambientParticles.forEach((p) => {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  renderCornerBracket(x, y, angle) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 30);
    ctx.lineTo(0, 0);
    ctx.lineTo(30, 0);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Renders a player / opponent Health & Status Orb with high polish.
   */
  renderHealthOrb(actor, x, y, isPlayer = true) {
    const ctx = this.ctx;
    const radius = 48;
    const hpRatio = Math.max(0, Math.min(1, actor.hp / GAME_CONFIG.MAX_HP));

    // Outer runic bezel
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius + 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(10, 15, 30, 0.85)';
    ctx.fill();
    ctx.strokeStyle = isPlayer ? '#2563EB' : '#DC2626';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Glowing rim
    ctx.beginPath();
    ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
    ctx.strokeStyle = isPlayer ? 'rgba(56, 189, 248, 0.4)' : 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Health fluid clipping circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.clip();

    // Background of orb
    ctx.fillStyle = '#1A0609';
    ctx.fill();

    // Health fluid fill
    const fluidGrad = ctx.createLinearGradient(x, y + radius, x, y - radius);
    if (isPlayer) {
      fluidGrad.addColorStop(0, '#0284C7');
      fluidGrad.addColorStop(1, '#38BDF8');
    } else {
      fluidGrad.addColorStop(0, '#991B1B');
      fluidGrad.addColorStop(1, '#EF4444');
    }
    ctx.fillStyle = fluidGrad;
    const fillY = y + radius - radius * 2 * hpRatio;
    ctx.fillRect(x - radius, fillY, radius * 2, radius * 2);

    // Specular glass highlight
    const glassGrad = ctx.createLinearGradient(x, y - radius, x, y);
    glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    glassGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = glassGrad;
    ctx.beginPath();
    ctx.ellipse(x, y - radius * 0.45, radius * 0.65, radius * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore(); // end clip

    // HP Numerals
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 6;
    ctx.fillText(`${actor.hp}`, x, y - 2);

    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fillText(`/ ${GAME_CONFIG.MAX_HP} HP`, x, y + 18);
    ctx.shadowBlur = 0;

    // Ward Shield Overlay (if active)
    if (actor.ward > 0) {
      ctx.save();
      ctx.translate(x + 36, y - 30);
      ctx.fillStyle = '#0284C7';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      // Shield path
      ctx.moveTo(0, -14);
      ctx.lineTo(14, -6);
      ctx.lineTo(14, 8);
      ctx.lineTo(0, 18);
      ctx.lineTo(-14, 8);
      ctx.lineTo(-14, -6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`+${actor.ward}`, 0, 1);
      ctx.restore();
    }

    // Status effect badges (Burn, Poison, Freeze)
    let badgeX = x - 40;
    const badgeY = y + 54;
    if (actor.burn > 0) {
      this.renderStatusBadge(badgeX, badgeY, '🔥', actor.burn, '#F97316');
      badgeX += 28;
    }
    if (actor.poison > 0) {
      this.renderStatusBadge(badgeX, badgeY, '☠', actor.poison, '#22C55E');
      badgeX += 28;
    }
    if (actor.freeze > 0) {
      this.renderStatusBadge(badgeX, badgeY, '❄', actor.freeze, '#06B6D4');
      badgeX += 28;
    }

    // Name label
    ctx.fillStyle = isPlayer ? '#93C5FD' : '#FCA5A5';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(actor.name, x + 60, y - 10);

    // Deck & Hand count
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(`Deck: ${actor.deck.length}  |  Hand: ${actor.hand.length}`, x + 60, y + 10);

    ctx.restore();
  }

  renderStatusBadge(x, y, icon, value, color) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${icon}${value}`, x, y);
    ctx.restore();
  }

  /**
   * Renders the glowing Mana Crystals display for the player.
   */
  renderManaBar(currentMana, maxMana, x, y) {
    const ctx = this.ctx;
    ctx.save();
    // Mana Label
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillStyle = '#38BDF8';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`MANA: ${currentMana} / ${maxMana}`, x, y);

    // 10 Mana Diamond Crystals
    const crystalSpacing = 22;
    for (let i = 0; i < GAME_CONFIG.MAX_MANA; i++) {
      const cx = x + 150 + i * crystalSpacing;
      const cy = y;
      const isUnlocked = i < maxMana;
      const isCharged = i < currentMana;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(8, 0);
      ctx.lineTo(0, 9);
      ctx.lineTo(-8, 0);
      ctx.closePath();

      if (isCharged) {
        ctx.fillStyle = '#00D2FF';
        ctx.shadowColor = '#00D2FF';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (isUnlocked) {
        ctx.fillStyle = 'rgba(0, 120, 200, 0.25)';
        ctx.fill();
        ctx.strokeStyle = '#0284C7';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  /**
   * Renders an individual Card with supreme visual clarity and elemental identity.
   */
  renderCard(card, isFacedown = false) {
    const ctx = this.ctx;
    const w = GAME_CONFIG.CARD_WIDTH;
    const h = GAME_CONFIG.CARD_HEIGHT;
    const r = GAME_CONFIG.CARD_RADIUS;
    const elem = ELEMENTS[card.element] || ELEMENTS.SOLAR;

    ctx.save();
    ctx.translate(card.x, card.y);
    ctx.rotate(card.rotation);
    ctx.scale(card.scale, card.scale);
    ctx.globalAlpha = card.alpha;

    // Card drop shadow
    ctx.shadowColor = card.hovered ? elem.glowColor : 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = card.hovered ? 20 : 10;
    ctx.shadowOffsetY = card.hovered ? 10 : 4;

    // Outer Card Body
    this.drawRoundedRect(ctx, -w / 2, -h / 2, w, h, r);
    ctx.fillStyle = elem.darkColor;
    ctx.fill();

    // Metallic Bevel Border
    ctx.lineWidth = card.hovered ? 3.5 : 2;
    ctx.strokeStyle = card.hovered ? '#FFF7ED' : elem.primaryColor;
    ctx.stroke();
    ctx.shadowBlur = 0;

    if (isFacedown) {
      // Opponent card back: mystic runic design
      this.drawCardBack(-w / 2, -h / 2, w, h, r);
      ctx.restore();
      return;
    }

    // Inner card art frame
    const margin = 8;
    const innerW = w - margin * 2;
    const innerH = h - margin * 2;
    this.drawRoundedRect(ctx, -w / 2 + margin, -h / 2 + margin, innerW, innerH, r - 3);
    const innerGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    innerGrad.addColorStop(0, '#1E2238');
    innerGrad.addColorStop(1, '#0F111E');
    ctx.fillStyle = innerGrad;
    ctx.fill();

    // Header: Card Name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(card.name, -w / 2 + 36, -h / 2 + 13);

    // Top-Left: MANA COST BADGE (Highly legible diamond)
    this.renderManaCostBadge(-w / 2 + 18, -h / 2 + 18, card.cost, elem);

    // Top-Right: ELEMENT GLYPH
    ctx.fillStyle = elem.primaryColor;
    ctx.font = 'bold 15px serif';
    ctx.textAlign = 'right';
    ctx.fillText(elem.glyph, w / 2 - 12, -h / 2 + 13);

    // Center: ELEMENT ARTWORK SIGIL
    this.renderCardArtSigil(0, -20, card, elem);

    // Stats bar: Damage, Ward, Heal, Draw icons
    this.renderCardStatsBar(0, 30, card, elem);

    // Description text box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    this.wrapText(ctx, card.description, 0, 68, w - 24, 13);

    // Bottom Rarity gem
    ctx.beginPath();
    ctx.arc(0, h / 2 - 12, 4, 0, Math.PI * 2);
    ctx.fillStyle =
      card.rarity === 'Mythic'
        ? '#F59E0B'
        : card.rarity === 'Epic'
          ? '#A855F7'
          : card.rarity === 'Rare'
            ? '#3B82F6'
            : '#9CA3AF';
    ctx.fill();

    ctx.restore();
  }

  drawCardBack(x, y, w, h, r) {
    const ctx = this.ctx;
    this.drawRoundedRect(ctx, x + 6, y + 6, w - 12, h - 12, r - 2);
    ctx.fillStyle = '#111827';
    ctx.fill();
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Mystic runic star in center
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = '22px serif';
    ctx.fillStyle = '#F59E0B';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✦', 0, 0);
    ctx.restore();
  }

  renderManaCostBadge(x, y, cost, elem) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);

    // Diamond badge
    ctx.beginPath();
    ctx.moveTo(0, -13);
    ctx.lineTo(13, 0);
    ctx.lineTo(0, 13);
    ctx.lineTo(-13, 0);
    ctx.closePath();

    ctx.fillStyle = '#0284C7';
    ctx.shadowColor = '#38BDF8';
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Bold Cost Numeral
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${cost}`, 0, 0);
    ctx.restore();
  }

  renderCardArtSigil(x, y, card, elem) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);

    // Art circular backdrop
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fill();
    ctx.strokeStyle = elem.primaryColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = elem.primaryColor;
    ctx.strokeStyle = elem.secondaryColor;
    ctx.lineWidth = 2;

    switch (card.element) {
      case 'SOLAR': {
        // Sunburst Sigil
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * 16, Math.sin(a) * 16);
          ctx.lineTo(Math.cos(a) * 26, Math.sin(a) * 26);
          ctx.stroke();
        }
        break;
      }
      case 'LUNAR': {
        // Crescent Moon Sigil
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(8, -6, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        // Frost star
        ctx.font = '12px serif';
        ctx.fillText('❄', -6, 6);
        break;
      }
      case 'VERDANT': {
        // Spire Leaf Sigil
        ctx.beginPath();
        ctx.moveTo(0, -22);
        ctx.quadraticCurveTo(18, -6, 0, 22);
        ctx.quadraticCurveTo(-18, -6, 0, -22);
        ctx.fill();
        ctx.stroke();
        // Leaf stem
        ctx.strokeStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(0, 14);
        ctx.stroke();
        break;
      }
      case 'VOID': {
        // Singularity Spiral
        ctx.beginPath();
        for (let i = 0; i < 30; i++) {
          const a = i * 0.35;
          const r = i * 0.85;
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }

    ctx.restore();
  }

  renderCardStatsBar(x, y, card, elem) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);

    const badges = [];
    if (card.damage > 0) badges.push({ icon: '⚔', val: card.damage, col: '#EF4444' });
    if (card.ward > 0) badges.push({ icon: '🛡', val: card.ward, col: '#38BDF8' });
    if (card.heal > 0) badges.push({ icon: '♥', val: card.heal, col: '#22C55E' });
    if (card.draw > 0) badges.push({ icon: '🎴', val: card.draw, col: '#A855F7' });
    if (card.freeze > 0) badges.push({ icon: '❄', val: card.freeze, col: '#06B6D4' });

    const totalBadges = badges.length;
    const spacing = 28;
    const startX = -((totalBadges - 1) * spacing) / 2;

    badges.forEach((b, idx) => {
      const bx = startX + idx * spacing;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.strokeStyle = b.col;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(bx, 0, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = b.col;
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${b.icon}${b.val}`, bx, 0);
    });

    ctx.restore();
  }

  /**
   * Renders the glowing End Turn Button.
   */
  renderEndTurnButton(button) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(button.x, button.y);

    const w = button.width;
    const h = button.height;

    // Glowing border
    ctx.shadowColor = button.hovered ? '#FACC15' : 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = button.hovered ? 15 : 6;

    this.drawRoundedRect(ctx, 0, 0, w, h, 8);
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    if (button.isPlayerTurn) {
      grad.addColorStop(0, button.hovered ? '#F59E0B' : '#D97706');
      grad.addColorStop(1, button.hovered ? '#B45309' : '#78350F');
    } else {
      grad.addColorStop(0, '#475569');
      grad.addColorStop(1, '#1E293B');
    }
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = button.hovered ? '#FEF08A' : '#D4AF37';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(button.isPlayerTurn ? 'END TURN' : 'OPPONENT TURN', w / 2, h / 2);

    ctx.restore();
  }

  /**
   * Renders the Combat Action Log / Ticker.
   */
  renderCombatLog(logs, x, y, width = 340, maxEntries = 4) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);

    this.drawRoundedRect(ctx, 0, 0, width, 100, 8);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.textAlign = 'left';
    ctx.fillText('DUEL CHRONICLE', 12, 16);

    const recent = logs.slice(-maxEntries);
    recent.forEach((log, idx) => {
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillStyle = log.color || '#E2E8F0';
      ctx.fillText(log.text, 12, 34 + idx * 16);
    });

    ctx.restore();
  }

  /**
   * Renders explosive Combo notification banner across table.
   */
  renderComboBanner(comboInfo) {
    const ctx = this.ctx;
    ctx.save();
    const cy = this.height / 2 - 20;

    // Radiant combo backdrop ribbon
    const ribbonGrad = ctx.createLinearGradient(0, cy - 35, 0, cy + 35);
    ribbonGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    ribbonGrad.addColorStop(0.2, 'rgba(15, 23, 42, 0.95)');
    ribbonGrad.addColorStop(0.8, 'rgba(15, 23, 42, 0.95)');
    ribbonGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = ribbonGrad;
    ctx.fillRect(0, cy - 35, this.width, 70);

    // Glowing border lines
    ctx.strokeStyle = comboInfo.color || '#F59E0B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, cy - 25);
    ctx.lineTo(this.width, cy - 25);
    ctx.moveTo(0, cy + 25);
    ctx.lineTo(this.width, cy + 25);
    ctx.stroke();

    // Text banner
    ctx.shadowColor = comboInfo.color || '#F59E0B';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`⚡ ELEMENTAL COMBO: ${comboInfo.name} ⚡`, this.width / 2, cy - 5);

    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillStyle = comboInfo.color || '#FCD34D';
    ctx.fillText(comboInfo.description, this.width / 2, cy + 16);
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  /**
   * Renders floating damage and heal particle numbers.
   */
  renderFloatingCombatTexts() {
    const ctx = this.ctx;
    this.floatingTexts.forEach((ft) => {
      ctx.save();
      ctx.font = `bold ${ft.fontSize}px system-ui, sans-serif`;
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    // Burst particles
    this.burstParticles.forEach((p) => {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // ==========================================
  // TITLE & OUTCOME SCREENS
  // ==========================================

  renderTitleScreen() {
    const ctx = this.ctx;
    this.renderTableBackground();

    // Heroic Title & Emblem
    ctx.save();
    ctx.translate(this.width / 2, 190);

    // Glowing Arcane Halo
    const halo = ctx.createRadialGradient(0, 0, 10, 0, 0, 240);
    halo.addColorStop(0, 'rgba(168, 85, 247, 0.4)');
    halo.addColorStop(0.5, 'rgba(56, 189, 248, 0.2)');
    halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, 240, 0, Math.PI * 2);
    ctx.fill();

    // Main Title
    ctx.shadowColor = '#C084FC';
    ctx.shadowBlur = 24;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 54px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AETHERBOUND', 0, 0);

    ctx.shadowColor = '#38BDF8';
    ctx.font = 'bold 26px serif';
    ctx.fillStyle = '#F59E0B';
    ctx.fillText('RUNES OF THE VOID', 0, 38);
    ctx.shadowBlur = 0;

    // Subtitle lore
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillStyle = '#CBD5E1';
    ctx.fillText('Tactical Arcane Duel of Four Disciplines', 0, 72);

    ctx.restore();

    // 4 Elemental Discipline Showcase Cards in a row
    const showcaseCards = [
      { element: 'SOLAR', name: 'Solar Strike', desc: 'Ruby Flame & Pure Impact' },
      { element: 'LUNAR', name: 'Lunar Ward', desc: 'Sapphire Frost & Reflection' },
      { element: 'VERDANT', name: 'Verdant Surge', desc: 'Emerald Life & Poison Bloom' },
      { element: 'VOID', name: 'Void Flux', desc: 'Amethyst Chaos & Singularity' },
    ];

    const cardSpacing = 220;
    const startX = this.width / 2 - (showcaseCards.length - 1) * (cardSpacing / 2);

    showcaseCards.forEach((sc, idx) => {
      const cx = startX + idx * cardSpacing;
      const cy = 370;
      const elem = ELEMENTS[sc.element];

      ctx.save();
      this.drawRoundedRect(ctx, cx - 95, cy - 65, 190, 130, 8);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fill();
      ctx.strokeStyle = elem.primaryColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = 'bold 28px serif';
      ctx.fillStyle = elem.primaryColor;
      ctx.textAlign = 'center';
      ctx.fillText(elem.glyph, cx, cy - 24);

      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(sc.name, cx, cy + 6);

      ctx.font = '11px system-ui, sans-serif';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText(sc.desc, cx, cy + 28);
      ctx.restore();
    });

    // Start Button
    const btnW = 280;
    const btnH = 64;
    const btnX = this.width / 2 - btnW / 2;
    const btnY = 510;

    ctx.save();
    ctx.shadowColor = '#F59E0B';
    ctx.shadowBlur = 18;
    this.drawRoundedRect(ctx, btnX, btnY, btnW, btnH, 12);
    const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
    btnGrad.addColorStop(0, '#F59E0B');
    btnGrad.addColorStop(1, '#B45309');
    ctx.fillStyle = btnGrad;
    ctx.fill();
    ctx.strokeStyle = '#FEF08A';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ENTER THE ARENA', this.width / 2, btnY + btnH / 2);

    // Controls hint
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('Click to play cards • Chaining elements triggers elemental combos!', this.width / 2, 605);
    ctx.fillText('Goal: Reduce Opponent from 30 HP to 0 HP before they breach your wards.', this.width / 2, 628);
    ctx.restore();
  }

  renderOutcomeScreen(isVictory, stats) {
    const ctx = this.ctx;
    this.renderTableBackground();

    // Darkened veil
    ctx.fillStyle = 'rgba(6, 9, 20, 0.85)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();
    ctx.translate(this.width / 2, 220);

    // Big Outcome Header
    ctx.shadowColor = isVictory ? '#F59E0B' : '#EF4444';
    ctx.shadowBlur = 30;
    ctx.font = 'bold 64px system-ui, sans-serif';
    ctx.fillStyle = isVictory ? '#FEF08A' : '#FCA5A5';
    ctx.textAlign = 'center';
    ctx.fillText(isVictory ? 'VICTORY' : 'DEFEAT', 0, 0);
    ctx.shadowBlur = 0;

    ctx.font = 'bold 22px serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(isVictory ? 'Archmage Triumphant' : 'The Void Consumes Your Sigils', 0, 48);

    // Stats Card Box
    ctx.restore();

    const boxW = 460;
    const boxH = 180;
    const boxX = this.width / 2 - boxW / 2;
    const boxY = 320;

    this.drawRoundedRect(ctx, boxX, boxY, boxW, boxH, 12);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fill();
    ctx.strokeStyle = isVictory ? '#F59E0B' : '#64748B';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('DUEL SUMMARY', boxX + 24, boxY + 32);

    const summaryRows = [
      { label: 'Player Final HP', value: `${stats.playerHp} / 30 HP` },
      { label: 'Opponent Final HP', value: `${stats.opponentHp} / 30 HP` },
      { label: 'Turns Elapsed', value: `${stats.turns} Turns` },
      { label: 'Elemental Combos Triggered', value: `${stats.combosCount} Combos` },
      { label: 'Total Damage Inflicted', value: `${stats.damageDealt} Arcane Damage` },
    ];

    summaryRows.forEach((r, idx) => {
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillStyle = '#CBD5E1';
      ctx.fillText(r.label, boxX + 24, boxY + 62 + idx * 22);

      ctx.fillStyle = '#F8FAFC';
      ctx.textAlign = 'right';
      ctx.fillText(r.value, boxX + boxW - 24, boxY + 62 + idx * 22);
      ctx.textAlign = 'left';
    });

    // Play Again Button
    const btnW = 220;
    const btnH = 52;
    const btnX = this.width / 2 - btnW / 2;
    const btnY = 530;

    this.drawRoundedRect(ctx, btnX, btnY, btnW, btnH, 8);
    ctx.fillStyle = isVictory ? '#2563EB' : '#475569';
    ctx.fill();
    ctx.strokeStyle = isVictory ? '#60A5FA' : '#94A3B8';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PLAY AGAIN', this.width / 2, btnY + btnH / 2);
  }

  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line.trim(), x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x, currentY);
  }
}
