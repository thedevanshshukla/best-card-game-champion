// Aetherbound: Runes of the Void - Tactical AI Decision Engine
// Module: ai.js

import { COMBO_RECIPES } from './config.js';

/**
 * Tactical evaluation of the battle state for AI decision making.
 * Evaluates lethal burst, defensive survivability, and elemental combo chaining.
 */
export class TacticalAI {
  constructor(difficulty = 'normal') {
    this.difficulty = difficulty;
  }

  /**
   * Plans the sequence of cards to play this turn based on available mana and board state.
   * Returns an array of card instances to play in order.
   */
  planTurn(aiState, playerState) {
    const hand = [...aiState.hand];
    let currentMana = aiState.mana;
    const playSequence = [];

    // 1. LETHAL CHECK: Can AI finish the player off this turn?
    const lethalPlan = this.findLethalSequence(hand, currentMana, playerState);
    if (lethalPlan && lethalPlan.length > 0) {
      return lethalPlan;
    }

    // 2. SURVIVAL CHECK: Is AI under lethal threat or critical health?
    const underPressure = aiState.hp <= 12 || (aiState.hp <= 18 && playerState.burn + playerState.poison >= 4);
    if (underPressure) {
      const defensivePlan = this.findDefensiveSequence(hand, currentMana, aiState);
      if (defensivePlan && defensivePlan.length > 0) {
        defensivePlan.forEach((card) => {
          playSequence.push(card);
          currentMana -= card.cost;
          const idx = hand.indexOf(card);
          if (idx !== -1) hand.splice(idx, 1);
        });
      }
    }

    // 3. COMBO OPTIMIZATION: Look for matching elemental combo pairs in hand
    const comboPlan = this.findBestComboPair(hand, currentMana);
    if (comboPlan && comboPlan.length === 2) {
      comboPlan.forEach((card) => {
        playSequence.push(card);
        currentMana -= card.cost;
        const idx = hand.indexOf(card);
        if (idx !== -1) hand.splice(idx, 1);
      });
    }

    // 4. VALUE PLAYS: Fill remaining mana curve with highest impact cards
    const remainingAffordable = hand
      .filter((card) => card.cost <= currentMana)
      .sort((a, b) => this.evaluateCardValue(b, aiState, playerState) - this.evaluateCardValue(a, aiState, playerState));

    for (const card of remainingAffordable) {
      if (card.cost <= currentMana) {
        playSequence.push(card);
        currentMana -= card.cost;
      }
    }

    return playSequence;
  }

  /**
   * Evaluates if any combination of affordable cards in hand deals >= effective player HP.
   */
  findLethalSequence(hand, mana, playerState) {
    const effectivePlayerHP = playerState.hp + playerState.ward;
    const affordable = hand.filter((c) => c.cost <= mana);

    // Single card lethal
    for (const card of affordable) {
      if (card.damage >= effectivePlayerHP) {
        return [card];
      }
    }

    // 2-card lethal combinations
    for (let i = 0; i < affordable.length; i++) {
      for (let j = 0; j < affordable.length; j++) {
        if (i === j) continue;
        const c1 = affordable[i];
        const c2 = affordable[j];
        if (c1.cost + c2.cost <= mana) {
          let totalDmg = c1.damage + c2.damage;
          // Check for combo bonus damage
          const combo = COMBO_RECIPES.find(
            (r) =>
              (r.elements[0] === c1.element && r.elements[1] === c2.element) ||
              (r.elements[0] === c2.element && r.elements[1] === c1.element),
          );
          if (combo) totalDmg += combo.bonusDamage;

          if (totalDmg >= effectivePlayerHP) {
            return [c1, c2];
          }
        }
      }
    }

    return null;
  }

  /**
   * Finds the best defensive cards (Heal, Ward, Freeze) when health is endangered.
   */
  findDefensiveSequence(hand, mana, aiState) {
    const defensiveCards = hand
      .filter((c) => c.cost <= mana && (c.ward > 0 || c.heal > 0 || c.freeze > 0))
      .sort((a, b) => b.ward + b.heal * 1.2 + b.freeze * 3 - (a.ward + a.heal * 1.2 + a.freeze * 3));

    const selected = [];
    let remMana = mana;
    for (const card of defensiveCards) {
      if (card.cost <= remMana) {
        selected.push(card);
        remMana -= card.cost;
      }
    }
    return selected;
  }

  /**
   * Finds pairs of cards that trigger high value elemental combo synergies.
   */
  findBestComboPair(hand, mana) {
    let bestPair = null;
    let highestScore = 0;

    for (let i = 0; i < hand.length; i++) {
      for (let j = i + 1; j < hand.length; j++) {
        const c1 = hand[i];
        const c2 = hand[j];
        if (c1.cost + c2.cost <= mana) {
          const combo = COMBO_RECIPES.find(
            (r) =>
              (r.elements[0] === c1.element && r.elements[1] === c2.element) ||
              (r.elements[0] === c2.element && r.elements[1] === c1.element),
          );

          if (combo) {
            const score = combo.bonusDamage * 1.5 + combo.bonusWard * 1.2 + combo.bonusHeal * 1.3 + 10;
            if (score > highestScore) {
              highestScore = score;
              // Order by sequence matching combo recipe if possible
              if (combo.elements[0] === c1.element) {
                bestPair = [c1, c2];
              } else {
                bestPair = [c2, c1];
              }
            }
          }
        }
      }
    }

    return bestPair;
  }

  /**
   * Heuristic score for general card utility.
   */
  evaluateCardValue(card, aiState, playerState) {
    let score = card.damage * 1.2;
    score += card.ward * 0.9;
    score += card.heal * 1.0;
    score += card.burn * 1.5;
    score += card.poison * 1.4;
    score += card.freeze * 2.5;
    score += card.draw * 2.0;
    if (card.manaSteal) score += card.manaSteal * 3.0;
    return score;
  }
}
