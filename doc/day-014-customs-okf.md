---
title: "customs"
project: "404 NOT FOUNDS — 365 Days of Nothing"
record_type: "creative-concept"
status: "proposed"
day: "014"
day_status: "provisional"
branch: "feature/404-014-customs"
source_document: "../proposals/404-014-customs-concept.md"
created_at: "2026-11-04"
tags:
  - "404"
  - "interactive-art"
  - "concept"
  - "open-knowledge-format"
---

# Day 014 — customs｜Open Knowledge Format 記録

> **Open Knowledge Format（OKF）向けの知識記録。** 正式スキーマがこのリポジトリで未確認のため、適合認証や架空の仕様バージョンは記載しない。これは未採用の企画であり、実装済み・公開済みを意味しない。

## Knowledge / Concept

> **状態：提案・未採用**／仮Day 014。実装・公開・採用順は未決定。

## 一文コンセプト
存在しないアドレスは入国できない架空の訪問者。

## 404ページとしての成立
- 初期画面から **404 / PAGE NOT FOUND** に相当する情報を世界観に合わせて明示する。
- 実際に機能する **Home / Galleryへの復帰導線** を設ける。操作しなくてもエラーと復帰先が理解できる。
- ギャラリー内の作品と実際の不明URL用 `404.html` は別であり、HTTP 404の扱いは既存基盤を変更しない。

## ビジュアルと感情
- **主画面：** 架空の入国審査ブース。URLを旅券番号として見せ、赤いENTRY DENIED / 404の判を置く。
- **配色：** 空色、生成り、朱色、グリーン
- **感情：** ポップな官僚的不条理、ユーモア

## 核となる操作
- **入力：** 旅券を審査台へドラッグする。
- **反応：** 窓口が審査し、判が押されて404 ENTRY DENIED。別の押印デザインが出る。
- **触って気持ちいい点：** 旅券の滑走、所定位置へのスナップ、押印の跳ね。

## MVP
旅券1枚、審査台、判定1種類＋変化2種類、404表示、HOMEリンク。

## 技術の暫定案
SVG＋CSS＋Pointer Events。 PCとモバイルで主操作を利用できること。キーボード操作、フォーカス、reduced-motion、停止・クリーンアップを配慮する。新規依存は原則追加しない。

## 受け入れ条件・検証
404表示が理解でき、操作と判定に因果関係があり、再試行は単なる演出ループにならない。
操作と復帰リンクの導線、視覚的な404の明快さ、実機の操作快感を検証する。CI成功は体験品質の証明としない。

## 実装しないもの
複雑な旅券生成、国籍や個人属性の判定、実URL送信。

## リスク・既存案との差分
- **リスク：** Vending MachineやLost & Foundと結果を受け取る導線が重複。
- **差別化仮説：** Paper Planeと同じ郵便返送ではなく、ページの入国審査という世界観に変更。
- 最終採用前に現行作品・他PR・Notion母集団を再照合する。

## ステータス
企画候補。デザイン承認前に実装指示へ昇格させない。

## Decision history

- **2026-11-04：** 週次アイディアとして提案。優先順に仮Day番号を割り当て、featureブランチにコンセプトシートと本記録を保存。
- **未決定：** 採用、ビジュアル承認、操作体験の実機評価、正式Day番号、PR、公開。

## Provenance and relations

- Concept sheet: [proposals/404-014-customs-concept.md](../proposals/404-014-customs-concept.md)
- Project: [404 NOT FOUNDS](https://github.com/rulers/404-not-founds)
- Existing art registry: [lib/artworks.ts](../lib/artworks.ts)
- **Evidence level:** 提案・仮説。第三者による実機評価、性能確認、制作実績ではない。

## Reuse / Transfer

404ページの意味づけ、操作の感情的効果、MVP境界、既存作品との差別化仮説を次の作品企画や制作レビューで再利用する。実装で得た教訓は制作後に追記する。
