use sqlx::mysql::MySqlPoolOptions;
use sqlx::MySqlPool;

pub async fn connect(url: &str) -> Result<MySqlPool, sqlx::Error> {
    MySqlPoolOptions::new()
        .max_connections(10)
        .connect(url)
        .await
}
