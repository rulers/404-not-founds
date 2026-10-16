# Day 001 — Glitch 404

- ID: `001`
- Category: `Glitch`
- Created: `2026-10-17`
- Theme: `dark`
- Component: `components/artworks/Glitch404.tsx`
- Thumbnail: `public/thumbnails/001.svg`
- URL: [/404/001/](https://rulers.github.io/404-not-founds/404/001/)

## コンセプト

「404」の数字そのものを、行き先を失ったデジタル信号として扱う。大きな白い数字と黒い空間の静けさを基本とし、赤・シアンの信号ずれや水平スライスが断続的に現れる。常に激しく動かすのではなく、静寂から短く破綻して元に戻る緩急を作品の核とする。

画面中の小さな状態表示・隅の目印・スキャンラインは、信号を観測している印象を支える。追加のメニューや説明を作品内に置かず、操作は外側の短いヒントで伝える。

## 操作

- マウスが展示領域の中央に近づくほどRGB分離とノイズが強くなる。
- クリック／タップで、入力座標から波紋と約0.6秒の大きな崩壊を起こす。
- 連続して操作した場合は短い崩壊アニメーションを再始動する。
- フォーカスした状態でEnter／Spaceでも崩壊を起こす。キーボードの波紋座標は直前のポインター位置、未入力時は中央。
- ポインターが領域から離れるとRGB分離の強さを初期値へ戻す。

## 実装

同じ「404」を複数のspanに重ねる。ベースの文字、赤チャンネル、シアンチャンネル、3つの水平スライスを `clip-path`・transform・text-shadow・段階的なkeyframesで変形する。約7秒／9秒の異なる周期を組み合わせ、短い区間だけズレを見せる。

スキャンラインはrepeating-linear-gradient。ノイズは埋め込みSVGのfeTurbulenceを静的なテクスチャとして使い、強さでopacityを変える。Three.js・Canvas・GLSL・外部素材への通信は使わない。

Pointer Eventsで領域内の座標を百分率に変換し、中心からの距離で強度を求める。`useRef` とrequestAnimationFrameを使って `--x`、`--y`、`--split`、`--interference` のCSS変数を更新する。移動ごとのReact再レンダリングを避ける。

クリック時は `data-burst` を切り替え、620msのタイマーで解除する。連続入力のために一度レイアウトを確定してCSSアニメーションを再始動する。アンマウント時にRAFとタイマーを解除する。

## アクセシビリティとモバイル

作品の入力面はbutton。操作説明をaria-labelに持たせ、重複する装飾文字はaria-hiddenにする。キーボードの標準button操作とfocus-visibleを利用する。タッチではPointer Eventsを使い、`touch-action: pan-y` で縦スクロールを許可する。

reduced-motionでは自動アニメーションと波紋を止め、クリック中に数字をアクセント色へ変える。RGB分離は小さな固定値、ノイズは低いopacityにする。

PCとモバイル向けに文字サイズと表示領域を変える。現時点の演出とCSSは `app/globals.css` にあり、新作品を追加するときは作品固有のクラス名でスコープを分ける。

## 検証と制約

単体テストは作品選択、ブラウザテストは表示・マウス・タップ・キーボード・reduced-motion・直接URLを確認する。PCとモバイルはChromium上の検証。実機Safari、Lighthouse、長時間連続稼働の計測は未実施。

白背景への配色プレビューも可能だが、この作品の正式な登録はdark。CSS変数に従う文字色と、作品固有の赤・シアンは別に扱う。
