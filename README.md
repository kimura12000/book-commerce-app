# Book Commerce App

microCMS で管理している「本（記事）」を一覧表示し、GitHub アカウントでログインしたユーザーが Stripe で購入できる、Next.js (App Router) 製のデジタルコンテンツ販売アプリです。
サイト上の表示名は **「神田 下久呉服店 Online Shop」** です。

## 主な機能

| 機能 | 内容 |
| --- | --- |
| 商品一覧 | microCMS の `bookcommerce` エンドポイントから最大 100 件の本を取得し、トップページにカード形式で表示 |
| 購入済み判定 | ログイン中のユーザーの購入履歴を取得し、購入済みの本をクリックすると「購入済みの商品です。」とアラート表示 |
| GitHub ログイン | NextAuth.js (GitHub Provider) によるログイン／ログアウト。ユーザー・アカウント・セッションは Prisma 経由で PostgreSQL に保存 |
| Stripe 決済 | 本をクリック → 確認モーダル → Stripe Checkout（日本円・カード決済）へ遷移 |
| 購入履歴の保存 | 決済完了ページで Stripe のセッションを検証し、`Purchase` テーブルに保存（同じ本の重複登録は防止） |
| 本の詳細 | `/book/[id]` でサムネイル・本文（microCMS のリッチエディタ HTML）・公開日・最終更新日を表示 |
| プロフィール | ユーザー名・アイコンと、購入した本の一覧を表示。各本から詳細ページへ遷移可能 |

## 技術スタック

- **フレームワーク**: Next.js 14.0.3（App Router）/ React 18 / TypeScript
- **スタイリング**: Tailwind CSS、`styled-jsx`（モーダルアニメーション・スピナー）、Google Fonts（Noto Sans JP）
- **認証**: NextAuth.js v4 + `@next-auth/prisma-adapter`（GitHub OAuth）
- **DB / ORM**: PostgreSQL（Vercel Postgres を想定）+ Prisma 5
- **CMS**: microCMS（`microcms-js-sdk`）
- **決済**: Stripe Checkout（`stripe` Node SDK）
- **その他**: `react-spinners`（ローディング表示）

## 画面・ルーティング

| パス | 種別 | 説明 | レンダリング |
| --- | --- | --- | --- |
| `/` | Server Component | 商品一覧（購入済み判定つき） | 商品一覧は ISR（1 時間ごとに再検証）、購入履歴は `no-store`（SSR） |
| `/login` | Client Component | GitHub ログインボタン | CSR |
| `/book/[id]` | Server Component | 本の詳細 | `no-store`（SSR） |
| `/book/checkout-success` | Client Component | 決済完了画面。購入履歴を保存し、購入した本へのリンクを表示 | CSR |
| `/profile` | Server Component | プロフィールと購入した本一覧 | SSR |

### API ルート

| メソッド・パス | 説明 |
| --- | --- |
| `GET/POST /api/auth/[...nextauth]` | NextAuth.js のハンドラ（サインイン・サインアウト・セッション） |
| `POST /api/checkout` | body: `{ title, price, bookId, userId }`。Stripe Checkout セッションを作成し `{ checkout_url }` を返す。`bookId` は `metadata`、`userId` は `client_reference_id` に格納 |
| `POST /api/checkout/success` | body: `{ sessionId }`。Stripe からセッションを取得し、未購入なら `Purchase` を作成して `{ purchase }` を返す。購入済みなら `"既に購入済みです。"` を返す |
| `GET /api/purchases/[userId]` | 指定ユーザーの購入履歴（`Purchase[]`）を返す |

## 購入フロー

```
[トップページ] 本をクリック
   ├─ 購入済み → アラート「購入済みの商品です。」
   └─ 未購入 → 確認モーダル「本を購入しますか？」
        └─ 「購入する」
             ├─ 未ログイン → /login へ
             └─ ログイン済み → POST /api/checkout → Stripe Checkout 画面へ
                  ├─ キャンセル → トップページ（NEXT_PUBLIC_BASE_URL）へ戻る
                  └─ 決済成功 → /book/checkout-success?session_id=...
                       └─ POST /api/checkout/success → Purchase を DB に保存
                            └─ 「購入した記事を読む」→ /book/[bookId]
```

## データモデル

### microCMS（API エンドポイント: `bookcommerce`、リスト形式）

| フィールド ID | 型 | 説明 |
| --- | --- | --- |
| `title` | テキスト | 本のタイトル |
| `content` | リッチエディタ | 本文（HTML として表示。一覧では先頭 20 文字を表示） |
| `price` | 数値 | 価格（円） |
| `thumbnail` | 画像 | サムネイル画像 |

`id` / `createdAt` / `updatedAt` / `publishedAt` は microCMS が自動付与します。

### PostgreSQL（`prisma/schema.prisma`）

- `User`（`users`）/ `Account`（`accounts`）/ `Session`（`sessions`）/ `VerificationToken`（`verificationtokens`）: NextAuth.js 標準のテーブル
- `Purchase`: 購入履歴。`id` / `userId`（User への外部キー）/ `bookId`（microCMS のコンテンツ ID）/ `createdAt`

## セットアップ

### 1. 前提

- Node.js 18 以上
- PostgreSQL（Vercel Postgres など）
- microCMS のサービス（上記スキーマの `bookcommerce` API を作成）
- Stripe アカウント（テストモードで可）
- GitHub OAuth App（Callback URL: `http://localhost:3000/api/auth/callback/github`）

### 2. 依存パッケージのインストール

```bash
npm install
```

### 3. 環境変数

プロジェクト直下に `.env`（または `.env.local`）を作成します。どちらも `.gitignore` 済みです。
Prisma CLI は `.env` を読むため、DB の接続情報は `.env` に書くのが確実です。

```env
# PostgreSQL（Prisma）
POSTGRES_PRISMA_URL="postgres://...?...pgbouncer=true&connect_timeout=15"   # プーリング接続
POSTGRES_URL_NON_POOLING="postgres://..."                                  # 直接接続（マイグレーション用）

# NextAuth.js
GITHUB_ID="GitHub OAuth App の Client ID"
GITHUB_SECRET="GitHub OAuth App の Client Secret"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="ランダムな文字列（本番環境では必須。例: openssl rand -base64 32）"

# microCMS
NEXT_PUBLIC_SERVICE_DOMAIN="xxxx"        # https://xxxx.microcms.io の xxxx 部分
NEXT_PUBLIC_API_KEY="microCMS の API キー"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."

# アプリの URL
NEXT_PUBLIC_BASE_URL="http://localhost:3000"            # Stripe の success / cancel URL に使用
NEXT_PUBLIC_STRIPE_API_URL="http://localhost:3000/api"  # 自アプリの API ルートのベース URL
```

> `NEXT_PUBLIC_STRIPE_API_URL` という名前ですが、Stripe 専用ではなく **このアプリ自身の `/api`** を指します（`/checkout`、`/checkout/success`、`/purchases/[userId]` の呼び出しに使用）。

### 4. データベースの準備

```bash
npx prisma migrate deploy   # 既存のマイグレーションを適用（開発中にスキーマを変更する場合は npx prisma migrate dev）
npx prisma generate         # Prisma Client の生成
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開きます。

Stripe のテストモードでは、カード番号 `4242 4242 4242 4242`、有効期限は未来の任意の日付、CVC は任意の 3 桁で決済できます。

## npm スクリプト

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバー起動（ポート 3000） |
| `npm run build` | `prisma generate` 後に本番ビルド |
| `npm run start` | 本番サーバー起動 |
| `npm run lint` | ESLint（`next/core-web-vitals`） |

## ディレクトリ構成

```
app/
├── api/
│   ├── auth/[...nextauth]/route.ts   # NextAuth ハンドラ
│   ├── checkout/route.ts             # Stripe Checkout セッション作成
│   ├── checkout/success/route.ts     # 決済完了後の購入履歴保存
│   └── purchases/[userId]/route.ts   # 購入履歴取得
├── book/
│   ├── [id]/page.tsx                 # 本の詳細
│   └── checkout-success/page.tsx     # 決済完了画面
├── components/
│   ├── Book.tsx                      # 商品カード + 購入確認モーダル
│   ├── Header.tsx                    # ヘッダー（サーバー側でセッション取得）
│   └── PurchaseDetailBook.tsx        # プロフィールの購入済みカード
├── lib/
│   ├── microcms/client.ts            # microCMS クライアントと取得関数
│   ├── next-auth/options.ts          # NextAuth 設定
│   ├── prisma.ts                     # PrismaClient シングルトン
│   └── provider.tsx                  # SessionProvider ラッパー
├── types/types.ts                    # BookType / User / Purchase 型
├── login/page.tsx                    # ログイン画面
├── profile/page.tsx                  # プロフィール画面
├── layout.tsx                        # ルートレイアウト（Header + Suspense）
├── loading.tsx                       # ローディングスピナー
└── page.tsx                          # トップ（商品一覧）
prisma/
├── schema.prisma
└── migrations/
```

## デプロイ

Vercel + Vercel Postgres を想定しています。`build` スクリプトで `prisma generate` が実行されます。
デプロイ時は上記の環境変数を Vercel に設定し、`NEXTAUTH_URL` / `NEXT_PUBLIC_BASE_URL` / `NEXT_PUBLIC_STRIPE_API_URL` を本番ドメインに変更、GitHub OAuth App の Callback URL も本番ドメインに合わせてください。

## 既知の制約・注意点

- 本の詳細ページ（`/book/[id]`）は購入の有無に関わらず誰でも閲覧できます（アクセス制御は未実装）。
- 購入履歴の保存は決済完了ページの表示時に行われます（Stripe Webhook は未使用）。そのため決済後にページを閉じると履歴が保存されない可能性があります。
- `/api/purchases/[userId]` と `/api/checkout` はリクエスト元のセッションを検証していません。
- `NEXT_PUBLIC_API_KEY`（microCMS）は `NEXT_PUBLIC_` 接頭辞のため、クライアントコンポーネントから import するとブラウザに露出します。現状はサーバーコンポーネントからのみ使用しています。
- プロフィール画面のデフォルトアイコン `/default_icon.png` は `public/` に存在しません。
