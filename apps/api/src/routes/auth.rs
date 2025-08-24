use axum::{routing::post, Json, Router, extract::State, http::StatusCode};
use serde::{Deserialize, Serialize};
use sqlx::MySqlPool;
use uuid::Uuid;
use argon2::{Argon2, PasswordHasher};
use argon2::password_hash::{SaltString, PasswordHash, PasswordVerifier};
use crate::infra::error::AppError;
use rand::rngs::OsRng;
use jsonwebtoken::{encode, Header, EncodingKey};
use crate::domain::rbac::Claims;

#[derive(Deserialize)]
pub struct RegisterInput { 
    pub email: String, 
    pub password: String, 
    pub name: Option<String> 
}

#[derive(Deserialize)]
pub struct LoginInput {
    pub email: String,
    pub password: String,
}

#[derive(Serialize)]
pub struct AuthResponse {
    pub access_token: String,
    pub user: UserInfo,
}

#[derive(Serialize)]
pub struct UserInfo {
    pub id: Uuid,
    pub email: String,
    pub name: Option<String>,
    pub role: String,
}

pub fn router() -> Router<MySqlPool> { 
    use axum::routing::get;

    Router::new()
        .route("/api/auth/register", post(register))
        .route("/api/auth/login", post(login))
        .route("/api/auth/users", get(list_users))
}

use crate::domain::rbac::{Auth, require_role};

async fn list_users(
    State(pool): State<MySqlPool>,
    auth: Auth,
) -> Result<Json<Vec<UserInfo>>, AppError> {
    if let Err(_) = require_role(&auth, &["admin"]) {
        return Err(AppError::Forbidden);
    }
    let users = sqlx::query!(
        "SELECT BIN_TO_UUID(id) as id, email, name, role FROM users"
    )
    .fetch_all(&pool)
    .await?;
    let result = users.into_iter().map(|u| UserInfo {
        id: Uuid::parse_str(&u.id.unwrap()).unwrap(),
        email: u.email,
        name: u.name,
        role: u.role,
    }).collect();
    Ok(Json(result))
}
async fn register(
    State(pool): State<MySqlPool>, 
    Json(inp): Json<RegisterInput>
) -> Result<(StatusCode, Json<serde_json::Value>), AppError> {
    let salt = SaltString::generate(&mut OsRng);
    let hash = Argon2::default().hash_password(inp.password.as_bytes(), &salt)?;
    let id = Uuid::new_v4();
    
    sqlx::query!(
        "INSERT INTO users (id, email, password_hash, role, name) VALUES (UUID_TO_BIN(?), ?, ?, 'kunde', ?)", 
        id.to_string(), 
        inp.email, 
        hash.to_string(), 
        inp.name
    )
    .execute(&pool)
    .await?;
    
    Ok((StatusCode::CREATED, Json(serde_json::json!({"id": id}))))
}

async fn login(
    State(pool): State<MySqlPool>,
    Json(inp): Json<LoginInput>
) -> Result<Json<AuthResponse>, AppError> {
    let user = sqlx::query!(
        "SELECT BIN_TO_UUID(id) as id, email, password_hash, role, name FROM users WHERE email = ?",
        inp.email
    )
    .fetch_optional(&pool)
    .await?
    .ok_or(AppError::NotFound)?;

    let parsed_hash = PasswordHash::new(&user.password_hash)?;
    Argon2::default()
        .verify_password(inp.password.as_bytes(), &parsed_hash)
        .map_err(|_| AppError::NotFound)?;

    let user_id = Uuid::parse_str(&user.id.unwrap()).unwrap();
    let claims = Claims {
        sub: user_id,
        role: user.role.clone(),
        exp: (chrono::Utc::now() + chrono::Duration::hours(24)).timestamp() as usize,
    };

    let key = std::env::var("JWT_SECRET").unwrap_or_default();
    let token = encode(&Header::default(), &claims, &EncodingKey::from_secret(key.as_bytes()))
        .map_err(|_| AppError::NotFound)?;

    Ok(Json(AuthResponse {
        access_token: token,
        user: UserInfo {
            id: user_id,
            email: user.email,
            name: user.name,
            role: user.role,
        },
    }))
}
