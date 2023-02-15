import axios from 'axios';
import { bitPieces } from './helpers';
import { Color, Square, Move } from '../Types';
import Long from 'long';

// Make a request for a user with a given ID
const url = 'http://localhost:3001';
const useChessApi = () => {
  interface IgetState {
    gameState: Long[];
    pinned: boolean;
    checked: boolean;
    doubleChecked: boolean;
    checkingRays: Long;
    mate: boolean;
    turn: Color;
  }
  const getState = async (): Promise<IgetState> => {
    const response = await axios.get(url + '/getState');
    response.data.gameState = response.data.gameState.map((r: Long) =>
      Long.fromValue(r)
    );
    response.data.checkingRays = Long.fromValue(response.data.checkingRays);
    return response.data;
  };

  const loadFEN = async (fen: string): Promise<IgetState> => {
    const response = await axios.post(url + '/loadFEN', { fen });
    return response.data;
  };

  const getFEN = async () => {
    const r = await axios.get<string>(url + '/getFEN');
    return r;
  };
  const getMovesW = async (): Promise<Long[]> => {
    const r = await axios.get<Long[]>(url + '/getMoves/w');
    //somehow long is needed to cast again in Long object
    const result: Long[] = r.data.map((r) => Long.fromValue(r));
    return result;
  };
  const getMovesB = async (): Promise<Long[]> => {
    const r = await axios.get<Long[]>(url + '/getMoves/b');
    const result: Long[] = r.data.map((r) => Long.fromValue(r));
    return result;
  };
  const makeMove = async (move: Move) => {
    const result = await axios.post(url + '/makeMove', move);
    return result.data;
  };
  return {
    getState,
    loadFEN,
    getFEN,
    makeMove,
    getMovesW,
    getMovesB,
  };
};

export default useChessApi;
