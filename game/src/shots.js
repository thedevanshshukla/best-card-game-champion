// Aetherbound: Runes of the Void - Deterministic Screenshot State Generator
// Module: shots.js

import { COMBO_RECIPES } from './config.js';
import { createCardInstance, layoutOpponentHand, layoutPlayerHand } from './deck.js';

export function applyScreenshotState(gameState, shotType) {
  switch (shotType) {
    case 'title':
    case 'start': {
      gameState.state = 'TITLE';
      break;
    }

    case 'battle':
    case 'play': {
      gameState.state = 'BATTLE';
      gameState.activeTurn = 'PLAYER';
      gameState.turnNumber = 4;
      gameState.endTurnButton.isPlayerTurn = true;

      // Player State
      gameState.player.hp = 26;
      gameState.player.maxHp = 30;
      gameState.player.ward = 6;
      gameState.player.mana = 5;
      gameState.player.maxMana = 5;
      gameState.player.burn = 0;
      gameState.player.poison = 0;
      gameState.player.hand = [
        createCardInstance('solar_flare'), // Solar, Cost 1
        createCardInstance('sapphire_ward'), // Lunar, Cost 2
        createCardInstance('blazing_meteor'), // Solar, Cost 3
        createCardInstance('toxic_spores'), // Verdant, Cost 3
        createCardInstance('amethyst_flux'), // Void, Cost 3
      ];

      // Opponent State
      gameState.opponent.hp = 21;
      gameState.opponent.maxHp = 30;
      gameState.opponent.ward = 0;
      gameState.opponent.burn = 1;
      gameState.opponent.poison = 2;
      gameState.opponent.mana = 4;
      gameState.opponent.maxMana = 4;
      gameState.opponent.hand = [
        createCardInstance('frost_shard'),
        createCardInstance('void_drain'),
        createCardInstance('sylvan_vitality'),
        createCardInstance('ruby_blade'),
      ];

      // Layout hands immediately to target coordinates
      layoutPlayerHand(gameState.player.hand, gameState.renderer.width, gameState.renderer.height);
      gameState.player.hand.forEach((c) => {
        c.x = c.targetX;
        c.y = c.targetY;
        c.scale = c.targetScale;
        c.rotation = c.targetRotation;
      });

      // Hover on the middle card for high visual dynamism
      gameState.player.hand[2].hovered = true;
      gameState.player.hand[2].targetY -= 65;
      gameState.player.hand[2].y = gameState.player.hand[2].targetY;
      gameState.player.hand[2].targetScale = 1.15;
      gameState.player.hand[2].scale = 1.15;

      layoutOpponentHand(gameState.opponent.hand, gameState.renderer.width);
      gameState.opponent.hand.forEach((c) => {
        c.x = c.targetX;
        c.y = c.targetY;
        c.scale = c.targetScale;
        c.rotation = c.targetRotation;
      });

      // Combat Chronicle
      gameState.combatLogs = [
        { text: 'Turn 3: Malakor cast Shadow Dart (-3 HP to Player)', color: '#C084FC' },
        { text: 'Turn 3: Player cast Sunfire Aegis (+6 Ward, 5 dmg)', color: '#FFB800' },
        { text: 'Malakor suffers 1 Burn and 2 Poison', color: '#F97316' },
        { text: "Turn 4: Player channels 5 Mana. Player's turn to strike!", color: '#38BDF8' },
      ];

      // Floating battle effects
      gameState.renderer.addFloatingText('+6 WARD', 150, 500, '#38BDF8', 22);
      gameState.renderer.addFloatingText('-5', 1000, 160, '#EF4444', 28);
      gameState.renderer.addBurstParticles(1000, 160, '#FF3366', 15);
      break;
    }

    case 'combo': {
      gameState.state = 'BATTLE';
      gameState.activeTurn = 'PLAYER';
      gameState.turnNumber = 5;
      gameState.endTurnButton.isPlayerTurn = true;

      gameState.player.hp = 27;
      gameState.player.maxHp = 30;
      gameState.player.ward = 8;
      gameState.player.mana = 2;
      gameState.player.maxMana = 6;

      gameState.opponent.hp = 13;
      gameState.opponent.maxHp = 30;
      gameState.opponent.ward = 0;
      gameState.opponent.burn = 2;

      gameState.player.hand = [
        createCardInstance('sapphire_ward'),
        createCardInstance('ruby_blade'),
        createCardInstance('emerald_surge'),
        createCardInstance('avatar_of_the_sun'),
      ];

      layoutPlayerHand(gameState.player.hand, gameState.renderer.width, gameState.renderer.height);
      gameState.player.hand.forEach((c) => {
        c.x = c.targetX;
        c.y = c.targetY;
        c.scale = c.targetScale;
        c.rotation = c.targetRotation;
      });

      layoutOpponentHand(gameState.opponent.hand, gameState.renderer.width);
      gameState.opponent.hand.forEach((c) => {
        c.x = c.targetX;
        c.y = c.targetY;
        c.scale = c.targetScale;
        c.rotation = c.targetRotation;
      });

      // Active Combo Banner: Eclipse Conjunction
      const combo = COMBO_RECIPES.find((r) => r.name === 'Eclipse Conjunction') || COMBO_RECIPES[0];
      gameState.activeCombo = combo;
      gameState.comboTimer = 1000; // Keep persistent for screenshot

      // Combat Chronicle
      gameState.combatLogs = [
        { text: 'Player cast Solar Flare (3 Solar damage)', color: '#FF3366' },
        { text: 'Player cast Amethyst Flux (7 Void damage)', color: '#C084FC' },
        { text: 'COMBO UNLEASHED: Eclipse Conjunction! +5 Chaos Damage!', color: '#E879F9' },
        { text: 'Malakor takes 15 total explosive damage!', color: '#FACC15' },
      ];

      // Explosive Floating damage and particles
      gameState.renderer.addFloatingText('-15 COMBO BURST!', 1000, 140, '#E879F9', 32);
      gameState.renderer.addFloatingText('CRITICAL SYNERGY', 1000, 180, '#FACC15', 20);
      gameState.renderer.addBurstParticles(1000, 160, '#E879F9', 35);
      gameState.renderer.addBurstParticles(1000, 160, '#FF3366', 25);
      break;
    }

    case 'victory':
    case 'end': {
      gameState.state = 'VICTORY';
      gameState.duelStats = {
        playerHp: 24,
        opponentHp: 0,
        turns: 7,
        combosCount: 5,
        damageDealt: 42,
      };

      // Add radiant celebration sparkles
      gameState.renderer.addBurstParticles(640, 200, '#F59E0B', 40);
      gameState.renderer.addBurstParticles(400, 180, '#38BDF8', 30);
      gameState.renderer.addBurstParticles(880, 180, '#C084FC', 30);
      break;
    }

    case 'defeat': {
      gameState.state = 'DEFEAT';
      gameState.duelStats = {
        playerHp: 0,
        opponentHp: 18,
        turns: 6,
        combosCount: 2,
        damageDealt: 21,
      };
      break;
    }
  }
}
