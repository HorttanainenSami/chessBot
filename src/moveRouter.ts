const moveRouter = require('express').Router();
import { Response, Request } from 'express';
import { Color } from './Types';
import {
  loadFEN,
  getFEN,
  makeMove,
  getMoves,
} from './GameLogic/gameStateChanger';

import {
  gameState,
  pinned,
  checked,
  doubleChecked,
  checkingRays,
  mate,
  turn,
} from './GameLogic/move';
import Long from 'long';

moveRouter.get('/getState', (request: Request, response: Response) => {
  const state = {
    gameState,
    pinned,
    checked,
    doubleChecked,
    checkingRays,
    mate,
    turn,
  };
  response.send(state);
});
moveRouter.post('/makeMove', (request: Request, response: Response) => {
  const m = makeMove(request.body);
  response.send(m);
});

moveRouter.get('/getMoves/w', (request: Request, response: Response) => {
  const color: Color = 'w';
  const moves: Long[] = getMoves(color);
  response.json(moves);
});
moveRouter.get('/getMoves/b', (request: Request, response: Response) => {
  const color: Color = 'b';
  const moves: Long[] = getMoves(color);
  response.json(moves);
});

moveRouter.post('/loadFEN', (request: Request, response: Response) => {
  const { fen } = request.body;
  console.log(fen);
  loadFEN(fen);
  const state = {
    gameState,
    pinned,
    checked,
    doubleChecked,
    checkingRays,
    mate,
    turn,
  };

  response.send(state);
});
moveRouter.get('/getFEN', (request: Request, response: Response) => {
  const fen = getFEN();

  response.send(fen);
});

module.exports = moveRouter;
