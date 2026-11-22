// Aetherbound: Runes of the Void - Deck & Card Management
// Module: deck.js

import { CARD_REGISTRY, GAME_CONFIG } from './config.js';

let uniqueCardSequence = 1;

/**
 * Creates an instance of a card with runtime state for layout and animations.
 */
export function createCardInstance(templateId) {
  const template = CARD_REGISTRY.find((c) => c.id === templateId) || CARD_REGISTRY[0];
  return {
    ...template,
    instanceId: `card_${uniqueCardSequence++}_${template.id}`,
    // Layout and animation interpolation targets
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    scale: 1,
    targetScale: 1,
    rotation: 0,
    targetRotation: 0,
    alpha: 1,
    targetAlpha: 1,
    hovered: false,
    selected: false,
    playable: false,
  };
}

/**
 * Creates a balanced standard 30-card deck covering all four elements and smooth mana curves.
 */
export function createStandardDeck() {
  const deck = [];
  // Add 1-2 copies of each card in the registry to build a 30-card deck
  CARD_REGISTRY.forEach((template) => {
    // Add 2 copies of common/rare cards, 1 copy of epic/mythic
    const copies = template.rarity === 'Common' || template.rarity === 'Rare' ? 2 : 1;
    for (let i = 0; i < copies; i++) {
      if (deck.length < 30) {
        deck.push(createCardInstance(template.id));
      }
    }
  });

  // Fill up to 30 if needed
  while (deck.length < 30) {
    const randomTemplate = CARD_REGISTRY[Math.floor(Math.random() * CARD_REGISTRY.length)];
    deck.push(createCardInstance(randomTemplate.id));
  }

  return shuffleDeck(deck);
}

/**
 * Shuffles a card array in-place using Fisher-Yates algorithm.
 */
export function shuffleDeck(cards) {
  const array = [...cards];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Draws cards from deck into hand up to MAX_HAND_SIZE.
 * Deals fatigue damage if deck is empty.
 */
export function drawCards(actorState, count = 1, onFatigue = null) {
  const drawn = [];
  for (let i = 0; i < count; i++) {
    if (actorState.deck.length === 0) {
      actorState.fatigueCount = (actorState.fatigueCount || 0) + 1;
      actorState.hp -= actorState.fatigueCount;
      if (onFatigue) onFatigue(actorState, actorState.fatigueCount);
      continue;
    }

    if (actorState.hand.length >= GAME_CONFIG.MAX_HAND_SIZE) {
      // Hand is full, discard card burned
      const burnedCard = actorState.deck.pop();
      actorState.discard.push(burnedCard);
      continue;
    }

    const card = actorState.deck.pop();
    actorState.hand.push(card);
    drawn.push(card);
  }
  return drawn;
}

/**
 * Updates card layout coordinates for player's hand.
 */
export function layoutPlayerHand(hand, canvasWidth = 1280, canvasHeight = 720) {
  const count = hand.length;
  if (count === 0) return;

  const cardWidth = GAME_CONFIG.CARD_WIDTH;
  const spacing = Math.min(cardWidth * 0.95, (canvasWidth - 360) / Math.max(count, 1));
  const startX = (canvasWidth - spacing * (count - 1)) / 2;
  const baseY = canvasHeight - 110;

  hand.forEach((card, index) => {
    const normalX = startX + index * spacing;
    // Arch effect for cards in hand
    const offsetFromCenter = (index - (count - 1) / 2) / Math.max(1, (count - 1) / 2);
    const archY = Math.abs(offsetFromCenter) * 16;
    const archRot = offsetFromCenter * 0.08;

    if (card.hovered) {
      card.targetX = normalX;
      card.targetY = baseY - 70;
      card.targetScale = 1.15;
      card.targetRotation = 0;
    } else {
      card.targetX = normalX;
      card.targetY = baseY + archY;
      card.targetScale = 1.0;
      card.targetRotation = archRot;
    }
  });
}

/**
 * Updates card layout coordinates for opponent's hand (hidden/facedown).
 */
export function layoutOpponentHand(hand, canvasWidth = 1280) {
  const count = hand.length;
  if (count === 0) return;

  const cardWidth = GAME_CONFIG.CARD_WIDTH * 0.75;
  const spacing = Math.min(cardWidth * 0.7, (canvasWidth - 400) / Math.max(count, 1));
  const startX = (canvasWidth - spacing * (count - 1)) / 2;
  const baseY = -35;

  hand.forEach((card, index) => {
    card.targetX = startX + index * spacing;
    card.targetY = baseY;
    card.targetScale = 0.75;
    card.targetRotation = ((index - (count - 1) / 2) / Math.max(1, count)) * 0.05;
  });
}

/**
 * Smoothly interpolates card physical properties towards targets.
 */
export function updateCardTransforms(card, delta = 0.16) {
  const lerpFactor = Math.min(1, delta * 14);
  card.x += (card.targetX - card.x) * lerpFactor;
  card.y += (card.targetY - card.y) * lerpFactor;
  card.scale += (card.targetScale - card.scale) * lerpFactor;
  card.rotation += (card.targetRotation - card.rotation) * lerpFactor;
  card.alpha += (card.targetAlpha - card.alpha) * lerpFactor;
}
