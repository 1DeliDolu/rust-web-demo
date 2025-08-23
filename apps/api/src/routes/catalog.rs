use axum::{routing::get, Json, Router, extract::State};
use sqlx::SqlitePool;
use serde_json::Value;

pub fn router() -> Router<SqlitePool> { 
    Router::new()
        .route("/api/products", get(list_products))
        .route("/api/categories", get(list_categories))
}

async fn list_products(State(pool): State<SqlitePool>) -> Json<Value> {
    let recs = sqlx::query!(
        "SELECT id, sku, name, description, is_active FROM products WHERE is_active = 1 LIMIT 50"
    )
    .fetch_all(&pool)
    .await
    .unwrap_or_default();
    
    Json(serde_json::json!({"items": recs}))
}

async fn list_categories(State(pool): State<SqlitePool>) -> Json<Value> {
    let recs = sqlx::query!(
        "SELECT id, parent_id, slug, name FROM categories ORDER BY name"
    )
    .fetch_all(&pool)
    .await
    .unwrap_or_default();
    
    Json(serde_json::json!({"items": recs}))
}
