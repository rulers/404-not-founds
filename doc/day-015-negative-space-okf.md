---
title: "negative-space"
project: "404 NOT FOUNDS — 365 Days of Nothing"
record_type: "creative-concept"
status: "proposed"
day: "015"
day_status: "provisional"
branch: "feature/404-015-negative-space"
source_document: "../proposals/404-015-negative-space-concept.md"
created_at: "2026-11-04"
tags:
  - "404"
  - "interactive-art"
  - "concept"
  - "open-knowledge-format"
---

# Day 015 — negative-space｜Open Knowledge Format 記録

> **Open Knowledge Format（OKF）向けの知識記録。** 正式スキーマがこのリポジトリで未確認のため、適合認証や架空の仕様バージョンは記載しない。これは未採用の企画であり、実装済み・公開済みを意味しない。

## Knowledge / Concept

> **状態：提案・未採用**／仮Day 015。実装・公開・採用順は未決定。

## 一文コンセプト
本来ないはずの空間だけが404を描く。

## 404ページとしての成立
- 初期画面から **404 / PAGE NOT FOUND** に相当する情報を世界観に合わせて明示する。
- 実際に機能する **Home / Galleryへの復帰導線** を設ける。操作しなくてもエラーと復帰先が理解できる。
- ギャラリー内の作品と実際の不明URL用 `404.html` は別であり、HTTP 404の扱いは既存基盤を変更しない。

## ビジュアルと感情
- **主画面：** 幾何学パネルが整列したポスター。見えている文字はPAGE NOT FOUND、数字404は余白の形で生まれる。
- **配色：** アイボリー、コバルトブルー、朱色、深緑
- **感情：** 静けさ、発見、視覚的満足

## 核となる操作
- **入力：** パネルを1つドラッグして所定位置へ近づける。
- **反応：** パネルが吸着して周囲の形が揃い、残された隙間が404になる。
- **触って気持ちいい点：** 磁力的なスナップ、色面のピタリとした整列、認知的な発見。

## MVP
固定された形状4〜6枚、1〜2個の可動パネル、404のネガティブスペース、HOMEリンク。

## 技術の暫定案
SVG＋CSS transform。 PCとモバイルで主操作を利用できること。キーボード操作、フォーカス、reduced-motion、停止・クリーンアップを配慮する。新規依存は原則追加しない。

## 受け入れ条件・検証
数字を直接描かず認識でき、配置操作の手応えがあり、初期状態でエラー文言が明快。
操作と復帰リンクの導線、視覚的な404の明快さ、実機の操作快感を検証する。CI成功は体験品質の証明としない。

## 実装しないもの
パズル自動生成、無数のステージ、スコア。

## リスク・既存案との差分
- **リスク：** 静的でも成立するならインタラクションが弱くなる。Missing Pieceと近いため別作品化は要判断。
- **差別化仮説：** 初期の『隠れた404探し』とは異なり、探索ではなく自分で余白を作る。Missing Pieceとの統合も選択肢。
- 最終採用前に現行作品・他PR・Notion母集団を再照合する。

## ステータス
企画候補。デザイン承認前に実装指示へ昇格させない。

## Decision history

- **2026-11-04：** 週次アイディアとして提案。優先順に仮Day番号を割り当て、featureブランチにコンセプトシートと本記録を保存。
- **未決定：** 採用、ビジュアル承認、操作体験の実機評価、正式Day番号、PR、公開。

## Provenance and relations

- Concept sheet: [proposals/404-015-negative-space-concept.md](../proposals/404-015-negative-space-concept.md)
- Project: [404 NOT FOUNDS](https://github.com/rulers/404-not-founds)
- Existing art registry: [lib/artworks.ts](../lib/artworks.ts)
- **Evidence level:** 提案・仮説。第三者による実機評価、性能確認、制作実績ではない。

## Reuse / Transfer

404ページの意味づけ、操作の感情的効果、MVP境界、既存作品との差別化仮説を次の作品企画や制作レビューで再利用する。実装で得た教訓は制作後に追記する。
