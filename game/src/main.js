// Aetherbound: Runes of the Void - Application Entry Point & Game Loop
// Module: main.js

import { GAME_CONFIG } from './config.js';
import { updateCardTransforms } from './deck.js';
import { GameRenderer } from './renderer.js';
import { GameState } from './game.js';
import { InputController } from './ui.js';
import { applyScreenshotState } from './shots.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  canvas.width = GAME_CONFIG.CANVAS_WIDTH;
  canvas.height = GAME_CONFIG.CANVAS_HEIGHT;

  const renderer = new GameRenderer(canvas);
  const gameState = new GameState(renderer);
  const input = new InputController(canvas, gameState);

  // Parse query parameters for screenshot generation
  const params = new URLSearchParams(window.location.search);
  const shotParam = params.get('shot');

  if (shotParam) {
    applyScreenshotState(gameState, shotParam.toLowerCase());
  }

  let lastTime = performance.now();

  function loop(currentTime) {
    const delta = Math.min(0.1, (currentTime - lastTime) / 1000);
    lastTime = currentTime;

    // Update animations and timers
    renderer.updateAnimations(delta);
    gameState.update(delta);

    // Update card physical positions
    if (gameState.state === 'BATTLE') {
      gameState.player.hand.forEach((card) => updateCardTransforms(card, delta));
      gameState.opponent.hand.forEach((card) => updateCardTransforms(card, delta));
    }

    // Render current scene
    renderCurrentScene(renderer, gameState);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
});

function renderCurrentScene(renderer, gameState) {
  const ctx = renderer.ctx;
  ctx.clearRect(0, 0, renderer.width, renderer.height);

  switch (gameState.state) {
    case 'TITLE': {
      renderer.renderTitleScreen();
      break;
    }

    case 'BATTLE': {
      // 1. Arcane table background with runic circle and constellations
      renderer.renderTableBackground();

      // 2. Health & Status Orbs (30 HP)
      renderer.renderHealthOrb(gameState.opponent, 150, 95, false);
      renderer.renderHealthOrb(gameState.player, 150, 560, true);

      // 3. Player Mana Crystals
      renderer.renderManaBar(gameState.player.mana, gameState.player.maxMana, 280, 575);

      // 4. End Turn Action Button
      renderer.renderEndTurnButton(gameState.endTurnButton);

      // 5. Duel Chronicle / Combat Log
      renderer.renderCombatLog(gameState.combatLogs, 880, 510, 365, 4);

      // 6. Opponent Hand (Facedown mystic card backs)
      gameState.opponent.hand.forEach((card) => {
        renderer.renderCard(card, true);
      });

      // 7. Player Hand (Face-up cards with crisp values, costs and element runes)
      gameState.player.hand.forEach((card) => {
        renderer.renderCard(card, false);
      });

      // 8. Active Combo Synergy Banner
      if (gameState.activeCombo) {
        renderer.renderComboBanner(gameState.activeCombo);
      }

      // 9. Floating damage numbers and particle effects
      renderer.renderFloatingCombatTexts();
      break;
    }

    case 'VICTORY': {
      renderer.renderOutcomeScreen(true, gameState.duelStats);
      renderer.renderFloatingCombatTexts();
      break;
    }

    case 'DEFEAT': {
      renderer.renderOutcomeScreen(false, gameState.duelStats);
      renderer.renderFloatingCombatTexts();
      break;
    }
  }
}
