// Aetherbound: Runes of the Void - Core Game State Machine & Rules Engine
// Module: game.js

import { COMBO_RECIPES, GAME_CONFIG } from './config.js';
import { createStandardDeck, drawCards, layoutOpponentHand, layoutPlayerHand } from './deck.js';
import { TacticalAI } from './ai.js';
import { soundEngine } from './audio.js';

export class GameState {
  constructor(renderer) {
    this.renderer = renderer;
    this.ai = new TacticalAI('normal');
    this.state = 'TITLE'; // TITLE, BATTLE, VICTORY, DEFEAT

    this.player = null;
    this.opponent = null;
    this.turnNumber = 1;
    this.activeTurn = 'PLAYER'; // PLAYER or OPPONENT
    this.cardsPlayedThisTurn = [];
    this.activeCombo = null;
    this.comboTimer = 0;

    this.combatLogs = [];
    this.duelStats = {
      playerHp: 30,
      opponentHp: 30,
      turns: 1,
      combosCount: 0,
      damageDealt: 0,
    };

    // UI interactive elements
    this.endTurnButton = {
      x: 1080,
      y: 330,
      width: 160,
      height: 48,
      hovered: false,
      isPlayerTurn: true,
    };

    this.initGame();
  }

  initGame() {
    this.player = {
      name: 'Player (Archmage)',
      hp: GAME_CONFIG.INITIAL_HP,
      maxHp: GAME_CONFIG.MAX_HP,
      ward: 0,
      mana: 3,
      maxMana: 3,
      deck: createStandardDeck(),
      hand: [],
      discard: [],
      burn: 0,
      poison: 0,
      freeze: 0,
      fatigueCount: 0,
    };

    this.opponent = {
      name: 'Malakor the Voidcaller',
      hp: GAME_CONFIG.INITIAL_HP,
      maxHp: GAME_CONFIG.MAX_HP,
      ward: 0,
      mana: 3,
      maxMana: 3,
      deck: createStandardDeck(),
      hand: [],
      discard: [],
      burn: 0,
      poison: 0,
      freeze: 0,
      fatigueCount: 0,
    };

    // Initial hand deal
    drawCards(this.player, GAME_CONFIG.STARTING_HAND_SIZE);
    drawCards(this.opponent, GAME_CONFIG.STARTING_HAND_SIZE);

    layoutPlayerHand(this.player.hand, this.renderer.width, this.renderer.height);
    layoutOpponentHand(this.opponent.hand, this.renderer.width);

    this.logAction('Aetherbound duel commences. 30 HP each.', '#93C5FD');
  }

  logAction(text, color = '#E2E8F0') {
    this.combatLogs.push({ text, color, timestamp: Date.now() });
    if (this.combatLogs.length > 30) this.combatLogs.shift();
  }

  startDuel() {
    this.state = 'BATTLE';
    this.activeTurn = 'PLAYER';
    this.endTurnButton.isPlayerTurn = true;
    soundEngine.playCardDeal();
    this.logAction('Turn 1: Player draw & channels mana.', '#38BDF8');
  }

  /**
   * Attempts to play a card from player's hand.
   */
  playCard(cardIndex) {
    if (this.state !== 'BATTLE' || this.activeTurn !== 'PLAYER') return false;
    const card = this.player.hand[cardIndex];
    if (!card) return false;

    if (this.player.mana < card.cost) {
      this.renderer.addFloatingText('NOT ENOUGH MANA', card.x, card.y - 40, '#EF4444', 20);
      return false;
    }

    // Spend Mana
    this.player.mana -= card.cost;
    this.player.hand.splice(cardIndex, 1);
    this.player.discard.push(card);

    soundEngine.playCardSnap();

    // Execute Card Effects
    this.resolveCardEffect(this.player, this.opponent, card);
    this.cardsPlayedThisTurn.push(card);

    // Check for elemental combo with previous card played this turn
    this.checkComboSynergy(this.player, this.opponent);

    // Relayout hand
    layoutPlayerHand(this.player.hand, this.renderer.width, this.renderer.height);

    // Check Victory
    this.checkGameEnd();
    return true;
  }

  resolveCardEffect(caster, target, card) {
    const isPlayer = caster === this.player;

    // 1. Damage to Target (Ward absorbs first)
    if (card.damage > 0) {
      let damageRemaining = card.damage;
      if (target.ward > 0) {
        if (target.ward >= damageRemaining) {
          target.ward -= damageRemaining;
          this.renderer.addFloatingText(`-${damageRemaining} WARD`, isPlayer ? 1000 : 150, 160, '#38BDF8', 22);
          damageRemaining = 0;
        } else {
          damageRemaining -= target.ward;
          this.renderer.addFloatingText(`WARD BROKEN`, isPlayer ? 1000 : 150, 140, '#38BDF8', 20);
          target.ward = 0;
        }
      }

      if (damageRemaining > 0) {
        target.hp = Math.max(0, target.hp - damageRemaining);
        const targetX = isPlayer ? 1000 : 150;
        const targetY = isPlayer ? 160 : 540;
        this.renderer.addFloatingText(`-${damageRemaining}`, targetX, targetY, '#EF4444', 28);
        this.renderer.addBurstParticles(targetX, targetY, '#FF3366', 22);

        if (isPlayer) {
          this.duelStats.damageDealt += damageRemaining;
        }
      }

      // Elemental SFX
      if (card.element === 'SOLAR') soundEngine.playSolarStrike();
      else if (card.element === 'VOID') soundEngine.playVoidFlux();
    }

    // 2. Ward Gain
    if (card.ward > 0) {
      caster.ward += card.ward;
      const casterX = isPlayer ? 150 : 1000;
      const casterY = isPlayer ? 540 : 160;
      this.renderer.addFloatingText(`+${card.ward} WARD`, casterX, casterY, '#38BDF8', 22);
      soundEngine.playLunarWard();
    }

    // 3. Heal
    if (card.heal > 0) {
      const prevHp = caster.hp;
      caster.hp = Math.min(caster.maxHp, caster.hp + card.heal);
      const healed = caster.hp - prevHp;
      const casterX = isPlayer ? 150 : 1000;
      const casterY = isPlayer ? 540 : 160;
      this.renderer.addFloatingText(`+${healed} HEAL`, casterX, casterY, '#22C55E', 22);
      soundEngine.playVerdantSurge();
    }

    // 4. Status Effects
    if (card.burn > 0) {
      target.burn += card.burn;
      this.logAction(`${card.name} applied ${card.burn} Burn to ${target.name}`, '#F97316');
    }
    if (card.poison > 0) {
      target.poison += card.poison;
      this.logAction(`${card.name} applied ${card.poison} Poison to ${target.name}`, '#22C55E');
    }
    if (card.freeze > 0) {
      target.freeze += card.freeze;
      this.logAction(`${card.name} froze ${card.freeze} of ${target.name}'s mana`, '#06B6D4');
    }

    // 5. Card Draw & Mana Steal
    if (card.draw > 0) {
      drawCards(caster, card.draw);
      if (isPlayer) layoutPlayerHand(caster.hand, this.renderer.width, this.renderer.height);
      else layoutOpponentHand(caster.hand, this.renderer.width);
    }
    if (card.manaSteal > 0) {
      const stolen = Math.min(target.mana, card.manaSteal);
      target.mana -= stolen;
      caster.mana = Math.min(caster.maxMana, caster.mana + stolen);
      this.logAction(`${caster.name} stole ${stolen} Mana!`, '#C084FC');
    }
    if (card.manaBonus > 0) {
      caster.mana = Math.min(caster.maxMana, caster.mana + card.manaBonus);
    }

    this.logAction(`${caster.name} cast ${card.name} (${card.element})`, '#F8FAFC');
  }

  checkComboSynergy(caster, target) {
    if (this.cardsPlayedThisTurn.length < 2) return;
    const len = this.cardsPlayedThisTurn.length;
    const c1 = this.cardsPlayedThisTurn[len - 2];
    const c2 = this.cardsPlayedThisTurn[len - 1];

    const combo = COMBO_RECIPES.find(
      (r) =>
        (r.elements[0] === c1.element && r.elements[1] === c2.element) ||
        (r.elements[0] === c2.element && r.elements[1] === c1.element),
    );

    if (combo) {
      this.activeCombo = combo;
      this.comboTimer = 2.5; // display for 2.5s
      soundEngine.playComboChime();
      this.duelStats.combosCount++;

      // Apply combo bonuses
      if (combo.bonusDamage > 0) {
        target.hp = Math.max(0, target.hp - combo.bonusDamage);
        this.renderer.addFloatingText(
          `COMBO: -${combo.bonusDamage}!`,
          target === this.player ? 150 : 1000,
          target === this.player ? 540 : 160,
          combo.color,
          30,
        );
      }
      if (combo.bonusWard > 0) {
        caster.ward += combo.bonusWard;
        this.renderer.addFloatingText(`+${combo.bonusWard} WARD`, 150, 540, '#38BDF8', 22);
      }
      if (combo.bonusHeal > 0) {
        caster.hp = Math.min(caster.maxHp, caster.hp + combo.bonusHeal);
        this.renderer.addFloatingText(`+${combo.bonusHeal} HEAL`, 150, 540, '#22C55E', 22);
      }
      if (combo.bonusBurn > 0) target.burn += combo.bonusBurn;
      if (combo.bonusFreeze > 0) target.freeze += combo.bonusFreeze;
      if (combo.bonusDraw > 0) {
        drawCards(caster, combo.bonusDraw);
        if (caster === this.player) layoutPlayerHand(caster.hand, this.renderer.width, this.renderer.height);
      }

      this.logAction(`COMBO UNLEASHED: ${combo.name}! ${combo.description}`, combo.color);
    }
  }

  endTurn() {
    if (this.state !== 'BATTLE') return;

    if (this.activeTurn === 'PLAYER') {
      // Process End of Player Turn
      this.resolveTurnTick(this.player);
      if (this.checkGameEnd()) return;

      this.activeTurn = 'OPPONENT';
      this.endTurnButton.isPlayerTurn = false;
      this.cardsPlayedThisTurn = [];

      // Start Opponent Turn
      this.startOpponentTurn();
    } else {
      // Process End of Opponent Turn
      this.resolveTurnTick(this.opponent);
      if (this.checkGameEnd()) return;

      this.turnNumber++;
      this.duelStats.turns = this.turnNumber;
      this.activeTurn = 'PLAYER';
      this.endTurnButton.isPlayerTurn = true;
      this.cardsPlayedThisTurn = [];

      // Player Mana ramp up & refill
      if (this.player.maxMana < GAME_CONFIG.MAX_MANA) {
        this.player.maxMana++;
      }
      this.player.mana = Math.max(0, this.player.maxMana - this.player.freeze);
      this.player.freeze = 0; // Freeze cleared after locking mana

      // Player Draw
      drawCards(this.player, 1);
      layoutPlayerHand(this.player.hand, this.renderer.width, this.renderer.height);
      soundEngine.playCardDeal();

      this.logAction(`Turn ${this.turnNumber}: Player's Turn (${this.player.mana}/${this.player.maxMana} Mana)`, '#38BDF8');
    }
  }

  resolveTurnTick(actor) {
    // Tick Burn
    if (actor.burn > 0) {
      actor.hp = Math.max(0, actor.hp - actor.burn);
      this.renderer.addFloatingText(
        `-${actor.burn} BURN`,
        actor === this.player ? 150 : 1000,
        actor === this.player ? 540 : 160,
        '#F97316',
        20,
      );
      actor.burn--;
    }

    // Tick Poison
    if (actor.poison > 0) {
      actor.hp = Math.max(0, actor.hp - actor.poison);
      this.renderer.addFloatingText(
        `-${actor.poison} POISON`,
        actor === this.player ? 150 : 1000,
        actor === this.player ? 540 : 160,
        '#22C55E',
        20,
      );
      actor.poison--;
    }
  }

  startOpponentTurn() {
    // Opponent Mana ramp up & refill
    if (this.opponent.maxMana < GAME_CONFIG.MAX_MANA) {
      this.opponent.maxMana++;
    }
    this.opponent.mana = Math.max(0, this.opponent.maxMana - this.opponent.freeze);
    this.opponent.freeze = 0;

    // Opponent Draw
    drawCards(this.opponent, 1);
    layoutOpponentHand(this.opponent.hand, this.renderer.width);

    this.logAction(`Opponent Turn: Malakor channels ${this.opponent.mana} mana...`, '#FCA5A5');

    // AI Decision Execution with timed cadence
    setTimeout(() => {
      this.executeAITurn();
    }, 600);
  }

  executeAITurn() {
    if (this.state !== 'BATTLE' || this.activeTurn !== 'OPPONENT') return;

    const plannedCards = this.ai.planTurn(this.opponent, this.player);

    if (plannedCards.length === 0) {
      setTimeout(() => this.endTurn(), 500);
      return;
    }

    // Play cards sequentially
    let delay = 0;
    plannedCards.forEach((card, idx) => {
      setTimeout(() => {
        if (this.state !== 'BATTLE') return;
        const handIdx = this.opponent.hand.indexOf(card);
        if (handIdx !== -1 && this.opponent.mana >= card.cost) {
          this.opponent.mana -= card.cost;
          this.opponent.hand.splice(handIdx, 1);
          this.opponent.discard.push(card);

          soundEngine.playCardSnap();
          this.resolveCardEffect(this.opponent, this.player, card);
          this.cardsPlayedThisTurn.push(card);
          this.checkComboSynergy(this.opponent, this.player);

          layoutOpponentHand(this.opponent.hand, this.renderer.width);
          this.checkGameEnd();
        }

        // If last card played, end turn
        if (idx === plannedCards.length - 1) {
          setTimeout(() => this.endTurn(), 800);
        }
      }, delay);
      delay += 850;
    });
  }

  checkGameEnd() {
    if (this.opponent.hp <= 0) {
      this.state = 'VICTORY';
      this.duelStats.playerHp = this.player.hp;
      this.duelStats.opponentHp = 0;
      soundEngine.playVictoryFanfare();
      this.logAction('VICTORY! Malakor is vanquished.', '#FACC15');
      return true;
    }

    if (this.player.hp <= 0) {
      this.state = 'DEFEAT';
      this.duelStats.playerHp = 0;
      this.duelStats.opponentHp = this.opponent.hp;
      soundEngine.playDefeatTone();
      this.logAction('DEFEAT! Your life force has shattered.', '#EF4444');
      return true;
    }

    return false;
  }

  update(delta = 0.016) {
    // Update combo banner timer
    if (this.activeCombo) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.activeCombo = null;
      }
    }
  }
}
