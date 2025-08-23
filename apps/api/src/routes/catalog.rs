use axum::{routing::get, Json, Router, extract::State};
use sqlx::MySqlPool;
use serde_json::{Value, json};
use serde::Serialize;

#[derive(Serialize)]
struct Product {
    id: Option<String>,
    sku: String,
    name: String,
    description: Option<String>,
    is_active: i8,
}

#[derive(Serialize)]
struct Category {
    id: Option<String>,
    parent_id: Option<String>,
    slug: String,
    name: String,
}

use axum::extract::Path;

pub fn router() -> Router<MySqlPool> { 
    Router::new()
        .route("/api/products", get(list_products))
        .route("/api/products/:id", get(get_product))
        .route("/api/categories", get(list_categories))
}

async fn get_product(State(pool): State<MySqlPool>, Path(id): Path<String>) -> Json<Value> {
    let rec = sqlx::query_as!(Product,
        "SELECT BIN_TO_UUID(id) as id, sku, name, description, is_active FROM products WHERE BIN_TO_UUID(id) = ?",
        id
    )
    .fetch_optional(&pool)
    .await
    .unwrap_or(None);
    if let Some(product) = rec {
        Json(json!({"item": product}))
    } else {
        Json(json!({"error": "Ürün bulunamadı"}))
    }
}

async fn list_products(State(pool): State<MySqlPool>) -> Json<Value> {
    let recs = sqlx::query_as!(Product,
        "SELECT BIN_TO_UUID(id) as id, sku, name, description, is_active FROM products WHERE is_active = 1 LIMIT 50"
    )
    .fetch_all(&pool)
    .await
    .unwrap_or_default();
    
    Json(json!({"items": recs}))
}

async fn list_categories(State(pool): State<MySqlPool>) -> Json<Value> {
    let recs = sqlx::query_as!(Category,
        "SELECT BIN_TO_UUID(id) as id, BIN_TO_UUID(parent_id) as parent_id, slug, name FROM categories ORDER BY name"
    )
    .fetch_all(&pool)
    .await
    .unwrap_or_default();
    
    Json(json!({"items": recs}))
}
