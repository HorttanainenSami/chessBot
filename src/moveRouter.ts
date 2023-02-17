const moveRouter = require('express').Router();
import { Response, Request } from 'express';
import { Color } from './Types';
import { getState, makeMove } from './GameLogic/gameStateChanger';
import { getFEN, loadFEN } from './GameLogic/fen';
import {} from './GameLogic/moveMask';
import Long from 'long';
import { getMoves } from './GameLogic/move';

moveRouter.get('/getState', (request: Request, response: Response) => {
  response.send(getState());
});
moveRouter.post('/makeMove', (request: Request, response: Response) => {
  const m = makeMove(request.body);
  response.send(m);
});

moveRouter.get('/getMoves/w', (request: Request, response: Response) => {
  const color: Color = 'w';
  const state = getState();
  const moves: Long[] = getMoves({ color, state });
  response.json(moves);
});
moveRouter.get('/getMoves/b', (request: Request, response: Response) => {
  const color: Color = 'b';
  const state = getState();

  const moves: Long[] = getMoves({ color, state });
  response.json(moves);
});

moveRouter.post('/loadFEN', (request: Request, response: Response) => {
  const { fen } = request.body;
  const state = loadFEN(fen);
  response.send(state);
});
moveRouter.get('/getFEN', (request: Request, response: Response) => {
  const fen = getFEN();
  response.send(fen);
});

module.exports = moveRouter;
