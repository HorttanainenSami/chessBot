import { useState } from 'react';
import Long from 'long';

type Color = 'black'|'white';
export type PieceSymbol = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type Square =
    'a8' | 'b8' | 'c8' | 'd8' | 'e8' | 'f8' | 'g8' | 'h8' |
    'a7' | 'b7' | 'c7' | 'd7' | 'e7' | 'f7' | 'g7' | 'h7' |
    'a6' | 'b6' | 'c6' | 'd6' | 'e6' | 'f6' | 'g6' | 'h6' |
    'a5' | 'b5' | 'c5' | 'd5' | 'e5' | 'f5' | 'g5' | 'h5' |
    'a4' | 'b4' | 'c4' | 'd4' | 'e4' | 'f4' | 'g4' | 'h4' |
    'a3' | 'b3' | 'c3' | 'd3' | 'e3' | 'f3' | 'g3' | 'h3' |
    'a2' | 'b2' | 'c2' | 'd2' | 'e2' | 'f2' | 'g2' | 'h2' |
    'a1' | 'b1' | 'c1' | 'd1' | 'e1' | 'f1' | 'g1' | 'h1';
enum bitPieces {
  'P',
  'p',
  'R',
  'r',
  'B',
  'b',
  'N',
  'n',
  'Q',
  'q',
  'K',
  'k',
}
/*
pieces represented in 64 bit, 1 = piece, 0 = not piece 
*/
const startState: Long[] = [
  //pawns
  new Long(0x0000F000, 0x00000000, true),//w
  new Long(0x0, 0x00FF0000, true),//b
  //rooks
  new Long(0x81, 0x0, true),//w
  new Long(0x0, 0x81000000, true),//b and so on...
  //bishops
  new Long(0x24, 0x0, true),
  new Long(0x0, 0x24000000, true),
  //knights
  new Long(0x42, 0x0, true),
  new Long(0x0, 0x42000000, true),
  //queens
  new Long(0x10, 0x0, true),
  new Long(0x0, 0x10000000, true),
  //kings
  new Long(0x8, 0x0, true),
  new Long(0x0, 0x8000000, true),

];
interface Move {
  from: Square,
  to: Square,
  promotion: PieceSymbol,
  captured?: PieceSymbol,
  color: Color,
}
const useChess = () => {
  // save gamestate as bitboard
  const [ gameState, setGameState ] = useState(startState);
  const [ turn, setTurn ] = useState<'w'|'b'>('w');
  //checks if castling is possible '' means not possible
  const  [castling, setCastling] = useState('KQkq');
  const [ elPassant, setElPassant ] = useState<string>('-');
  const [ halfMove, setHalfMove ] = useState(0);
  const [ fullMove, setFullMove ] = useState(1);

  // returns all valid moves in Move[] 
  // optional parameter /square/: Only return moves of given piece
  const moves = () => {
    return {};
  };
  // Move object or Algerbaic notation ie. Ng3 means knigth moves for g3 coortidane
  const makeMove = (move: Move|string) => {
    console.log(move); 
    validateMove();

    return {};
  };
  const loadFEN = (Fen: string) => {
    const splittedFen = Fen.split(' ');
    if(splittedFen.length !=6) throw new Error('Fen not in correct form');

    const fstate = splittedFen[0] as string;
    const fturn = splittedFen[1] as 'w'|'b';
    const fcastling = splittedFen[2] as string;
    const fElPassant = splittedFen[3] as string;
    const fhalfMoves = splittedFen[4] as string;
    const ffullMoves = splittedFen[5] as string;

    if(!isNumeric(ffullMoves)) throw new Error('Fen fullMoves notated incorrectly');
    if(!isNumeric(fhalfMoves)) throw new Error('Fen halfMoves notated incorrectly');

    //iterate fen
    type PieceIteration = {
      piece: string,
      bitIndex: number,
    }
    type emptyIteration = {
      zeros: number,
      bitIndex: number
    }
    const newGame = Array(12).fill(new Long(0,0,true));
    const iterator = (prop: PieceIteration|emptyIteration) => {
      //add either 1 or multiple 0's
      if('zeros' in prop){return; }

      const { piece, bitIndex } = prop;
      const bitOperator =  new Long(1, 0x0, true).shiftLeft(bitIndex);
      switch(piece){
      case 'P':
        //0
        newGame[0] = newGame[0].or(bitOperator);
        break;
      case 'p':
        //1
        newGame[1] = newGame[1].or(bitOperator);
        break;
      case 'R':
        //2
        newGame[2] = newGame[2].or(bitOperator);
        break;
      case 'r':
        //3
        newGame[3] = newGame[3].or(bitOperator);
        break;
      case 'B':
        //4
        newGame[4] = newGame[4].or(bitOperator);
        break;
      case 'b':
        //5
        newGame[5] = newGame[5].or(bitOperator);
        break;
      case 'N':
        //6
        newGame[6] = newGame[6].or(bitOperator);
        break;
      case 'n':
        //7
        newGame[7] = newGame[7].or(bitOperator);
        break;
      case 'Q':
        //8
        newGame[8] = newGame[8].or(bitOperator);
        break;
      case 'q':
        //9
        newGame[9] = newGame[9].or(bitOperator);
        break;
      case 'K':
        //10
        newGame[10] = newGame[10].or(bitOperator);
        break;
      case 'k':
        //11
        newGame[11] = newGame[11].or(bitOperator);
        break;
      }
    };
    let i = 63;
    for( let c of fstate) {
      if(c === '/'){
        console.log(i, '/');
        continue;
      }
      if(isNumeric(c)){
        iterator({ zeros: Number(c), bitIndex: i }); 
        i-=Number(c);
        continue;
      }else {
        iterator({ piece: c, bitIndex: i }); 
      }
      i--;
    }
    setTurn(turn);
    setGameState(newGame);
    setHalfMove(Number(fhalfMoves));
    setFullMove(Number(ffullMoves));
    setElPassant(fElPassant);
    setCastling(fcastling);
    

    return newGame;
  };

  const clearBoard = () => setGameState( new Array(12).fill(new Long(0x0,0x0, true)));

  const getFEN = () => {
    let Fen = '';
    const pieceBitboard = gameState.reduce((acc, curr) => acc.or(curr), new Long(0x0,0x0, true)); 

    for(let idx = 8; idx > 0; idx--){
      let empty=0;
      //let str = `${idx}: `;
      for(let i = 7; i >= 0; i--) {
        //str = str.concat(' ');
        const bitIndex = idx*8-(8-i);
        //str = str.concat(bitIndex.toString());
        //str = str.concat(`(${idx*8-(8-i)})`);
        if(!checkBitAt(pieceBitboard, bitIndex)){
          empty++;
          continue;
        }

        //should check what bitboard contains 1 bit at bitIndex and add it to FEN string
        if(empty !== 0){
          Fen = Fen.concat(empty.toString());
          //str = str.concat(empty.toString());
          empty=0;
        }
        for(let x = 0; x < gameState.length; x++){
          const bitBoard = gameState[x] as Long;
          if(!checkBitAt(bitBoard, bitIndex)){
            continue;
          }
          const piece = bitPieces[x];
          if(!piece) throw new Error(`piece ${x} not found`);
          Fen = Fen.concat(piece);
          //str = str.concat(piece);
          break;
        }
      }
     
      if(empty !== 0){
        Fen = Fen.concat(empty.toString());
        //str = str.concat(empty.toString());
      }

      if(idx === 1 ){
        //console.log(str);
        break; 
      }
      Fen = Fen.concat('/');
      //console.log(str + '/');
      
    }
    return Fen.concat(` ${turn} ${castling} ${elPassant} ${halfMove} ${fullMove}`);
  };

  const validateMove = () => {

    return {};
  };
  return { loadFEN, clearBoard, getFEN, moves, gameState, makeMove};
};
function isNumeric(expectedValue:string) {
  if (typeof expectedValue === 'string' && !Number.isNaN(Number(expectedValue))) {
    return true;
  }
  return false;
}
function checkBitAt(long : Long, index: number){
  return long.shiftRight(index).and(1).toInt()===1;
}
export default useChess;
