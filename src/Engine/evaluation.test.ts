import Long from 'long';
import { loadFEN } from '../GameLogic/fen';
import {
  evaluate,
  getPawnStructureValue,
  getPositionalValue,
  pawnStructure,
} from './evaluation';
import { getState } from '../GameLogic/gameStateChanger';

describe('pawnStructure', () => {
  it('it returns right values', () => {
    loadFEN(
      'rnbqkbnr/ppp3pp/4p3/4pp2/1P2P3/3P2P1/P1P3PP/RNBQKBNR w KQkq - 0 1'
    );
    const { gameState } = getState();
    const occupied = gameState.reduce((a, s) => a.or(s), Long.UZERO);
    const { isolated, doubled, blocked } = pawnStructure(
      gameState[0],
      gameState[1],
      occupied,
      'w'
    );
    expect(doubled).toEqual(2);
    expect(blocked).toEqual(2);
  });
  it('pawnStructure', () => {
    loadFEN(
      'rnbqkbnr/ppp3pp/4p3/4pp2/1P2P1P1/3P4/P1P3PP/RNBQKBNR w KQkq - 0 1'
    );
    const { gameState } = getState();
    const occupied = gameState.reduce((a, s) => a.or(s), Long.UZERO);
    const { isolated, doubled, blocked } = pawnStructure(
      gameState[0],
      gameState[1],
      occupied,
      'w'
    );
    expect(doubled).toEqual(2);
    expect(blocked).toEqual(1);
    expect(isolated).toEqual(0);
  });
  it('pawnStructure', () => {
    loadFEN('rnbqkbnr/ppp3pp/4p3/4pp2/4P1P1/4P3/P1P3PP/RNBQKBNR w KQkq - 0 1');
    const { gameState } = getState();
    const occupied = gameState.reduce((a, s) => a.or(s), Long.UZERO);
    const { isolated, doubled, blocked } = pawnStructure(
      gameState[0],
      gameState[1],
      occupied,
      'w'
    );
    expect(doubled).toEqual(4);
    expect(blocked).toEqual(2);
    expect(isolated).toEqual(4);
  });
  it('pawnStructure', () => {
    loadFEN('rnbqkbnr/ppp3pp/4p3/4pp2/4P1P1/4P3/P1P3PP/RNBQKBNR w KQkq - 0 1');
    const { gameState } = getState();
    const occupied = gameState.reduce((a, s) => a.or(s), Long.UZERO);
    const w = pawnStructure(gameState[0], gameState[1], occupied, 'w');
    expect(w.doubled).toEqual(4);
    expect(w.blocked).toEqual(2);
    expect(w.isolated).toEqual(4);
    const b = pawnStructure(gameState[1], gameState[0], occupied, 'b');
    expect(b.doubled).toEqual(2);
    expect(b.blocked).toEqual(2);
    expect(b.isolated).toEqual(0);
    const result = getPawnStructureValue(gameState, occupied);
    expect(result).toBe(-300);
  });
});

describe('evaluation', () => {
  it('should return positive number when white has advantage', () => {
    loadFEN('6k1/8/8/8/8/8/6r1/3RRN1K b - - 4 3');
    const state = getState();
    const result = evaluate(state, 0);
    expect(result).toBeGreaterThan(0);
  });
  it('should return negative number when black has advantage', () => {
    loadFEN('6k1/8/8/6r1/6q1/8/8/5N1K b - - 4 3');
    const state = getState();
    const result = evaluate(state, 0);
    console.log(result);
    expect(result).toBeLessThan(0);
  });
  it('should return bigger number from mate when depth is higher', () => {
    loadFEN('6k1/8/8/6r1/8/8/6q1/5N1K w - - 4 3');
    const state = getState();
    const result1 = Math.abs(evaluate(state, 0));
    const result2 = Math.abs(evaluate(state, 1));
    const result3 = Math.abs(evaluate(state, 2));
    const result4 = Math.abs(evaluate(state, 4));
    expect(result1).toBeLessThan(result2);
    expect(result2).toBeLessThan(result3);
    expect(result3).toBeLessThan(result4);
  });
  it('getPositinal value of start of game', () => {
    loadFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    const { gameState } = getState();
    const result = getPositionalValue(gameState, true);
    console.log(result);
    expect(result).toBe(0);
  });
});
