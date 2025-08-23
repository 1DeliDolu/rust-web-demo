Hazır! Sana ayrıntılı bir adım adım proje tasarımı hazırladım — sağdaki canvasta görebilirsin. İçinde:

Mimari (modüler monolith), teknoloji seçimi (Axum + Next.js + MySQL)

ERD + MySQL DDL (kopyala-çalıştır)

RBAC (Kunde/Çalışan/Admin) ve örnek guard

REST API taslakları, iş akışları (checkout, pazar yeri senkron)

Docker Compose, CI/CD, güvenlik ve test önerileri

Rust ve Next.js için küçük kod örnekleri

İstersen sıradaki adım olarak repo iskeletini (backend + frontend + migrations + compose) da çıkarabilirim veya önce MVP migration dosyalarını oluşturalım. Nasıl ilerleyelim?

# E‑Ticaret Proje Tasarımı (Rust + TypeScript + MySQL)

Bu doküman; **Rust (Axum) backend**, **TypeScript (Next.js/React) frontend** ve **MySQL** veritabanı ile çok kategorili bir e‑ticaret sistemi için mimari, şema, API tasarımı ve yol haritasını içerir. Roller: **Kunde (müşteri)**, **Çalışan (operasyon)**, **Admin**.

---

## 1) Amaçlar & MVP Kapsamı

**MVP**:

* Katalog: Kategori hiyerarşisi, ürün/variant, stok, görseller, arama.
* Sepet & Checkout: Sepet, adresler, sipariş, ödeme entegrasyonu için placeholder.
* Roller & Yetkiler: Kunde, Çalışan, Admin (RBAC).
* Yönetim ekranları: Ürün, stok, sipariş yönetimi (Çalışan/Admin).
* Dış Pazar/Yayın (MediaMarkt, Otto, Amazon vb.) için **bağlayıcı (connector)** temel şablon (ürün feed’i okuma/senkronizasyonu, cron ile).

**Sonraki Fazlar**:

* Kupon/indirim, iade süreçleri, kargo entegrasyonu, raporlama, çoklu dil/para birimi, gelişmiş arama/filtre.

---

## 2) Teknoloji Seçimleri

* **Backend (Rust):** `axum` + `tokio`, `tower-http`, `sqlx` (MySQL), `serde`, `tracing`, `jsonwebtoken` (JWT), `argon2` (şifre), `validator` (input), `uuid`, `time/chrono`, `dotenvy`.
* **Frontend (TS):** Next.js (App Router), React, TanStack Query, Zod, React Hook Form, Tailwind, shadcn/ui.
* **DB:** MySQL (InnoDB, FK + index), gerekirse `FULLTEXT` veya ileride Meilisearch/Elasticsearch.
* **Queue/Jobs (opsiyonel):** Redis + background worker (senkronizasyon/cron).
* **Container/CI:** Docker Compose, GitHub Actions.

**Monolith modüler mimari** ile başla; domain modülleri bağımsız tutulur.

---

## 3) Domain & Modüller

* **Identity & RBAC:** kullanıcı, rol, yetki; oturum/JWT; parola.
* **Catalog:** kategori (hiyerarşik), ürün, variant, fiyat, stok, görsel, özellikler (JSON).
* **Cart & Checkout:** sepet, sepet kalemi, adres, sipariş, sipariş kalemi, ödeme/kargo placeholder.
* **Fulfillment:** stok hareketi, kargo, durum geçişleri.
* **Integrations:** dış pazar yerleri için connector kayıtları, import/export job’ları.

---

## 4) RBAC (Roller & Yetkiler)

**Roller**

* **kunde:** katalog görüntüleme, sepet/sipariş işlemleri, profil.
* **calisan:** ürün/stok/sipariş görüntüleme & düzenleme; raporlar.
* **admin:** tüm yetkiler + rol atama, kullanıcı yönetimi, sistem ayarları.

**Örnek izin matrisi**

* `catalog:read` → herkes (anon + kunde)
* `cart:write`, `order:write` → kunde
* `product:write`, `stock:write`, `order:update` → calisan, admin
* `user:admin`, `role:admin`, `settings:admin` → admin

JWT `claims.role` veya daha esnek model için `claims.permissions` kullanılır.

---

## 5) Veritabanı Şeması (ERD özet)

**identity**

* `users` (id PK, email uniq, password\_hash, role, name, created\_at)
* `addresses` (id, user\_id FK, type\[billing|shipping], ...)

**catalog**

* `categories` (id, parent\_id NULL FK, slug uniq, name, path ltree-benzeri `path` text)
* `products` (id, sku uniq, name, description, brand\_id FK NULL, is\_active, created\_at)
* `product_variants` (id, product\_id FK, sku uniq, price DECIMAL(10,2), currency, barcode NULL, is\_active)
* `product_images` (id, product\_id FK, url, alt)
* `product_attributes` (id, product\_id, key, value) **veya** `products.attributes JSON`
* `inventory` (id, variant\_id FK, qty INT, safety\_stock INT DEFAULT 0)
* `brands` (id, name, slug)
* `product_categories` (product\_id, category\_id) PK (product\_id, category\_id)

**cart & order**

* `carts` (id, user\_id FK NULL (misafir sepeti de desteklenebilir), status\[active|converted|abandoned])
* `cart_items` (id, cart\_id FK, variant\_id FK, qty INT, unit\_price DECIMAL(10,2))
* `orders` (id, user\_id FK, number uniq, status\[new|paid|packed|shipped|delivered|cancelled|refunded], totals JSON, billing\_address\_id, shipping\_address\_id, created\_at)
* `order_items` (id, order\_id FK, variant\_id FK, qty INT, unit\_price DECIMAL(10,2), tax JSON)
* `payments` (id, order\_id FK, provider, amount DECIMAL(10,2), status\[pending|authorized|paid|failed|refunded], payload JSON)
* `shipments` (id, order\_id FK, carrier, tracking\_no, status\[pending|shipped|delivered], payload JSON)

**integrations**

* `connectors` (id, name\[amazon|otto|mediamarkt|custom], type\[feed|api], credentials JSON, is\_active)
* `connector_jobs` (id, connector\_id FK, kind\[import|export], status\[pending|running|done|failed], started\_at, finished\_at, log TEXT)

> **Not:** MySQL’de JSON alanları için uygun index stratejisi planlayın; kritik alanlar normal sütun olarak tutulmalı.

---

## 6) Örnek DDL (MySQL)

```sql
CREATE TABLE users (
  id BINARY(16) PRIMARY KEY,
  email VARCHAR(191) NOT NULL UNIQUE,
  password_hash VARCHAR(191) NOT NULL,
  role ENUM('kunde','calisan','admin') NOT NULL DEFAULT 'kunde',
  name VARCHAR(191) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE categories (
  id BINARY(16) PRIMARY KEY,
  parent_id BINARY(16) NULL,
  slug VARCHAR(191) NOT NULL UNIQUE,
  name VARCHAR(191) NOT NULL,
  path TEXT NULL,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE products (
  id BINARY(16) PRIMARY KEY,
  sku VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(191) NOT NULL,
  description TEXT NULL,
  brand_id BINARY(16) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE product_variants (
  id BINARY(16) PRIMARY KEY,
  product_id BINARY(16) NOT NULL,
  sku VARCHAR(64) NOT NULL UNIQUE,
  price DECIMAL(10,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  barcode VARCHAR(64) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE product_images (
  id BINARY(16) PRIMARY KEY,
  product_id BINARY(16) NOT NULL,
  url TEXT NOT NULL,
  alt VARCHAR(191) NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE inventory (
  id BINARY(16) PRIMARY KEY,
  variant_id BINARY(16) NOT NULL,
  qty INT NOT NULL,
  safety_stock INT NOT NULL DEFAULT 0,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE product_categories (
  product_id BINARY(16) NOT NULL,
  category_id BINARY(16) NOT NULL,
  PRIMARY KEY (product_id, category_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE carts (
  id BINARY(16) PRIMARY KEY,
  user_id BINARY(16) NULL,
  status ENUM('active','converted','abandoned') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE cart_items (
  id BINARY(16) PRIMARY KEY,
  cart_id BINARY(16) NOT NULL,
  variant_id BINARY(16) NOT NULL,
  qty INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE orders (
  id BINARY(16) PRIMARY KEY,
  user_id BINARY(16) NOT NULL,
  number VARCHAR(32) NOT NULL UNIQUE,
  status ENUM('new','paid','packed','shipped','delivered','cancelled','refunded') NOT NULL DEFAULT 'new',
  totals JSON NULL,
  billing_address_id BINARY(16) NULL,
  shipping_address_id BINARY(16) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE order_items (
  id BINARY(16) PRIMARY KEY,
  order_id BINARY(16) NOT NULL,
  variant_id BINARY(16) NOT NULL,
  qty INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  tax JSON NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id)
) ENGINE=InnoDB;

CREATE TABLE payments (
  id BINARY(16) PRIMARY KEY,
  order_id BINARY(16) NOT NULL,
  provider VARCHAR(64) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending','authorized','paid','failed','refunded') NOT NULL,
  payload JSON NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE shipments (
  id BINARY(16) PRIMARY KEY,
  order_id BINARY(16) NOT NULL,
  carrier VARCHAR(64) NOT NULL,
  tracking_no VARCHAR(64) NULL,
  status ENUM('pending','shipped','delivered') NOT NULL,
  payload JSON NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE connectors (
  id BINARY(16) PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  type ENUM('feed','api') NOT NULL,
  credentials JSON NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE connector_jobs (
  id BINARY(16) PRIMARY KEY,
  connector_id BINARY(16) NOT NULL,
  kind ENUM('import','export') NOT NULL,
  status ENUM('pending','running','done','failed') NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP NULL,
  finished_at TIMESTAMP NULL,
  log TEXT NULL,
  FOREIGN KEY (connector_id) REFERENCES connectors(id) ON DELETE CASCADE
) ENGINE=InnoDB;
```

> **UUID deposu:** Uygulamada `uuid` kullanın; MySQL sütunlarını `BINARY(16)` olarak tutun, uygulamada `Uuid` ↔ `Vec<u8>` dönüşümü yapın.

---

## 7) REST API Taslakları

**Auth**

* `POST /api/auth/register` {email, password, name}
* `POST /api/auth/login` → {access\_token, refresh\_token}
* `POST /api/auth/refresh`
* `POST /api/auth/logout`

**Catalog**

* `GET /api/categories` (ağaç/hiyerarşi)
* `GET /api/products` (sayfalama, filtre, q=arama)
* `GET /api/products/:id`
* `GET /api/variants/:id`

**Cart & Checkout (kunde)**

* `GET /api/cart`
* `POST /api/cart/items` {variant\_id, qty}
* `PATCH /api/cart/items/:id` {qty}
* `DELETE /api/cart/items/:id`
* `POST /api/checkout` → sipariş yaratır, ödeme linki/intent döner (provider mock)

**Admin/Çalışan** (RBAC: `product:write`, `order:update`)

* `POST /api/admin/products` (CRUD)
* `POST /api/admin/variants`
* `PATCH /api/admin/stock` {variant\_id, delta}
* `GET /api/admin/orders` (filtre: status)
* `PATCH /api/admin/orders/:id/status` {status}
* `POST /api/admin/connectors` (aktivasyon/ayar)
* `POST /api/admin/connectors/:id/run` (job tetikle)

---

## 8) Rust Backend İskeleti (Axum)

```rust
// Cargo.toml (özet)
// axum, tokio, sqlx (mysql, runtime-tokio-rustls, macros), serde, jsonwebtoken, argon2,
// tracing, tracing-subscriber, uuid, time, anyhow, thiserror, validator

use axum::{routing::{get, post}, Router};
use tower_http::cors::{CorsLayer, Any};
use std::net::SocketAddr;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt().with_env_filter("info").init();

    // DB
    let pool = sqlx::mysql::MySqlPoolOptions::new()
        .max_connections(10)
        .connect(&std::env::var("DATABASE_URL")?)
        .await?;

    // Router
    let api = Router::new()
        .route("/api/health", get(|| async { "ok" }))
        .merge(routes::auth())
        .merge(routes::catalog())
        .merge(routes::cart())
        .merge(routes::admin())
        .with_state(pool)
        .layer(CorsLayer::new().allow_origin(Any).allow_methods(Any).allow_headers(Any));

    let addr = SocketAddr::from(([0,0,0,0], 3001));
    tracing::info!("listening on {}", addr);
    axum::Server::bind(&addr).serve(api.into_make_service()).await?;
    Ok(())
}
```

**Basit RBAC Guard (claim.role kontrolü)**

```rust
use axum::{http::StatusCode, response::IntoResponse, extract::FromRequestParts};
use jsonwebtoken::{DecodingKey, Validation};

#[derive(Clone)]
pub struct Auth { pub user_id: uuid::Uuid, pub role: String }

#[axum::async_trait]
impl<S> FromRequestParts<S> for Auth where S: Send + Sync {
    type Rejection = (StatusCode, &'static str);
    async fn from_request_parts(parts: &mut axum::http::request::Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let Some(authz) = parts.headers.get(axum::http::header::AUTHORIZATION) else { return Err((StatusCode::UNAUTHORIZED, "missing token")); };
        let token = authz.to_str().ok().and_then(|v| v.strip_prefix("Bearer ")).ok_or((StatusCode::UNAUTHORIZED, "bad token"))?;
        let data = jsonwebtoken::decode::<Claims>(token, &DecodingKey::from_secret(std::env::var("JWT_SECRET").unwrap().as_bytes()), &Validation::default()).map_err(|_| (StatusCode::UNAUTHORIZED, "invalid token"))?;
        Ok(Auth { user_id: data.claims.sub, role: data.claims.role })
    }
}

pub fn require_role(auth: &Auth, allowed: &[&str]) -> Result<(), (StatusCode, &'static str)> {
    if allowed.iter().any(|r| *r == auth.role) { Ok(()) } else { Err((StatusCode::FORBIDDEN, "forbidden")) }
}
```

**Handler örneği**

```rust
async fn admin_list_orders(auth: Auth, State(pool): State<MySqlPool>) -> impl IntoResponse {
    require_role(&auth, &["admin", "calisan"]).map_err(|e| e)?;
    // ... siparişleri çek
    Json(orders)
}
```

---

## 9) Frontend (Next.js + TS) Yapısı

```
apps/web/
  app/
    (public)/
    layout.tsx
    page.tsx
    catalog/
      page.tsx
      [slug]/page.tsx
    product/[id]/page.tsx
    cart/page.tsx
    checkout/page.tsx
    admin/
      products/page.tsx
      orders/page.tsx
  lib/api.ts (fetch wrapper + auth)
  lib/query.ts (TanStack Query client)
  components/
    ui/* (shadcn)
    product-card.tsx, filters.tsx, navbar.tsx
  types/
  hooks/
```

* **Durum yönetimi:** TanStack Query (server state) + hafif `useLocalStorage` (anon sepet id’si).
* **Form doğrulama:** Zod + RHF.
* **UI:** Tailwind + shadcn/ui.
* **Auth:** login sonrası `access_token` memory, `refresh_token` httpOnly cookie (backend endpointi).

---

## 10) Geliştirme Ortamı (Docker Compose)

```yaml
version: "3.9"
services:
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: shop
      MYSQL_USER: app
      MYSQL_PASSWORD: app
    ports: ["3306:3306"]
    volumes: ["mysql_data:/var/lib/mysql"]
  api:
    build: ./apps/api
    environment:
      DATABASE_URL: mysql://app:app@db:3306/shop
      JWT_SECRET: devsecret
    ports: ["3001:3000"]
    depends_on: [db]
  web:
    build: ./apps/web
    ports: ["5173:3000"]
    depends_on: [api]
volumes:
  mysql_data: {}
```

**Migration**: `sqlx migrate add init` → DDL’leri `migrations/*` altına koy; `sqlx migrate run`.

---

## 11) İş Akışları

**Sipariş Oluşturma**

1. Kunde sepetine ürün ekler → backend fiyat + stok doğrular.
2. Checkout’ta adres & özet → `orders` açılır, `order_items` yazılır, stok rezervasyonu (opsiyonel).
3. Ödeme provider `payments` kaydı (mock) → success => `orders.status = paid`.
4. Çalışan panelinde `paid` → `packed` → kargo (shipment) → `shipped` → `delivered`.

**Pazar Yeri Senkronizasyonu (örnek)**

* Connector `import` job: XML/CSV feed → ürün/variant eşleme (SKU/UPC) → `products`/`variants` güncelle.
* `export` job: stok/fiyat değişikliklerini dış pazara gönder.

---

## 12) Güvenlik & Kalite

* Parola: `argon2id` + salt; rate-limit (`tower-governor`), CORS, güvenlik başlıkları.
* Girdi doğrulama: `validator`/`zod`, SQLx bind parametreleri (SQL injection önler).
* Yetki: route-guard + birim test.
* Log/İzleme: `tracing` + request-id, structured logs.
* Test: backend için `#[tokio::test]` + `reqwest`; frontend için Playwright/Cypress.

---

## 13) CI/CD

* **Build & Test:** GitHub Actions (Rust fmt/clippy/test, Node lint/test).
* **Docker image’ler:** çok aşamalı build, `cargo-chef` cache.
* **Deploy:** VPS/Kubernetes/Fly.io; MySQL yönetimi (backups, migrations).

---

## 14) Adım Adım Yol Haritası

1. **Repo kur** (monorepo): `apps/api`, `apps/web`, `infra/`.
2. **DB şeması & migrations**: yukarıdaki DDL ile MVP tabloları.
3. **Backend iskelet**: health, auth, catalog `GET`; SQLx bağla; RBAC guard.
4. **Frontend iskelet**: katalog liste/ürün detay, sepet sayfası; API client.
5. **Sepet & Checkout**: sepet endpoints + checkout akışı; sipariş yazma.
6. **Admin/Çalışan paneli**: ürün CRUD, stok güncelleme, sipariş durum yönetimi.
7. **Connector altyapı**: `connectors` + `connector_jobs`; mock import/export job.
8. **Ödeme mock**: provider arayüzü + state geçişleri; success/fail senaryoları.
9. **Güvenlik/kalite**: rate-limit, logging, testler, dokümantasyon.
10. **Docker Compose**: local ortam; CI/CD pipeline.

---

## 15) Küçük Örnekler

**Örnek Auth Register (Rust) – basitleştirilmiş**

```rust
#[derive(Deserialize)]
struct RegisterInput { email: String, password: String, name: Option<String> }

pub async fn register(State(pool): State<MySqlPool>, Json(inp): Json<RegisterInput>) -> Result<impl IntoResponse, AppError> {
    let hash = argon2::password_hash::PasswordHasher::hash_password(&argon2::Argon2::default(), inp.password.as_bytes(), &argon2::password_hash::SaltString::generate(&mut rand::thread_rng()))?;
    let id = Uuid::new_v4();
    sqlx::query!("INSERT INTO users(id,email,password_hash,role,name) VALUES(UNHEX(REPLACE(?,'-','')), ?, ?, 'kunde', ?)", id.to_string(), inp.email, hash.to_string(), inp.name)
        .execute(&pool).await?;
    Ok((StatusCode::CREATED, Json(json!({ "id": id }))))
}
```

**Next.js – ürün listeleme sayfası (özet)**

```tsx
export default async function CatalogPage() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API}/api/products`, { cache: 'no-store' });
  const data = await res.json();
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {data.items.map((p: any) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
```

---

## 16) Sonraki Adımlar

* Bu şemayı baz alıp **MVP migration** dosyalarını çıkar.
* Backend’de **Auth + Catalog GET** endpointlerini çalıştır.
* Frontend’de **katalog listesi + ürün detay + sepet** ile ilk demo.
* Ardından **checkout** ve **admin panel**e geç.

İhtiyaç olursa bu doküman üzerinden kod iskeleti (repo taslağı) üretebilir ve ilerledikçe detayları genişletebiliriz.

---

## 17) Uygulanabilir Repo İskeleti (kopyala-çalıştır)

Aşağıdaki yapı ile doğrudan başlayabilirsin. Dosyaları aynı adlarla oluştur.

```
shop/
  apps/
    api/
      Cargo.toml
      rust-toolchain.toml
      .env.example
      migrations/
        20250823120000_init.sql
      src/
        main.rs
        routes/
          mod.rs
          health.rs
          auth.rs
          catalog.rs
          cart.rs
          admin.rs
        domain/
          mod.rs
          models.rs
          rbac.rs
        infra/
          mod.rs
          db.rs
          error.rs
    web/
      package.json
      next.config.mjs
      .env.local.example
      src/
        app/
          layout.tsx
          page.tsx
          catalog/page.tsx
          product/[id]/page.tsx
          cart/page.tsx
          admin/products/page.tsx
          admin/orders/page.tsx
        components/
          product-card.tsx
        lib/
          api.ts
          query.ts
  infra/
    docker-compose.yml
    Makefile
    README.md
```

### 17.1 Backend: `apps/api/Cargo.toml`

```toml
[package]
name = "shop-api"
version = "0.1.0"
edition = "2021"

[dependencies]
axum = "0.7"
tokio = { version = "1", features = ["rt-multi-thread","macros"] }
tower-http = { version = "0.5", features = ["cors","trace"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
sqlx = { version = "0.8", features = ["runtime-tokio-rustls","mysql","macros","uuid","chrono","migrate"] }
uuid = { version = "1", features = ["v4","serde"] }
argon2 = "0.5"
jsonwebtoken = "9"
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["fmt","env-filter"] }
thiserror = "1"
anyhow = "1"
validator = { version = "0.18", features = ["derive"] }
dotenvy = "0.15"
```

### 17.2 Backend: `apps/api/.env.example`

```
DATABASE_URL=mysql://app:app@localhost:3306/shop
JWT_SECRET=change-me-dev
RUST_LOG=info,shop_api=debug,tower_http=info
```

### 17.3 Backend: `apps/api/src/infra/db.rs`

```rust
use sqlx::mysql::MySqlPoolOptions;
use sqlx::MySqlPool;

pub async fn connect(url: &str) -> Result<MySqlPool, sqlx::Error> {
    MySqlPoolOptions::new().max_connections(10).connect(url).await
}
```

### 17.4 Backend: `apps/api/src/infra/error.rs`

```rust
use axum::{http::StatusCode, response::{IntoResponse, Response}};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Not found")]
    NotFound,
    #[error(transparent)]
    Sqlx(#[from] sqlx::Error),
    #[error(transparent)]
    Anyhow(#[from] anyhow::Error),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let code = match self { AppError::NotFound => StatusCode::NOT_FOUND, _ => StatusCode::INTERNAL_SERVER_ERROR };
        (code, self.to_string()).into_response()
    }
}
```

### 17.5 Backend: `apps/api/src/domain/rbac.rs`

```rust
use axum::{extract::FromRequestParts, http::{header, request::Parts, StatusCode}};
use jsonwebtoken::{DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims { pub sub: Uuid, pub role: String, pub exp: usize }

#[derive(Clone)]
pub struct Auth { pub user_id: Uuid, pub role: String }

#[axum::async_trait]
impl<S> FromRequestParts<S> for Auth where S: Send + Sync {
    type Rejection = (StatusCode, &'static str);
    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let Ok(authz) = parts.headers.get(header::AUTHORIZATION).ok_or((StatusCode::UNAUTHORIZED, "missing token"))
            .and_then(|h| h.to_str().map_err(|_| (StatusCode::UNAUTHORIZED, "bad header"))) else { return Err((StatusCode::UNAUTHORIZED, "missing")); };
        let token = authz.strip_prefix("Bearer ").ok_or((StatusCode::UNAUTHORIZED, "bad scheme"))?;
        let key = std::env::var("JWT_SECRET").unwrap_or_default();
        let data = jsonwebtoken::decode::<Claims>(token, &DecodingKey::from_secret(key.as_bytes()), &Validation::default()).map_err(|_| (StatusCode::UNAUTHORIZED, "invalid token"))?;
        Ok(Auth { user_id: data.claims.sub, role: data.claims.role })
    }
}

pub fn require_role(auth: &Auth, allowed: &[&str]) -> Result<(), (StatusCode, &'static str)> {
    if allowed.iter().any(|r| *r == auth.role) { Ok(()) } else { Err((StatusCode::FORBIDDEN, "forbidden")) }
}
```

### 17.6 Backend: `apps/api/src/routes/*`

`mod.rs`

```rust
pub mod health; pub mod auth; pub mod catalog; pub mod cart; pub mod admin;
```

`health.rs`

```rust
use axum::routing::get; use axum::Router;
pub fn router() -> Router { Router::new().route("/api/health", get(|| async { "ok" })) }
```

`auth.rs` (özet)

```rust
use axum::{routing::post, Json, Router};
use serde::Deserialize;
use sqlx::MySqlPool;
use uuid::Uuid;

#[derive(Deserialize)]
struct RegisterInput { email: String, password: String, name: Option<String> }

pub fn router() -> Router<MySqlPool> { Router::new().route("/api/auth/register", post(register)) }

async fn register(axum::extract::State(pool): axum::extract::State<MySqlPool>, axum::Json(inp): Json<RegisterInput>) -> Result<Json<serde_json::Value>, axum::response::Response> {
    let salt = argon2::password_hash::SaltString::generate(&mut rand::thread_rng());
    let hash = argon2::Argon2::default().hash_password(inp.password.as_bytes(), &salt).map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    let id = Uuid::new_v4();
    sqlx::query!("INSERT INTO users (id,email,password_hash,role,name) VALUES (UUID_TO_BIN(?), ?, ?, 'kunde', ?)", id.to_string(), inp.email, hash.to_string(), inp.name)
        .execute(&pool).await.map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    Ok(Json(serde_json::json!({"id": id})))
}
```

`catalog.rs` (özet)

```rust
use axum::{routing::get, Json, Router};
use sqlx::MySqlPool;

pub fn router() -> Router<MySqlPool> { Router::new().route("/api/products", get(list_products)) }

async fn list_products(axum::extract::State(pool): axum::extract::State<MySqlPool>) -> Json<serde_json::Value> {
    let recs = sqlx::query!("SELECT BIN_TO_UUID(id) as id, sku, name FROM products LIMIT 50").fetch_all(&pool).await.unwrap_or_default();
    Json(serde_json::json!({"items": recs}))
}
```

`cart.rs` ve `admin.rs` için boş router şablonları ekleyebilirsin.

### 17.7 Backend: `apps/api/src/main.rs`

```rust
mod infra; mod domain; mod routes;
use axum::Router; use tower_http::cors::{CorsLayer, Any};
use infra::db; use std::net::SocketAddr; use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt().with_env_filter(EnvFilter::from_default_env()).init();

    let pool = db::connect(&std::env::var("DATABASE_URL")?).await?;

    let app = Router::new()
        .merge(routes::health::router())
        .merge(routes::auth::router())
        .merge(routes::catalog::router())
        .with_state(pool)
        .layer(CorsLayer::new().allow_origin(Any).allow_methods(Any).allow_headers(Any));

    let addr = SocketAddr::from(([0,0,0,0], 3000));
    tracing::info!("listening on {}", addr);
    axum::Server::bind(&addr).serve(app.into_make_service()).await?;
    Ok(())
}
```

### 17.8 Migration: `apps/api/migrations/20250823120000_init.sql`

> MVP için temel tablolar (özet). UUID’leri MySQL 8’de `UUID_TO_BIN/BIN_TO_UUID` ile saklıyoruz.

```sql
CREATE TABLE users (
  id BINARY(16) NOT NULL PRIMARY KEY,
  email VARCHAR(191) NOT NULL UNIQUE,
  password_hash VARCHAR(191) NOT NULL,
  role ENUM('kunde','calisan','admin') NOT NULL DEFAULT 'kunde',
  name VARCHAR(191) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
  id BINARY(16) PRIMARY KEY,
  parent_id BINARY(16) NULL,
  slug VARCHAR(191) NOT NULL UNIQUE,
  name VARCHAR(191) NOT NULL,
  path TEXT NULL,
  CONSTRAINT fk_cat_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE products (
  id BINARY(16) PRIMARY KEY,
  sku VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(191) NOT NULL,
  description TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_variants (
  id BINARY(16) PRIMARY KEY,
  product_id BINARY(16) NOT NULL,
  sku VARCHAR(64) NOT NULL UNIQUE,
  price DECIMAL(10,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_variant_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE inventory (
  id BINARY(16) PRIMARY KEY,
  variant_id BINARY(16) NOT NULL,
  qty INT NOT NULL,
  safety_stock INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_inv_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
);

CREATE TABLE product_images (
  id BINARY(16) PRIMARY KEY,
  product_id BINARY(16) NOT NULL,
  url TEXT NOT NULL,
  alt VARCHAR(191) NULL,
  CONSTRAINT fk_img_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE product_categories (
  product_id BINARY(16) NOT NULL,
  category_id BINARY(16) NOT NULL,
  PRIMARY KEY (product_id, category_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE carts (
  id BINARY(16) PRIMARY KEY,
  user_id BINARY(16) NULL,
  status ENUM('active','converted','abandoned') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE cart_items (
  id BINARY(16) PRIMARY KEY,
  cart_id BINARY(16) NOT NULL,
  variant_id BINARY(16) NOT NULL,
  qty INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT
);

CREATE TABLE orders (
  id BINARY(16) PRIMARY KEY,
  user_id BINARY(16) NOT NULL,
  number VARCHAR(32) NOT NULL UNIQUE,
  status ENUM('new','paid','packed','shipped','delivered','cancelled','refunded') NOT NULL DEFAULT 'new',
  totals JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE order_items (
  id BINARY(16) PRIMARY KEY,
  order_id BINARY(16) NOT NULL,
  variant_id BINARY(16) NOT NULL,
  qty INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id)
);
```

### 17.9 Frontend: `apps/web/package.json`

```json
{
  "name": "shop-web",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.5",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "@tanstack/react-query": "5.51.1",
    "zod": "3.23.8"
  },
  "devDependencies": {
    "typescript": "5.5.4"
  }
}
```

### 17.10 Frontend: `apps/web/src/app/layout.tsx`

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr"><body>{children}</body></html>
  );
}
```

### 17.11 Frontend: `apps/web/src/app/page.tsx`

```tsx
export default function Home() { return <main>Merhaba, kataloga gidin.</main>; }
```

### 17.12 Frontend: basit katalog sayfası `apps/web/src/app/catalog/page.tsx`

```tsx
async function getProducts() {
  const res = await fetch(process.env.NEXT_PUBLIC_API + "/api/products", { cache: "no-store" });
  return res.json();
}
export default async function Catalog() {
  const data = await getProducts();
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
```

### 17.13 Infra: `infra/docker-compose.yml`

```yaml
version: "3.9"
services:
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: shop
      MYSQL_USER: app
      MYSQL_PASSWORD: app
    ports: ["3306:3306"]
    volumes: ["mysql_data:/var/lib/mysql"]
  api:
    build: ../apps/api
    environment:
      DATABASE_URL: mysql://app:app@db:3306/shop
      JWT_SECRET: devsecret
      RUST_LOG: info
    ports: ["3001:3000"]
    depends_on: [db]
  web:
    build: ../apps/web
    environment:
      NEXT_PUBLIC_API: http://localhost:3001
    ports: ["3001:3000"]
    depends_on: [api]
volumes:
  mysql_data: {}
```

### 17.14 Infra: `infra/Makefile`

```makefile
.PHONY: up down logs migrate
up:
	docker compose -f infra/docker-compose.yml up -d --build

down:
	docker compose -f infra/docker-compose.yml down -v

logs:
	docker compose -f infra/docker-compose.yml logs -f

migrate:
	# sqlx cli konteyner içinde veya lokalde çalıştır
	# ör: docker compose exec api bash -lc "sqlx migrate run"
	@echo "Run SQLx migrations"
```

### 17.15 İlk Çalıştırma Adımları

1. `cp apps/api/.env.example apps/api/.env` ve değerleri düzenle.
2. MySQL’i başlat: `make up` (veya `docker compose up -d`).
3. **Migration**: API konteynerinde `sqlx migrate run`.
4. API: `cargo run -p shop-api` (veya docker ile otomatik).
5. Web: `pnpm i && pnpm dev` (veya docker).
6. `GET http://localhost:3001/api/health` → `ok`.

### 17.16 Sonraki Geliştirme Adımları

* `auth/login`, `refresh` ve JWT üretimini ekle.
* `cart/*` endpoint’lerini doldur (qty, fiyat doğrulama, stok kontrol).
* Admin ürün CRUD ve stok güncelleme.
* Kategori ağacını ve ürün filtrelemeyi frontend’e ekle.
* Pazar yeri connector şablonlarını (job runner) ekle.


Süper — repo iskeleti + migrations + temel kodu canvasa ekledim. Şimdi şu yolu izle:

infra/docker-compose.yml ile MySQL’i kaldır.

apps/api/.env’i doldur, sqlx migrate run ile tabloları oluştur.

API’yi çalıştır (cargo run), GET /api/health kontrol et.

Web’i başlat ve catalog sayfasında JSON’u gör.

İstersen bir sonraki adımda auth/login + JWT ve cart endpointlerini de kodlayıp ekleyeyim.
