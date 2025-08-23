use axum::{extract::FromRequestParts, http::{header, request::Parts, StatusCode}};
use jsonwebtoken::{DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims { 
    pub sub: Uuid, 
    pub role: String, 
    pub exp: usize 
}

#[derive(Clone)]
pub struct Auth { 
    pub user_id: Uuid, 
    pub role: String 
}

#[axum::async_trait]
impl<S> FromRequestParts<S> for Auth 
where 
    S: Send + Sync 
{
    type Rejection = (StatusCode, &'static str);
    
    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let Ok(authz) = parts.headers.get(header::AUTHORIZATION)
            .ok_or((StatusCode::UNAUTHORIZED, "missing token"))
            .and_then(|h| h.to_str().map_err(|_| (StatusCode::UNAUTHORIZED, "bad header"))) 
        else { 
            return Err((StatusCode::UNAUTHORIZED, "missing")); 
        };
        
        let token = authz.strip_prefix("Bearer ")
            .ok_or((StatusCode::UNAUTHORIZED, "bad scheme"))?;
            
        let key = std::env::var("JWT_SECRET").unwrap_or_default();
        let data = jsonwebtoken::decode::<Claims>(
            token, 
            &DecodingKey::from_secret(key.as_bytes()), 
            &Validation::default()
        ).map_err(|_| (StatusCode::UNAUTHORIZED, "invalid token"))?;
        
        Ok(Auth { 
            user_id: data.claims.sub, 
            role: data.claims.role 
        })
    }
}

pub fn require_role(auth: &Auth, allowed: &[&str]) -> Result<(), (StatusCode, &'static str)> {
    if allowed.iter().any(|r| *r == auth.role) { 
        Ok(()) 
    } else { 
        Err((StatusCode::FORBIDDEN, "forbidden")) 
    }
}
