import { useState } from 'react';
import Long from 'long';
import { bitPieces, SquareBit, logger, isNumeric, checkBitAt } from './helpers';
import { Square, Move, Color } from '../Types';
import { pawnLegalMoves, rookLegalMoves, rookPseudoMoves, bishopLegalMoves, bishopPseudoMoves, kingPseudoMoves, knightPseudoMoves } from './moveMasks';
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
export interface IMoves {
  square: Square,
  piece: bitPieces,
  color: Color
}
const useChess = () => {
  // save gamestate as bitboard
  const [ gameState, setGameState ] = useState<Long[]>(startState);
  const [ turn, setTurn ] = useState<'w'|'b'>('w');
  //checks if castling is possible '' means not possible
  const [ castling, setCastling ] = useState('KQkq');
  const [ elPassant, setElPassant ] = useState<string>('-');
  // can be used to set tie if reaches to 50
  const [ halfMove, setHalfMove ] = useState(0);
  const [ fullMove, setFullMove ] = useState(1);

  // returns all valid moves in Move[] 
  // optional parameter /square/: Only return moves of given piece
  const moves = (p : IMoves|null) => {
    // determine if wanted all moves for color that is next in turn
    if(p===null){
      return;
    }
    //wanted specific piece
    const legalMoves = move(p); 
    //turn table for squareNotation array
    const algebricNotation = getBitIndexes(legalMoves);
    return algebricNotation;
    
  };
  //TODO to check discovered check and prevent movement if it occurs
  const move = ({ square, piece, color } : IMoves):Long => {
    const fromBitIndex = SquareBit[square];
    const oneBit = new Long(1,0,true);
    const currentPiecePosition = oneBit.shiftLeft(fromBitIndex);
    const occupiedBits = gameState.reduce((acc, curr) => acc.or(curr), new Long(0x0,0x0, true));
    const blackOccupiedBits = gameState.reduce((acc, curr,i) => {
      if(i%2===0) return acc;
      return acc.or(curr);
    }, new Long(0,0,true));
    const whiteOccupiedBits = occupiedBits.xor(blackOccupiedBits);
    switch(piece){

    case 0:{
      //elpassant
      const legalMoves = pawnLegalMoves({fromBitIndex, color, enemyOccupied: blackOccupiedBits, occupiedSquares:occupiedBits}); 
      return (legalMoves);
    }
    case 1:{
      //elpassant
      const legalMoves = pawnLegalMoves({fromBitIndex, color, enemyOccupied: whiteOccupiedBits, occupiedSquares:occupiedBits}); 
      return legalMoves;
    }
    case 2:{
      const pseudoMoves = rookPseudoMoves({ fromBitIndex });
      const legalMoves = rookLegalMoves({fromBitIndex, occupiedSquares: occupiedBits, teammateOccupiedBits: whiteOccupiedBits, rookMoveMask:pseudoMoves });
      return legalMoves;
    }
    case 3:{
      const pseudoMoves = rookPseudoMoves({ fromBitIndex });
      const legalMoves = rookLegalMoves({fromBitIndex, occupiedSquares: occupiedBits, teammateOccupiedBits: blackOccupiedBits, rookMoveMask:pseudoMoves });
      return legalMoves;
    }
    case 4:{
      const pseudoMoves = bishopPseudoMoves({ fromBitIndex });
      return bishopLegalMoves({possibleMoves: pseudoMoves, bishopPosition: currentPiecePosition, occupiedBits, fromBitIndex, teammateOccupiedBits: whiteOccupiedBits });
    }
    case 5:{
      const pseudoMoves = bishopPseudoMoves({ fromBitIndex });
      return bishopLegalMoves({possibleMoves: pseudoMoves, bishopPosition: currentPiecePosition, occupiedBits, fromBitIndex, teammateOccupiedBits: blackOccupiedBits });
    }
    case 6:{
      const pseudoMoves = knightPseudoMoves({knightPosition: currentPiecePosition });
      const legalMoves = pseudoMoves.and(whiteOccupiedBits.not());
      return legalMoves;
    }
    case 7:{
      const pseudoMoves = knightPseudoMoves({knightPosition: currentPiecePosition });
      const legalMoves = pseudoMoves.and(blackOccupiedBits.not());
      return legalMoves;
    }
    case 8:{
      const pseudoMoves = bishopPseudoMoves({ fromBitIndex });
      const diagonalLegalMoves=bishopLegalMoves({possibleMoves: pseudoMoves, bishopPosition: currentPiecePosition, occupiedBits, fromBitIndex, teammateOccupiedBits: whiteOccupiedBits });

      const RpseudoMoves = rookPseudoMoves({ fromBitIndex });
      const RlegalMoves = rookLegalMoves({fromBitIndex, occupiedSquares: occupiedBits, teammateOccupiedBits: whiteOccupiedBits, rookMoveMask:RpseudoMoves });
      return diagonalLegalMoves.or(RlegalMoves);
    }
    case 9:{
      const pseudoMoves = bishopPseudoMoves({ fromBitIndex });
      const diagonalLegalMoves=bishopLegalMoves({possibleMoves: pseudoMoves, bishopPosition: currentPiecePosition, occupiedBits, fromBitIndex, teammateOccupiedBits: blackOccupiedBits });

      const RpseudoMoves = rookPseudoMoves({ fromBitIndex });
      const RlegalMoves = rookLegalMoves({fromBitIndex, occupiedSquares: occupiedBits, teammateOccupiedBits: blackOccupiedBits, rookMoveMask:RpseudoMoves });
      return diagonalLegalMoves.or(RlegalMoves);
    }
    case 10:{
      const pseudoMoves =  kingPseudoMoves({kingPosition: currentPiecePosition});
      // TODO add here also defended squares filter
      return pseudoMoves.and(whiteOccupiedBits.not());
    }
    case 11:{
      const pseudoMoves =  kingPseudoMoves({kingPosition: currentPiecePosition});
      // TODO add here also defended squares filter
      return pseudoMoves.and(blackOccupiedBits.not());
    }
    default: return new Long(0,0,true);
    }

  };
  const updateGameState = ({piece, color, from, to} : Move) => {
    
    const toBitIndex = SquareBit[to];
    const fromBitIndex = SquareBit[from];
    let moveBoard = gameState[piece] as Long;
    //update moved piece
    const toMask = Long.UONE.shiftLeft(toBitIndex);
    const fromMask = Long.UONE.shiftLeft(fromBitIndex);
    moveBoard = moveBoard.and(fromMask.not());
    moveBoard = moveBoard.or(toMask);
    //remove captured pieces
    const deletedPieces = removeCapturedPiece(toBitIndex, color); 




    //promote pawn
    //set check or mate
    //set/remove elpassant

    let modifiedGameState = gameState;
    if(deletedPieces){
      modifiedGameState[deletedPieces.i] = deletedPieces.pieces;
    }
    modifiedGameState[piece] = moveBoard;


    //final state changes
    setGameState(modifiedGameState);
    //set if pawn moved or piece captured to 0 otherwise increment
    if(piece === 1 || piece === 0|| deletedPieces){
      setHalfMove(0);
    }else{
      setHalfMove(r => r+=1);
    }

    if(turn ==='b'){
      setFullMove(r => r+=1);
    }
    setTurn(r => r==='b'?'w':'b');
    
  };
  const removeCapturedPiece = (fromBitIndex: number, color: Color) => {
    // white pieces is even and black odd in gamestate Array so we need to set this even for black odd
    const forHelper = color==='w'? 1:0;
    const capturedPiece = Long.UONE.shiftLeft(fromBitIndex);
    logger(capturedPiece);
    for(let i = forHelper; i<gameState.length; i+=2){
      let pieces = gameState[i] as Long;
      if(!capturedPiece.and(pieces).isZero()){
        pieces = pieces.and(capturedPiece.not());
        return {i, pieces};
      }
    }

  };
  // Move object or Algerbaic notation ie. Ng3 means knigth moves for g3 coortidane
  const makeMove = (props : Move) => {
    const {piece, color, from, to} = props;
    const obj = {
      square: from,
      color,
      piece
    };
    if(color !== turn){
      return false;
    }
    const toBitIndex = SquareBit[to];
    const targetMask = Long.UONE.shiftLeft(toBitIndex);
    const validate =  !move(obj).and(targetMask).isZero();
    if(validate) {
      updateGameState(props);
      return true;
    }
    return false;
  };
  // returns true if move is legal to perform
  // checked only when makeMove is performed
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

  //returns FEN notation of gamestate. Useful for testing
  const getFEN = () => {
    let Fen = '';
    const pieceBitboard = gameState.reduce((acc, curr) => acc.or(curr), new Long(0x0,0x0, true)); 

    for(let idx = 8; idx > 0; idx--){
      let empty=0;
      for(let i = 7; i >= 0; i--) {
        const bitIndex = idx*8-(8-i);
        if(!checkBitAt(pieceBitboard, bitIndex)){
          empty++;
          continue;
        }

        //should check what bitboard contains 1 bit at bitIndex and add it to FEN string
        if(empty !== 0){
          Fen = Fen.concat(empty.toString());
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
          break;
        }
      }
     
      if(empty !== 0){
        Fen = Fen.concat(empty.toString());
      }

      if(idx === 1 ){
        break; 
      }
      Fen = Fen.concat('/');
    }
    return Fen.concat(` ${turn} ${castling} ${elPassant} ${halfMove} ${fullMove}`);
  };

  return { loadFEN, clearBoard, getFEN, moves, gameState, makeMove};
};
const getBitIndexes = (bitString: Long) => {
  let algebricNotation:string[] = [];
  const bit = bitString.toString(2);
  
  for( let i = bit.length-bitString.countTrailingZeros(); i>=0;i--){
    const hexAtI = bit.charAt(i);
    switch(hexAtI){
    case '1':{
      algebricNotation = [...algebricNotation, SquareBit[bit.length-i-1] as string];
      break;
    }
    }
  }

  return algebricNotation;
};
export default useChess;

