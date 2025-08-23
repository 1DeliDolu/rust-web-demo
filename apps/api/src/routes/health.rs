use axum::{routing::get, Router};
use sqlx::SqlitePool;

pub fn router() -> Router<SqlitePool> { 
    Router::new().route("/api/health", get(health)) 
}

async fn health() -> &'static str {
    "ok"
}
