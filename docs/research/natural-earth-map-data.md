# Natural Earth Admin 0 国境データ調査

## 調査概要

- 確認日: 2026-08-18（日本時間）
- 対象: Natural Earth **1:110m Cultural Vectors / Admin 0 – Countries**
- 目的: 自作の矩形マップを置き換える候補として、公式配布元・利用許諾・再配布方法を確認する
- 調査範囲: Natural Earth の公式サイトと、Natural Earth が案内している公式GitHubリポジトリのみ

## 結論

採用候補として Natural Earth の Admin 0 – Countries は要件を満たす。公式利用規約は、Natural Earth のラスタ・ベクタデータをパブリックドメインとし、改変、電子配布、個人・教育・商用利用を許可している。したがって、アプリに加工済みのGeoJSONを同梱する運用も、規約の「electronic dissemination（電子配布）」の範囲に含まれると解釈できる。

ただし、公式規約は「アプリへ同梱」という語を個別に定義していない。この同梱可否は、電子配布の許可からの実務上の解釈であり、法的判断そのものではない。実装時は、元データのバージョン、取得元URL、取得日、加工内容をリポジトリ内に残す。

## 公式配布元とデータ内容

### NaturalEarthData.com

[1:110m Cultural Vectors](https://www.naturalearthdata.com/downloads/110m-cultural-vectors/) の `Admin 0 – Countries` 欄が公式の配布ページである。ページ上では次の内容が確認できる。

- `Admin 0 – Countries` は国単位のポリゴンデータ
- 258か国を収録し、Greenlandは Denmark とは別の国として扱う
- 国境は原則として de jure ではなく、Natural Earth の de facto 方針で表現される
- `Download countries` はシェープファイル形式のZIP配布
- 対象テーマの表示バージョンは **5.1.1**（ページ確認時点）

公式サイトの [Features](https://www.naturalearthdata.com/features/) でも、Natural Earth Vector は ESRI Shapefile で提供され、座標系は Geographic、測地系は WGS84、文字コードは UTF-8 と説明されている。

### 公式GitHubリポジトリ

[nvkelso/natural-earth-vector](https://github.com/nvkelso/natural-earth-vector) は Natural Earth Vector の公式リポジトリとして、Natural Earth の公式サイトからリンクされている。リポジトリ内には以下の現行データ形式がある。

- GeoJSON: [`geojson/ne_110m_admin_0_countries.geojson`](https://github.com/nvkelso/natural-earth-vector/blob/v5.1.1/geojson/ne_110m_admin_0_countries.geojson)
- GeoJSONのRaw取得先: [`ne_110m_admin_0_countries.geojson`](https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.1/geojson/ne_110m_admin_0_countries.geojson)
- Shapefile一式: [`110m_cultural`](https://github.com/nvkelso/natural-earth-vector/tree/v5.1.1/110m_cultural) 配下の `ne_110m_admin_0_countries.shp`、`.shx`、`.dbf`、`.prj`、`.cpg`
- データテーマのREADME: [`ne_110m_admin_0_countries.README.html`](https://github.com/nvkelso/natural-earth-vector/blob/v5.1.1/110m_cultural/ne_110m_admin_0_countries.README.html)

GitHubの `master` は更新途中の内容を含み得る。確認時点の [`VERSION`](https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/VERSION) は `5.2.0-pre` だったため、アプリへ取り込む際は `master` の常時参照を避け、少なくとも `v5.1.1` タグまたは固定コミットを指定する。公式リリースページでは `v5.1.1` がコミット `9380cca` に対応している。

## 利用許諾の確認

[Natural Earth Terms of Use](https://www.naturalearthdata.com/about/terms-of-use/) とリポジトリの [LICENSE.md](https://github.com/nvkelso/natural-earth-vector/blob/master/LICENSE.md) で、次の点を確認した。

| 項目 | 確認結果 | 根拠・注意点 |
| --- | --- | --- |
| 無料利用 | 可 | Natural Earth はパブリックドメインで、個人・教育・商用利用を招待している |
| 再利用 | 可 | `use the maps in any manner` と記載されている |
| 改変 | 可 | コンテンツとデザインの変更を明示的に許可している |
| 電子配布 | 可 | `electronic dissemination` を明示的に許可している |
| アプリへの同梱 | 可と解釈 | 「同梱」という個別語はないが、加工済みデータをアプリへ含めて配布することは電子配布に該当すると考えられる。法的判断が必要な場合は別途確認する |
| 帰属表示 | 不要 | 許可・クレジット表示は不要と明記されている。ただし任意で `Made with Natural Earth.` を表示できる |
| 改変版の再配布 | 可と解釈 | パブリックドメイン、改変可、電子配布可の組み合わせによる。改変内容と取得元を記録する |
| 正確性の保証 | なし | 公式規約は正確性、内容、用途への適合性について責任を負わないとしている |

なお、今回の対象は Admin 0 の国ポリゴンである。公式のライセンスページには、Natural Earth が一部の元データ提供者について別途の利用許諾文も掲げているため、将来、河川・道路・海上境界など別テーマを追加する場合は、そのテーマ固有のREADMEと出典も確認する。

## 実装時の推奨方針

1. 現在の小国戦線の国土ポリゴンは、Natural Earth **Admin 0 – Countries 1:110m** を元データにする。
2. 再現性を優先し、`v5.1.1` タグ（コミット `9380cca`）または対応する固定コミットからGeoJSONを取得する。`master` は `5.2.0-pre` のため直接のビルド入力にしない。
3. 取り込み時に不要な属性を削っても、座標・ポリゴンの由来が分かるよう、リポジトリ内に以下を残す。
   - データセット名とスケール
   - Natural Earthのテーマバージョン
   - 取得元URLと取得日
   - GeoJSON化・簡略化・国土分割などの加工内容
4. 1:110mは世界全体を小さく表示する用途向けの縮尺であり、公式サイトも 1:10m をより詳細、1:50m を中程度、1:110m を粗い世界表示向けとしている。小国の海岸線をゲーム画面で明瞭に見せる必要が出た場合は、同じNatural Earthの 1:50m または 1:10m への切り替えを別途検討する。
5. 国土をゲーム上の複数拠点へ分割する場合は、元ポリゴンを任意の矩形で置き換えず、分割ルール・境界線・制圧条件をゲーム側の派生データとして明示する。元の国境データとゲーム用分割の境界を混同しない。

## 参照URLと確認日

すべて 2026-08-18（日本時間）に確認した。

- [Natural Earth 1:110m Cultural Vectors / Admin 0 – Countries](https://www.naturalearthdata.com/downloads/110m-cultural-vectors/)
- [Natural Earth Terms of Use](https://www.naturalearthdata.com/about/terms-of-use/)
- [Natural Earth Features](https://www.naturalearthdata.com/features/)
- [Natural Earth Vector 公式GitHubリポジトリ](https://github.com/nvkelso/natural-earth-vector)
- [Admin 0 Countries GeoJSON（v5.1.1タグ）](https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.1/geojson/ne_110m_admin_0_countries.geojson)
- [Admin 0 Countries README（v5.1.1タグ）](https://github.com/nvkelso/natural-earth-vector/blob/v5.1.1/110m_cultural/ne_110m_admin_0_countries.README.html)
- [v5.1.1リリース（コミット9380cca）](https://github.com/nvkelso/natural-earth-vector/releases/tag/v5.1.1)
- [110m Cultural Shapefileディレクトリ（v5.1.1）](https://github.com/nvkelso/natural-earth-vector/tree/v5.1.1/110m_cultural)
- [Natural Earth Vector LICENSE.md](https://github.com/nvkelso/natural-earth-vector/blob/master/LICENSE.md)
- [Natural Earth Vector VERSION（master）](https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/VERSION)

## 今回の変更範囲

この調査では、`docs/research/natural-earth-map-data.md` の追加のみを行った。アプリケーションコード、マップ実装、既存の未追跡データファイルは変更していない。
