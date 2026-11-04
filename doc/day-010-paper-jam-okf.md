---
title: "paper-jam"
project: "404 NOT FOUNDS — 365 Days of Nothing"
record_type: "creative-concept"
status: "proposed"
day: "010"
day_status: "provisional"
branch: "feature/404-010-paper-jam"
source_document: "../proposals/404-010-paper-jam-concept.md"
created_at: "2026-11-04"
tags:
  - "404"
  - "interactive-art"
  - "concept"
  - "open-knowledge-format"
---

# Day 010 — paper-jam｜Open Knowledge Format 記録

> **Open Knowledge Format（OKF）向けの知識記録。** 正式スキーマがこのリポジトリで未確認のため、適合認証や架空の仕様バージョンは記載しない。これは未採用の企画であり、実装済み・公開済みを意味しない。

## Knowledge / Concept

> **状態：提案・未採用**／仮Day 010。実装・公開・採用順は未決定。

## 一文コンセプト
探しているWebページを出力できない。見つからなさを紙詰まりという物理的障害に置き換える。

## 404ページとしての成立
- 初期画面から **404 / PAGE NOT FOUND** に相当する情報を世界観に合わせて明示する。
- 実際に機能する **Home / Galleryへの復帰導線** を設ける。操作しなくてもエラーと復帰先が理解できる。
- ギャラリー内の作品と実際の不明URL用 `404.html` は別であり、HTTP 404の扱いは既存基盤を変更しない。

## ビジュアルと感情
- **主画面：** 中央に大きなレトロなプリンター。紙の端が見え、404 / PAGE NOT FOUNDが機械のエラー表示に現れる。
- **配色：** クリーム、山吹色、コーラル、黒
- **感情：** もどかしさから解放感、最後に笑い

## 核となる操作
- **入力：** 見えている紙端をドラッグし、指を離す。
- **反応：** 引く速度に応じて抵抗が変化し、閾値を越えると紙がするりと抜ける。そこに印刷されているのは404エラー。
- **触って気持ちいい点：** 抵抗、紙の伸び、解放の瞬間の勢いと短い減衰。

## MVP
紙1枚、紙詰まり表示、ドラッグ操作、引き抜き後の404、再試行、HOMEへの有効なリンク。

## 技術の暫定案
SVG＋CSS＋Pointer Events。物理エンジン不要。 PCとモバイルで主操作を利用できること。キーボード操作、フォーカス、reduced-motion、停止・クリーンアップを配慮する。新規依存は原則追加しない。

## 受け入れ条件・検証
初回表示で404と分かり、スマホで紙が掴め、遅い/速い操作で手応えが異なり、引き抜いた後に戻れる。
操作と復帰リンクの導線、視覚的な404の明快さ、実機の操作快感を検証する。CI成功は体験品質の証明としない。

## 実装しないもの
複数機械、印刷シミュレーター、現実的な用紙変形。

## リスク・既存案との差分
- **リスク：** 紙のドラッグがスクロールと競合する。Vending Machineの排出演出との差別化が必要。
- **差別化仮説：** 既存Vending Machineと機械モチーフは近いが、選択・取得ではなく紙の抵抗と引き抜きに体験を集中する。
- 最終採用前に現行作品・他PR・Notion母集団を再照合する。

## ステータス
企画候補。デザイン承認前に実装指示へ昇格させない。

## Decision history

- **2026-11-04：** 週次アイディアとして提案。優先順に仮Day番号を割り当て、featureブランチにコンセプトシートと本記録を保存。
- **未決定：** 採用、ビジュアル承認、操作体験の実機評価、正式Day番号、PR、公開。

## Provenance and relations

- Concept sheet: [proposals/404-010-paper-jam-concept.md](../proposals/404-010-paper-jam-concept.md)
- Project: [404 NOT FOUNDS](https://github.com/rulers/404-not-founds)
- Existing art registry: [lib/artworks.ts](../lib/artworks.ts)
- **Evidence level:** 提案・仮説。第三者による実機評価、性能確認、制作実績ではない。

## Reuse / Transfer

404ページの意味づけ、操作の感情的効果、MVP境界、既存作品との差別化仮説を次の作品企画や制作レビューで再利用する。実装で得た教訓は制作後に追記する。
