export const BOARD_WIDTH = 1000;
export const DIGIT_MASKS = {
  four: [
    "110000011",
    "110000011",
    "110000011",
    "110000011",
    "110000011",
    "111111111",
    "111111111",
    "000000011",
    "000000011",
    "000000011",
    "000000011",
  ],
  zero: [
    "011111110",
    "111111111",
    "110000011",
    "110000011",
    "110000011",
    "110000011",
    "110000011",
    "110000011",
    "110000011",
    "111111111",
    "011111110",
  ],
} as const;

export type Brick = {
  x: number;
  y: number;
  width: number;
  height: number;
  alive: boolean;
};
export type Game = {
  height: number;
  bricks: Brick[];
  remaining: number;
  phase: "ready" | "playing" | "won";
  paddle: {
    x: number;
    target: number;
    y: number;
    width: number;
    height: number;
  };
  ball: { x: number; y: number; vx: number; vy: number; radius: number };
};

export function createBricks(height: number): Brick[] {
  const cell = Math.min(26, (height * 0.55) / 11);
  const left = (BOARD_WIDTH - cell * 33) / 2;
  const top = Math.min(70, height * 0.08);
  return [DIGIT_MASKS.four, DIGIT_MASKS.zero, DIGIT_MASKS.four].flatMap(
    (mask, digit) =>
      mask.flatMap((row, y) =>
        [...row].flatMap((pixel, x) =>
          pixel === "1"
            ? [
                {
                  x: left + (digit * 12 + x) * cell,
                  y: top + y * cell,
                  width: cell * 0.83,
                  height: cell * 0.83,
                  alive: true,
                },
              ]
            : [],
        ),
      ),
  );
}

export function createGame(height: number): Game {
  const bricks = createBricks(height);
  const game: Game = {
    height,
    bricks,
    remaining: bricks.length,
    phase: "ready",
    paddle: { x: 500, target: 500, y: height - 35, width: 170, height: 9 },
    ball: { x: 500, y: 0, vx: 0, vy: 0, radius: 7 },
  };
  parkBall(game);
  return game;
}

export function parkBall(game: Game) {
  game.phase = "ready";
  game.ball.x = game.paddle.x;
  game.ball.y = game.paddle.y - game.ball.radius - 3;
  game.ball.vx = 0;
  game.ball.vy = 0;
}

export function aimPaddle(game: Game, x: number) {
  game.paddle.target = Math.max(
    game.paddle.width / 2,
    Math.min(BOARD_WIDTH - game.paddle.width / 2, x),
  );
}

export function launchBall(game: Game) {
  if (game.phase !== "ready") return;
  const speed = Math.min(1100, Math.max(580, game.height * 0.8));
  game.phase = "playing";
  game.ball.vx = speed * 0.32;
  game.ball.vy = -speed * Math.sqrt(1 - 0.32 ** 2);
}

export function advanceGame(game: Game, elapsed: number) {
  const dt = Math.max(0, Math.min(elapsed, 1 / 30));
  game.paddle.x +=
    (game.paddle.target - game.paddle.x) * (1 - Math.exp(-22 * dt));
  if (game.phase === "ready") {
    game.ball.x = game.paddle.x;
    return;
  }
  if (game.phase !== "playing") return;
  const { ball, paddle } = game;
  // 高速移動でも小さなブロックを通り抜けないように分割する。
  const steps = Math.max(
    1,
    Math.ceil((Math.hypot(ball.vx, ball.vy) * dt) / (ball.radius * 0.7)),
  );
  for (let i = 0; i < steps && game.phase === "playing"; i++) {
    const previousX = ball.x;
    const previousY = ball.y;
    ball.x += (ball.vx * dt) / steps;
    ball.y += (ball.vy * dt) / steps;
    if (ball.x < ball.radius || ball.x > BOARD_WIDTH - ball.radius) {
      ball.x = Math.max(
        ball.radius,
        Math.min(BOARD_WIDTH - ball.radius, ball.x),
      );
      ball.vx *= -1;
    }
    if (ball.y < ball.radius) {
      ball.y = ball.radius;
      ball.vy = Math.abs(ball.vy);
    }
    if (
      ball.vy > 0 &&
      previousY + ball.radius <= paddle.y &&
      ball.y + ball.radius >= paddle.y &&
      Math.abs(ball.x - paddle.x) <= paddle.width / 2 + ball.radius
    ) {
      const offset = Math.max(
        -1,
        Math.min(1, (ball.x - paddle.x) / (paddle.width / 2)),
      );
      const speed = Math.hypot(ball.vx, ball.vy);
      const angle = offset * 1.05;
      ball.vx = speed * Math.sin(angle);
      if (Math.abs(ball.vx) < speed * 0.14)
        ball.vx = speed * 0.14 * (offset < 0 ? -1 : 1);
      ball.vy = -Math.sqrt(speed ** 2 - ball.vx ** 2);
      ball.y = paddle.y - ball.radius;
    }
    for (const brick of game.bricks) {
      if (!brick.alive) continue;
      const nearestX = Math.max(
        brick.x,
        Math.min(brick.x + brick.width, ball.x),
      );
      const nearestY = Math.max(
        brick.y,
        Math.min(brick.y + brick.height, ball.y),
      );
      if (
        (ball.x - nearestX) ** 2 + (ball.y - nearestY) ** 2 >
        ball.radius ** 2
      )
        continue;
      brick.alive = false;
      game.remaining--;
      if (
        previousY + ball.radius <= brick.y ||
        previousY - ball.radius >= brick.y + brick.height
      ) {
        ball.vy *= -1;
        ball.y = previousY;
      } else if (
        previousX + ball.radius <= brick.x ||
        previousX - ball.radius >= brick.x + brick.width
      ) {
        ball.vx *= -1;
        ball.x = previousX;
      } else {
        ball.vy *= -1;
        ball.y = previousY;
      }
      if (game.remaining === 0) game.phase = "won";
      break;
    }
    if (ball.y - ball.radius > game.height) parkBall(game);
  }
}
