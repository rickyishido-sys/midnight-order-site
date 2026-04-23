# 深夜配達注文サイト

スマホ専用の1ページ注文サイトです。  
Webブラウザでも、LINEアプリ内(LIFF)でも利用できます。

## セットアップ

```bash
npm install
cp .env.example .env
npm run dev
```

`.env` に `VITE_LIFF_ID` を設定すると、LINEアプリ内での送信に対応します。

```env
VITE_LIFF_ID=YOUR_LIFF_ID_HERE
```

未設定の場合でも、注文ボタンから `line.me` 経由のメッセージ送信は利用できます。

## ビルド

```bash
npm run build
```
