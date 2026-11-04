---
title: "typo-factory"
project: "404 NOT FOUNDS — 365 Days of Nothing"
record_type: "creative-concept"
status: "proposed"
day: "011"
day_status: "provisional"
branch: "feature/404-011-typo-factory"
source_document: "../proposals/404-011-typo-factory-concept.md"
created_at: "2026-11-04"
tags:
  - "404"
  - "interactive-art"
  - "concept"
  - "open-knowledge-format"
---

# Day 011 — typo-factory｜Open Knowledge Format 記録

> **Open Knowledge Format（OKF）向けの知識記録。** 正式スキーマがこのリポジトリで未確認のため、適合認証や架空の仕様バージョンは記載しない。これは未採用の企画であり、実装済み・公開済みを意味しない。

## Knowledge / Concept

> **状態：提案・未採用**／仮Day 011。実装・公開・採用順は未決定。

## 一文コンセプト
誤ったアドレスを直しても、存在しないページには到達できない。

## 404ページとしての成立
- 初期画面から **404 / PAGE NOT FOUND** に相当する情報を世界観に合わせて明示する。
- 実際に機能する **Home / Galleryへの復帰導線** を設ける。操作しなくてもエラーと復帰先が理解できる。
- ギャラリー内の作品と実際の不明URL用 `404.html` は別であり、HTTP 404の扱いは既存基盤を変更しない。

## ビジュアルと感情
- **主画面：** 活版印刷を思わせる組版台に、URLの文字ブロックとERROR 404の表示。
- **配色：** オフホワイト、ブルー、オレンジ、黒
- **感情：** 可笑しさ、発見、軽い混乱

## 核となる操作
- **入力：** 誤字のあるURLの1文字を選び、交換・差し替えする。
- **反応：** 文字ブロックが整列して修正を祝うが、別の文字がひっくり返り、NOT FOUNDが残る。
- **触って気持ちいい点：** 文字の磁石的吸着、機械的なパチンという揃い方、短い連鎖反応。

## MVP
短い架空URL、修正対象1文字、3パターンの再配置、404表示、HOMEリンク。

## 技術の暫定案
DOM＋CSS transform＋Pointer/keyboard操作。 PCとモバイルで主操作を利用できること。キーボード操作、フォーカス、reduced-motion、停止・クリーンアップを配慮する。新規依存は原則追加しない。

## 受け入れ条件・検証
何を直せばよいか数秒で理解でき、直した後の意外性があり、再挑戦できる。
操作と復帰リンクの導線、視覚的な404の明快さ、実機の操作快感を検証する。CI成功は体験品質の証明としない。

## 実装しないもの
任意URLの実通信、ユーザー入力の外部送信、無限文字列生成。

## リスク・既存案との差分
- **リスク：** ユーザーが解決可能なパズルと誤解する。入力は架空文字列に限定。
- **差別化仮説：** Notionのハッキング404とは異なり、ターミナルでなく物理的な組版と誤字の連鎖を主役にする。
- 最終採用前に現行作品・他PR・Notion母集団を再照合する。

## ステータス
企画候補。デザイン承認前に実装指示へ昇格させない。

## Decision history

- **2026-11-04：** 週次アイディアとして提案。優先順に仮Day番号を割り当て、featureブランチにコンセプトシートと本記録を保存。
- **未決定：** 採用、ビジュアル承認、操作体験の実機評価、正式Day番号、PR、公開。

## Provenance and relations

- Concept sheet: [proposals/404-011-typo-factory-concept.md](../proposals/404-011-typo-factory-concept.md)
- Project: [404 NOT FOUNDS](https://github.com/rulers/404-not-founds)
- Existing art registry: [lib/artworks.ts](../lib/artworks.ts)
- **Evidence level:** 提案・仮説。第三者による実機評価、性能確認、制作実績ではない。

## Reuse / Transfer

404ページの意味づけ、操作の感情的効果、MVP境界、既存作品との差別化仮説を次の作品企画や制作レビューで再利用する。実装で得た教訓は制作後に追記する。
