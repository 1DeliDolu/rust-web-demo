use axum::Router;
use sqlx::MySqlPool;

pub fn router() -> Router<MySqlPool> { 
    Router::new()
    // TODO: Admin endpoints eklenecek
}
