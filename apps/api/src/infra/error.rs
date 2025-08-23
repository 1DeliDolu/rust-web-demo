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
    #[error(transparent)]
    ArgonError(#[from] argon2::password_hash::Error),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let code = match self { 
            AppError::NotFound => StatusCode::NOT_FOUND, 
            _ => StatusCode::INTERNAL_SERVER_ERROR 
        };
        (code, self.to_string()).into_response()
    }
}
