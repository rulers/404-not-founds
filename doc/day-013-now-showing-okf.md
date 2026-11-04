---
title: "now-showing"
project: "404 NOT FOUNDS — 365 Days of Nothing"
record_type: "creative-concept"
status: "proposed"
day: "013"
day_status: "provisional"
branch: "feature/404-013-now-showing"
source_document: "../proposals/404-013-now-showing-concept.md"
created_at: "2026-11-04"
tags:
  - "404"
  - "interactive-art"
  - "concept"
  - "open-knowledge-format"
---

# Day 013 — now-showing｜Open Knowledge Format 記録

> **Open Knowledge Format（OKF）向けの知識記録。** 正式スキーマがこのリポジトリで未確認のため、適合認証や架空の仕様バージョンは記載しない。これは未採用の企画であり、実装済み・公開済みを意味しない。

## Knowledge / Concept

> **状態：提案・未採用**／仮Day 013。実装・公開・採用順は未決定。

## 一文コンセプト
求めたWebページを失われたフィルムの1コマとして体験する。

## 404ページとしての成立
- 初期画面から **404 / PAGE NOT FOUND** に相当する情報を世界観に合わせて明示する。
- 実際に機能する **Home / Galleryへの復帰導線** を設ける。操作しなくてもエラーと復帰先が理解できる。
- ギャラリー内の作品と実際の不明URL用 `404.html` は別であり、HTTP 404の扱いは既存基盤を変更しない。

## ビジュアルと感情
- **主画面：** 小さな映画館のスクリーンとフィルム送りUI。上映タイトルは404 / FILM NOT FOUND。
- **配色：** 黒、深紅、アイボリー、映写光の金
- **感情：** 期待、映画的高揚、余韻

## 核となる操作
- **入力：** フィルム帯を左右にドラッグしてコマを送る。
- **反応：** 映像の断片が切り替わるが目的のコマだけ透明で、最後にNOT FOUNDがスクリーンへ投影される。
- **触って気持ちいい点：** スクラブの追従、コマ送りの刻み、放した後の短い慣性。

## MVP
数コマの静止画風シーン、手動スクラブ、欠落コマと404、HOMEリンク。

## 技術の暫定案
SVG/CSSまたは軽量Canvas 2D。動画素材・WebGLはMVP不要。 PCとモバイルで主操作を利用できること。キーボード操作、フォーカス、reduced-motion、停止・クリーンアップを配慮する。新規依存は原則追加しない。

## 受け入れ条件・検証
フィルムが操作に追従し、欠落コマをユーザー自身が発見できること。
操作と復帰リンクの導線、視覚的な404の明快さ、実機の操作快感を検証する。CI成功は体験品質の証明としない。

## 実装しないもの
長尺予告編、実在作品の映像・音声、映画館3Dモデル。

## リスク・既存案との差分
- **リスク：** ただの動画鑑賞になる。操作による欠落の発見が必須。
- **差別化仮説：** Radio 404のチューニング操作と類似し得るため、連続周波数でなく離散的なコマ送りと視覚的な欠落に限定。
- 最終採用前に現行作品・他PR・Notion母集団を再照合する。

## ステータス
企画候補。デザイン承認前に実装指示へ昇格させない。

## Decision history

- **2026-11-04：** 週次アイディアとして提案。優先順に仮Day番号を割り当て、featureブランチにコンセプトシートと本記録を保存。
- **未決定：** 採用、ビジュアル承認、操作体験の実機評価、正式Day番号、PR、公開。

## Provenance and relations

- Concept sheet: [proposals/404-013-now-showing-concept.md](../proposals/404-013-now-showing-concept.md)
- Project: [404 NOT FOUNDS](https://github.com/rulers/404-not-founds)
- Existing art registry: [lib/artworks.ts](../lib/artworks.ts)
- **Evidence level:** 提案・仮説。第三者による実機評価、性能確認、制作実績ではない。

## Reuse / Transfer

404ページの意味づけ、操作の感情的効果、MVP境界、既存作品との差別化仮説を次の作品企画や制作レビューで再利用する。実装で得た教訓は制作後に追記する。
