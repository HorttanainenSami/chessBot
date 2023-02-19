import axios from 'axios';
import { SquareBit, bitPieces } from './helpers';
import { Color, Square, Move } from '../Types';
import Long from 'long';

// Make a request for a user with a given ID
const url = 'http://localhost:3001';

export type getMovesReturn = Map<SquareBit, IAllMoves>;
interface IAllMoves {
  piece: bitPieces;
  color: Color;
  moves: Long;
}
interface IgetState {
  gameState: Long[];
  pinned: boolean;
  check: boolean;
  doubleCheck: boolean;
  checkingRays: Long;
  mate: boolean;
  turn: Color;
}
const useChessApi = () => {
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

  const getFEN = async (): Promise<string> => {
    const r = await axios.get<string>(url + '/getFEN');
    return r.data;
  };
  const getMovesW = async (): Promise<getMovesReturn> => {
    const r = await axios.get<[number, IAllMoves][]>(url + '/getMoves/w');
    //somehow long is needed to cast again in Long object
    const typedObject = r.data.map((r) => {
      r[1].moves = Long.fromValue(r[1].moves);
      return r;
    });
    const map: getMovesReturn = new Map(typedObject);

    return map;
  };
  const getMovesB = async (): Promise<getMovesReturn> => {
    const r = await axios.get<[number, IAllMoves][]>(url + '/getMoves/b');
    const typedObject = r.data.map((r) => {
      r[1].moves = Long.fromValue(r[1].moves);
      return r;
    });
    const map: getMovesReturn = new Map(typedObject);

    return map;
  };
  const getBotMove = async (): Promise<IgetState> => {
    const response = await axios.get<IgetState>(url + '/getMoves/bot');
    console.log(response.data);
    return response.data;
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
    getBotMove,
  };
};

export default useChessApi;
