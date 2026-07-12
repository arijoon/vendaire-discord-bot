import { createCanvas, loadImage, CanvasRenderingContext2D, Image } from 'canvas';
import { IMatch } from './api-contracts';
import { getCode } from './countries';

type FlagMap = Map<string, Image>;
export type FlagCache = Map<string, Image | null>;

async function loadFlags(matches: IMatch[], cache: FlagCache): Promise<FlagMap> {
  const codes = new Set<string>();
  for (const m of matches) {
    for (const t of [m.team1, m.team2]) {
      const c = getCode(t);
      if (c) codes.add(c);
    }
  }

  const flags: FlagMap = new Map();
  await Promise.all([...codes].map(async c => {
    if (!cache.has(c)) {
      try {
        cache.set(c, await loadImage(`https://flagcdn.com/w40/${c}.png`));
      } catch {
        cache.set(c, null);
      }
    }
    const img = cache.get(c);
    if (img) flags.set(c, img);
  }));

  return flags;
}

function drawFlag(ctx: CanvasRenderingContext2D, img: Image, x: number, cy: number, h: number, dim: boolean): number {
  const w = Math.round(h * img.width / img.height);
  const y = cy - h / 2;
  ctx.save();
  ctx.globalAlpha = dim ? 0.45 : 1;
  ctx.drawImage(img, x, y, w, h);
  ctx.restore();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  return w;
}

export const BRACKET_FONT = 'WcupSans';

const ROUNDS = [
  { round: 'Round of 16', label: 'Round of 16' },
  { round: 'Quarter-final', label: 'Quarter-finals' },
  { round: 'Semi-final', label: 'Semi-finals' },
  { round: 'Final', label: 'Final' },
];
const THIRD_PLACE = 'Match for third place';

const C = {
  bg: '#10141f',
  box: '#1b2233',
  boxBorder: '#2b3448',
  header: '#7f8aa3',
  title: '#e8ecf4',
  win: '#ffd24a',
  neutral: '#d3d9e6',
  lose: '#5f6778',
  score: '#9aa3b5',
  line: '#39435a',
  champBox: '#26210f',
  champBorder: '#ffd24a',
};

const BOXW = 178;
const ROWH = 27;
const BOXH = ROWH * 2;
const VGAP = 18;
const COLGAP = 54;
const TOP = 80;
const LEFT = 26;
const BOTTOM = 96;
const CONN = 32;
const CHAMPW = 178;
const RIGHT = 26;

interface Node {
  match: IMatch;
  roundIdx: number;
  children: Node[];
  cy: number;
}

const isPlaceholder = (t: string): boolean => !t || /^[WL]\d+$/.test(t);

function winnerIndex(m: IMatch, all: IMatch[]): number {
  if (!m.score) return -1;
  const [a, b] = m.score.ft;
  if (a > b) return 0;
  if (b > a) return 1;
  const later = (t: string) =>
    all.some(x => (x.num ?? 0) > (m.num ?? 0) && (x.team1 === t || x.team2 === t));
  if (later(m.team1)) return 0;
  if (later(m.team2)) return 1;
  return -1;
}

function feeder(team: string, prev: IMatch[]): IMatch | undefined {
  const ph = /^[WL](\d+)$/.exec(team);
  if (ph) return prev.find(x => x.num === parseInt(ph[1], 10));
  return prev.find(x => x.team1 === team || x.team2 === team);
}

function build(match: IMatch, roundIdx: number, byRound: IMatch[][]): Node {
  const node: Node = { match, roundIdx, children: [], cy: 0 };
  if (roundIdx === 0) return node;
  const prev = byRound[roundIdx - 1];
  for (const team of [match.team1, match.team2]) {
    const f = feeder(team, prev);
    if (f) node.children.push(build(f, roundIdx - 1, byRound));
  }
  return node;
}

function fit(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
  return t + '…';
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawMatch(ctx: CanvasRenderingContext2D, x: number, cy: number, m: IMatch, all: IMatch[], flags: FlagMap) {
  const y = cy - BOXH / 2;
  const widx = winnerIndex(m, all);

  roundedRect(ctx, x, y, BOXW, BOXH, 7);
  ctx.fillStyle = C.box;
  ctx.fill();
  ctx.strokeStyle = C.boxBorder;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.strokeStyle = C.boxBorder;
  ctx.beginPath();
  ctx.moveTo(x + 8, y + ROWH);
  ctx.lineTo(x + BOXW - 8, y + ROWH);
  ctx.stroke();

  const teams = [m.team1, m.team2];
  ctx.textBaseline = 'middle';
  for (let i = 0; i < 2; i++) {
    const rowY = y + ROWH / 2 + i * ROWH;
    const isWin = widx === i;
    const isLose = widx >= 0 && !isWin;
    const name = isPlaceholder(teams[i]) ? 'TBD' : teams[i];

    let textX = x + 12;
    const flag = flags.get(getCode(teams[i]) || '');
    if (flag) {
      textX += drawFlag(ctx, flag, textX, rowY, 15, isLose) + 8;
    }

    ctx.font = `${isWin ? 'bold ' : ''}15px "${BRACKET_FONT}"`;
    ctx.fillStyle = isWin ? C.win : isLose ? C.lose : C.neutral;
    ctx.textAlign = 'left';
    ctx.fillText(fit(ctx, name, x + BOXW - 30 - textX), textX, rowY);

    if (m.score) {
      ctx.font = `${isWin ? 'bold ' : ''}15px "${BRACKET_FONT}"`;
      ctx.fillStyle = isWin ? C.win : isLose ? C.lose : C.score;
      ctx.textAlign = 'right';
      ctx.fillText(String(m.score.ft[i]), x + BOXW - 12, rowY);
    }
  }
}

export async function renderBracket(matches: IMatch[], flagCache: FlagCache): Promise<Buffer | null> {
  const byRound = ROUNDS.map(r => matches.filter(m => m.round === r.round).sort((a, b) => (a.num ?? 0) - (b.num ?? 0)));
  const finalMatch = byRound[byRound.length - 1][0];
  if (!finalMatch || byRound[0].length === 0) return null;

  const flags = await loadFlags(matches, flagCache);

  const root = build(finalMatch, ROUNDS.length - 1, byRound);

  const leaves: Node[] = [];
  (function collect(n: Node) {
    if (!n.children.length) leaves.push(n);
    else n.children.forEach(collect);
  })(root);

  leaves.forEach((n, i) => (n.cy = TOP + BOXH / 2 + i * (BOXH + VGAP)));
  (function assign(n: Node) {
    if (n.children.length) {
      n.children.forEach(assign);
      n.cy = n.children.reduce((s, c) => s + c.cy, 0) / n.children.length;
    }
  })(root);

  const colX = (r: number) => LEFT + r * (BOXW + COLGAP);
  const width = colX(ROUNDS.length - 1) + BOXW + CONN + CHAMPW + RIGHT;
  const height = TOP + leaves.length * BOXH + (leaves.length - 1) * VGAP + BOTTOM;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = C.title;
  ctx.font = `bold 22px "${BRACKET_FONT}"`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('World Cup 2026 — Knockouts', LEFT, 34);

  ctx.font = `bold 12px "${BRACKET_FONT}"`;
  ctx.fillStyle = C.header;
  ctx.textAlign = 'center';
  ROUNDS.forEach((r, i) => ctx.fillText(r.label.toUpperCase(), colX(i) + BOXW / 2, TOP - 24));
  ctx.fillText('CHAMPION', colX(ROUNDS.length - 1) + BOXW + CONN + CHAMPW / 2, TOP - 24);

  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1.5;
  (function connect(n: Node) {
    for (const c of n.children) {
      const childR = colX(c.roundIdx) + BOXW;
      const parentL = colX(n.roundIdx);
      const midX = (childR + parentL) / 2;
      ctx.beginPath();
      ctx.moveTo(childR, c.cy);
      ctx.lineTo(midX, c.cy);
      ctx.lineTo(midX, n.cy);
      ctx.lineTo(parentL, n.cy);
      ctx.stroke();
      connect(c);
    }
  })(root);

  (function draw(n: Node) {
    drawMatch(ctx, colX(n.roundIdx), n.cy, n.match, matches, flags);
    n.children.forEach(draw);
  })(root);

  const champIdx = winnerIndex(finalMatch, matches);
  const champX = colX(ROUNDS.length - 1) + BOXW + CONN;
  const champName = champIdx >= 0 ? [finalMatch.team1, finalMatch.team2][champIdx] : null;
  if (champName && !isPlaceholder(champName)) {
    const cy = root.cy;
    roundedRect(ctx, champX, cy - ROWH / 2 - 4, CHAMPW, ROWH + 8, 8);
    ctx.fillStyle = C.champBox;
    ctx.fill();
    ctx.strokeStyle = C.champBorder;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = C.win;
    ctx.font = `bold 17px "${BRACKET_FONT}"`;
    ctx.textBaseline = 'middle';
    const flag = flags.get(getCode(champName) || '');
    const label = fit(ctx, champName, CHAMPW - 40);
    const textW = ctx.measureText(label).width;
    const flagW = flag ? Math.round(15 * flag.width / flag.height) : 0;
    const gap = flag ? 8 : 0;
    let gx = champX + (CHAMPW - textW - flagW - gap) / 2;
    if (flag) gx += drawFlag(ctx, flag, gx, cy, 15, false) + gap;
    ctx.textAlign = 'left';
    ctx.fillStyle = C.win;
    ctx.fillText(label, gx, cy);
  } else {
    ctx.fillStyle = C.lose;
    ctx.font = `15px "${BRACKET_FONT}"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TBD', champX + CHAMPW / 2, root.cy);
  }

  const third = matches.find(m => m.round === THIRD_PLACE);
  if (third) {
    const tx = LEFT;
    const tcy = height - BOTTOM + 52;
    ctx.fillStyle = C.header;
    ctx.font = `bold 12px "${BRACKET_FONT}"`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('THIRD PLACE', tx, tcy - BOXH / 2 - 8);
    drawMatch(ctx, tx, tcy, third, matches, flags);
  }

  return canvas.toBuffer('image/png');
}
