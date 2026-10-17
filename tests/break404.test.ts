import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DIGIT_MASKS,
  createGame,
  aimPaddle,
  launchBall,
  advanceGame,
} from "../lib/break404.ts";

test("zero has two wide sides, a hollow center and closed ends", () => {
  const zero = DIGIT_MASKS.zero;
  assert.equal(zero.length, DIGIT_MASKS.four.length);
  for (const row of zero.slice(2, -2)) assert.match(row, /^11\d{5}11$/);
  assert.equal(zero[5], "110000011");
  assert.equal(zero[1], "111111111");
  assert.equal(zero.at(-2), "111111111");
  const game = createGame(800);
  const thirds = [0, 0, 0];
  for (const brick of game.bricks) thirds[Math.floor((brick.x - 71) / 312)]++;
  assert.equal(thirds[0], thirds[2]);
  assert.ok(thirds[1] > thirds[0]);
});

test("paddle is bounded, follows input, and carries the waiting ball", () => {
  const game = createGame(800);
  aimPaddle(game, -1000);
  for (let i = 0; i < 120; i++) advanceGame(game, 1 / 60);
  assert.ok(game.paddle.x >= game.paddle.width / 2);
  assert.ok(game.paddle.x < 86);
  assert.equal(game.ball.x, game.paddle.x);
  aimPaddle(game, 2000);
  assert.equal(game.paddle.target, 915);
});

test("ball rebounds from walls and paddle, losing a ball preserves progress", () => {
  const game = createGame(800);
  launchBall(game);
  Object.assign(game.ball, { x: 8, y: 500, vx: -600, vy: 0 });
  advanceGame(game, 1 / 30);
  assert.ok(game.ball.vx > 0);
  Object.assign(game.ball, { x: 500, y: game.paddle.y - 9, vx: 0, vy: 600 });
  advanceGame(game, 1 / 60);
  assert.ok(game.ball.vy < 0);
  assert.ok(Math.abs(game.ball.vx) > 0);
  const remaining = game.remaining;
  Object.assign(game.ball, { x: 50, y: 810, vx: 0, vy: 600 });
  advanceGame(game, 1 / 60);
  assert.equal(game.phase, "ready");
  assert.equal(game.remaining, remaining);
  launchBall(game);
  assert.equal(game.phase, "playing");
});

test("fast ball hits a small brick and last destruction enters won state", () => {
  const game = createGame(800);
  game.bricks = [{ x: 480, y: 300, width: 22, height: 4, alive: true }];
  game.remaining = 1;
  launchBall(game);
  Object.assign(game.ball, { x: 490, y: 340, vx: 0, vy: -4000 });
  advanceGame(game, 1 / 30);
  assert.equal(game.remaining, 0);
  assert.equal(game.bricks[0].alive, false);
  assert.equal(game.phase, "won");
});

test("entire board can be cleared through actual collision updates", () => {
  const game = createGame(800);
  launchBall(game);
  for (const brick of game.bricks) {
    if (!brick.alive) continue;
    Object.assign(game.ball, {
      x: brick.x + brick.width / 2,
      y: brick.y + brick.height + 8,
      vx: 0,
      vy: -600,
    });
    advanceGame(game, 1 / 60);
    assert.equal(brick.alive, false);
  }
  assert.equal(game.remaining, 0);
  assert.equal(game.phase, "won");
});

test("nearby pixels break together, distant pixels survive, reduced motion stays quiet", () => {
  for (const reduced of [false, true]) {
    const game = createGame(800);
    game.bricks = [
      { x: 480, y: 300, width: 22, height: 4, alive: true },
      { x: 505, y: 300, width: 22, height: 4, alive: true },
      { x: 800, y: 300, width: 22, height: 4, alive: true },
    ];
    game.remaining = 3;
    launchBall(game);
    Object.assign(game.ball, { x: 490, y: 340, vx: 0, vy: -4000 });
    advanceGame(game, 1 / 30, reduced);
    assert.equal(game.remaining, 1);
    assert.equal(game.bricks[2].alive, true);
    assert.equal(game.particles.length > 0, !reduced);
    assert.equal(game.glitch > 0, !reduced);
  }
});
