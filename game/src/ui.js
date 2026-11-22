// Aetherbound: Runes of the Void - User Interface & Input Controller
// Module: ui.js

import { GAME_CONFIG } from './config.js';
import { soundEngine } from './audio.js';

export class InputController {
  constructor(canvas, gameState) {
    this.canvas = canvas;
    this.gameState = gameState;
    this.mouseX = 0;
    this.mouseY = 0;

    this.bindEvents();
  }

  bindEvents() {
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    window.addEventListener('keydown', (e) => this.onKeyDown(e));

    // Initialize audio context on first user click anywhere
    window.addEventListener(
      'click',
      () => {
        soundEngine.init();
      },
      { once: true },
    );
  }

  getCanvasCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  onMouseMove(e) {
    const coords = this.getCanvasCoords(e);
    this.mouseX = coords.x;
    this.mouseY = coords.y;

    if (this.gameState.state === 'BATTLE') {
      // Check End Turn button hover
      const btn = this.gameState.endTurnButton;
      btn.hovered =
        this.mouseX >= btn.x &&
        this.mouseX <= btn.x + btn.width &&
        this.mouseY >= btn.y &&
        this.mouseY <= btn.y + btn.height;

      // Check Player Hand cards hover (inspect from right to left so top cards get priority)
      const hand = this.gameState.player.hand;
      let foundHover = false;
      for (let i = hand.length - 1; i >= 0; i--) {
        const card = hand[i];
        const halfW = (GAME_CONFIG.CARD_WIDTH * card.scale) / 2;
        const halfH = (GAME_CONFIG.CARD_HEIGHT * card.scale) / 2;

        if (
          !foundHover &&
          this.mouseX >= card.x - halfW &&
          this.mouseX <= card.x + halfW &&
          this.mouseY >= card.y - halfH &&
          this.mouseY <= card.y + halfH
        ) {
          card.hovered = true;
          foundHover = true;
        } else {
          card.hovered = false;
        }
      }
    }
  }

  onMouseDown(e) {
    const coords = this.getCanvasCoords(e);
    const mx = coords.x;
    const my = coords.y;

    soundEngine.init();

    if (this.gameState.state === 'TITLE') {
      // Check "ENTER THE ARENA" button (x: center - 140, y: 510, w: 280, h: 64)
      const btnW = 280;
      const btnH = 64;
      const btnX = this.canvas.width / 2 - btnW / 2;
      const btnY = 510;
      if (mx >= btnX && mx <= btnX + btnW && my >= btnY && my <= btnY + btnH) {
        this.gameState.startDuel();
      }
      return;
    }

    if (this.gameState.state === 'VICTORY' || this.gameState.state === 'DEFEAT') {
      // Check "PLAY AGAIN" button (x: center - 110, y: 530, w: 220, h: 52)
      const btnW = 220;
      const btnH = 52;
      const btnX = this.canvas.width / 2 - btnW / 2;
      const btnY = 530;
      if (mx >= btnX && mx <= btnX + btnW && my >= btnY && my <= btnY + btnH) {
        this.gameState.initGame();
        this.gameState.startDuel();
      }
      return;
    }

    if (this.gameState.state === 'BATTLE') {
      // Check End Turn button
      const btn = this.gameState.endTurnButton;
      if (
        this.gameState.activeTurn === 'PLAYER' &&
        mx >= btn.x &&
        mx <= btn.x + btn.width &&
        my >= btn.y &&
        my <= btn.y + btn.height
      ) {
        this.gameState.endTurn();
        return;
      }

      // Check card click in player hand
      const hand = this.gameState.player.hand;
      for (let i = hand.length - 1; i >= 0; i--) {
        const card = hand[i];
        const halfW = (GAME_CONFIG.CARD_WIDTH * card.scale) / 2;
        const halfH = (GAME_CONFIG.CARD_HEIGHT * card.scale) / 2;

        if (mx >= card.x - halfW && mx <= card.x + halfW && my >= card.y - halfH && my <= card.y + halfH) {
          this.gameState.playCard(i);
          break;
        }
      }
    }
  }

  onKeyDown(e) {
    soundEngine.init();
    if (this.gameState.state === 'BATTLE') {
      if (e.code === 'Space') {
        e.preventDefault();
        if (this.gameState.activeTurn === 'PLAYER') {
          this.gameState.endTurn();
        }
      }

      // Keys 1 to 7 to play cards
      if (e.key >= '1' && e.key <= '7') {
        const index = parseInt(e.key, 10) - 1;
        if (index < this.gameState.player.hand.length) {
          this.gameState.playCard(index);
        }
      }
    }
  }
}
