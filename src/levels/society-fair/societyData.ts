/* =========================================================
   SOCIETY FAIR — SHARED DATA
   Society Fair module owns all of this data. Nothing here is
   imported by, or affects, any other level.
   ========================================================= */

export type Pt = { x: number; y: number };

export type SocietyId = 'astronomy' | 'statistics' | 'math' | 'developers';

export type SocietyStage =
  | 'notVisited'
  | 'introduced'
  | 'gameAvailable'
  | 'gameCompleted'
  | 'codeUnlocked';

export type PhoneOrientation = 'portrait' | 'landscape';

export type SocietyDef = {
  id: SocietyId;
  name: string;
  emoji: string;
  code: string;
  p: Pt;
  npcKind: 'host' | 'student';
  orientation: PhoneOrientation;
  greeting: string;
  activityPrompt: string;
  reminder: string;
  afterComplete: string;
};

export const SOCIETIES: SocietyDef[] = [
  {
    id: 'astronomy',
    name: 'Astronomy Society',
    emoji: '🌌',
    code: 'AST',
    p: { x: 310, y: 700 },
    npcKind: 'student',
    orientation: 'portrait',
    greeting:
      'Welcome, stargazer! We explore the night sky, planets, stars and everything beyond Earth. Think you can recognise the patterns hidden in the stars? Open your phone and complete our constellation challenge!',
    activityPrompt: 'Open phone to play Constellation Connect',
    reminder: 'You already completed our challenge! Remember our code: AST.',
    afterComplete:
      'You have an eye for the stars! If Astronomy Society feels like your crowd, use code AST when you register on PeopleSoft.',
  },
  {
    id: 'statistics',
    name: 'Statistics Society',
    emoji: '📊',
    code: 'STA',
    p: { x: 500, y: 555 },
    npcKind: 'host',
    orientation: 'landscape',
    greeting:
      "Statistics isn't just numbers — it's how we make sense of uncertainty, data and the world around us. Let's see how lucky and statistically sharp you are. Beat our Probability Snakes & Ladders challenge to earn our joining code!",
    activityPrompt: 'Open phone to play Probability Snakes & Ladders',
    reminder: 'You already completed our challenge! Remember our code: STA.',
    afterComplete:
      "Nice rolling! If Stats Society sounds like your crowd, use code STA when you register on PeopleSoft.",
  },
  {
    id: 'math',
    name: 'Mathematics Society',
    emoji: '🧮',
    code: 'MAT',
    p: { x: 1175, y: 615 },
    npcKind: 'host',
    orientation: 'portrait',
    greeting:
      "MathSoc isn't just about lectures and equations. We're a community for people who enjoy puzzles, problem-solving and meeting other mathematically curious students. Think you can crack our challenge?",
    activityPrompt: 'Open phone to play Pocket Sudoku',
    reminder: 'You already completed our challenge! Remember our code: MAT.',
    afterComplete:
      'Nicely solved! If MathSoc sounds like your kind of community, remember MAT. That\'s our code when you register through PeopleSoft.',
  },
  {
    id: 'developers',
    name: 'Developers Society',
    emoji: '💻',
    code: 'DEV',
    p: { x: 1285, y: 760 },
    npcKind: 'student',
    orientation: 'landscape',
    greeting:
      "Welcome to DevSoc! We build software, websites, apps and games. Join us and you could learn to build cool projects just like this one. We've made you a tiny retro game — beat it and we'll give you our PeopleSoft code!",
    activityPrompt: 'Open phone to play Retro Runner',
    reminder: 'You already completed our challenge! Remember our code: DEV.',
    afterComplete:
      "Nice run! Maybe you'll be building the next game yourself. If DevSoc is for you, enter DEV when you join through PeopleSoft.",
  },
];

export const SOCIETY_BY_ID: Record<SocietyId, SocietyDef> = SOCIETIES.reduce(
  (acc, s) => {
    acc[s.id] = s;
    return acc;
  },
  {} as Record<SocietyId, SocietyDef>
);

/* =========================================================
   ASTRONOMY — CONSTELLATION CONNECT
   Coordinates are percentages of the starfield box.
   ========================================================= */

export type Constellation = {
  name: string;
  difficulty: string;
  stars: Pt[];
  fact: string;
};

export const CONSTELLATIONS: Constellation[] = [
  {
    name: 'Southern Cross',
    difficulty: 'Easy',
    stars: [
      { x: 50, y: 12 },
      { x: 62, y: 46 },
      { x: 50, y: 82 },
      { x: 30, y: 40 },
    ],
    fact:
      'The Southern Cross is so important to navigation in the southern hemisphere that it appears on the flags of South Africa, Australia, New Zealand and Brazil.',
  },
  {
    name: 'Orion',
    difficulty: 'Medium',
    stars: [
      { x: 24, y: 10 },
      { x: 70, y: 14 },
      { x: 40, y: 42 },
      { x: 52, y: 44 },
      { x: 64, y: 46 },
      { x: 30, y: 86 },
      { x: 68, y: 84 },
    ],
    fact:
      'The three middle stars of Orion form his "belt" — one of the easiest patterns to find in the entire night sky.',
  },
  {
    name: 'Scorpius',
    difficulty: 'Harder',
    stars: [
      { x: 20, y: 18 },
      { x: 30, y: 14 },
      { x: 40, y: 20 },
      { x: 46, y: 34 },
      { x: 50, y: 50 },
      { x: 58, y: 62 },
      { x: 68, y: 70 },
      { x: 78, y: 74 },
      { x: 84, y: 66 },
    ],
    fact:
      "Scorpius really does look like a scorpion, curved tail and all — it's one of the few constellations that resembles its namesake.",
  },
];

/* =========================================================
   STATISTICS — PROBABILITY SNAKES & LADDERS
   25-square board, numbered 1 (start) to 25 (finish).
   ========================================================= */

export type BoardSquare = { kind: 'ladder' | 'snake'; to: number } | { kind: 'quiz' } | null;

export const BOARD_SIZE = 25;

export const BOARD_SPECIALS: Record<number, BoardSquare> = {
  3: { kind: 'ladder', to: 11 },
  8: { kind: 'quiz' },
  12: { kind: 'snake', to: 5 },
  15: { kind: 'quiz' },
  18: { kind: 'ladder', to: 23 },
  21: { kind: 'quiz' },
  24: { kind: 'snake', to: 16 },
};

export type ProbQuestion = { q: string; options: string[]; correct: number };

export const PROBABILITY_QUESTIONS: ProbQuestion[] = [
  {
    q: 'A fair six-sided die is rolled. What is the probability of rolling an even number?',
    options: ['1/6', '1/3', '1/2', '2/3'],
    correct: 2,
  },
  {
    q: 'A fair coin is flipped. What is the probability of heads?',
    options: ['1/4', '1/2', '3/4', '1'],
    correct: 1,
  },
  {
    q: 'A bag has 3 red and 2 blue marbles. What is the probability of drawing red?',
    options: ['2/5', '3/5', '1/2', '3/2'],
    correct: 1,
  },
  {
    q: 'Two coins are flipped. What is the probability of getting exactly one head?',
    options: ['1/4', '1/2', '3/4', '1'],
    correct: 1,
  },
];

/* =========================================================
   MATH — POCKET SUDOKU (4x4)
   0 = empty cell to be filled in.
   ========================================================= */

export const SUDOKU_PUZZLE: number[][] = [
  [1, 0, 3, 0],
  [0, 4, 0, 2],
  [2, 0, 4, 0],
  [0, 3, 0, 1],
];

export const SUDOKU_SOLUTION: number[][] = [
  [1, 2, 3, 4],
  [3, 4, 1, 2],
  [2, 1, 4, 3],
  [4, 3, 2, 1],
];

/* =========================================================
   HELPERS
   ========================================================= */

export const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

export const sleep = (n: number) => new Promise<void>((resolve) => setTimeout(resolve, n));
