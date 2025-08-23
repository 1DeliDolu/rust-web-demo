use axum::{routing::get, Router};
use sqlx::MySqlPool;

pub fn router() -> Router<MySqlPool> { 
    Router::new().route("/api/health", get(health)) 
}

async fn health() -> &'static str {
    "ok"
}
