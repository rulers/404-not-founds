export const products = [
  {
    id: "A1",
    name: "Missing Page",
    kind: "box",
    action: "箱を開ける",
    result: "丁寧に梱包された、何もないもの。",
    stamp: "PAGE NOT INCLUDED",
  },
  {
    id: "A2",
    name: "Expired Link",
    kind: "chain",
    action: "リンクを取り出す",
    result: "つながっていたのに。使う頃には期限切れ。",
    stamp: "LINK EXPIRED",
  },
  {
    id: "B1",
    name: "Lost Image",
    kind: "image",
    action: "写真を引き出す",
    result: "写真の向こうに、今いる場所しか見えない。",
    stamp: "IMAGE NOT FOUND",
  },
  {
    id: "B2",
    name: "Mystery Item",
    kind: "can",
    action: "",
    result: "取り出したはずの缶まで、なくなった。",
    stamp: "ITEM NOT FOUND",
  },
] as const;
export type ProductId = (typeof products)[number]["id"];
export type Phase =
  | "idle"
  | "coil"
  | "drop"
  | "ready"
  | "collect"
  | "inspect"
  | "reveal"
  | "result";
export type VendState = { phase: Phase; product: ProductId | null };
export type VendEvent =
  | { type: "select"; id: ProductId }
  | { type: "advance" }
  | { type: "collect" }
  | { type: "open" }
  | { type: "reset" };
export const initialVend: VendState = { phase: "idle", product: null };
export const phaseDuration: Partial<Record<Phase, number>> = {
  coil: 1000,
  drop: 700,
  collect: 650,
  reveal: 950,
};
export function vendTransition(state: VendState, event: VendEvent): VendState {
  if (event.type === "reset") return initialVend;
  if (event.type === "select")
    return state.phase === "idle"
      ? { phase: "coil", product: event.id }
      : state;
  if (event.type === "collect")
    return state.phase === "ready" ? { ...state, phase: "collect" } : state;
  if (event.type === "open")
    return state.phase === "inspect" ? { ...state, phase: "reveal" } : state;
  const next: Partial<Record<Phase, Phase>> = {
    coil: "drop",
    drop: "ready",
    collect: state.product === "B2" ? "reveal" : "inspect",
    reveal: "result",
  };
  return next[state.phase] ? { ...state, phase: next[state.phase]! } : state;
}
