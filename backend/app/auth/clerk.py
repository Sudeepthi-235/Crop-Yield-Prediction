import time
import requests
import jwt
from jwt.algorithms import RSAAlgorithm
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from ..config import CLERK_ISSUER_DOMAIN, CLERK_SECRET_KEY

security_scheme = HTTPBearer(auto_error=False)

# In-memory cache for Clerk JWKS keys
_JWKS_CACHE = {"keys": {}, "expires_at": 0}


def get_clerk_jwks(issuer_url: str = None) -> dict:
    """Fetch Clerk public keys (JWKS) and cache for 1 hour."""
    now = time.time()
    if _JWKS_CACHE["keys"] and now < _JWKS_CACHE["expires_at"]:
        return _JWKS_CACHE["keys"]

    urls_to_try = []
    if issuer_url:
        clean_issuer = issuer_url.rstrip("/")
        if not clean_issuer.startswith("http"):
            clean_issuer = f"https://{clean_issuer}"
        urls_to_try.append(f"{clean_issuer}/.well-known/jwks.json")

    if CLERK_ISSUER_DOMAIN:
        clean_domain = CLERK_ISSUER_DOMAIN.rstrip("/")
        if not clean_domain.startswith("http"):
            clean_domain = f"https://{clean_domain}"
        urls_to_try.append(f"{clean_domain}/.well-known/jwks.json")

    urls_to_try.append("https://api.clerk.com/v1/jwks")

    headers = {}
    if CLERK_SECRET_KEY:
        headers["Authorization"] = f"Bearer {CLERK_SECRET_KEY}"

    last_error = None
    for jwks_url in urls_to_try:
        try:
            resp = requests.get(jwks_url, headers=headers, timeout=10)
            if resp.status_code == 200:
                jwks = resp.json()
                keys_by_kid = {}
                for key_data in jwks.get("keys", []):
                    kid = key_data.get("kid")
                    if kid:
                        keys_by_kid[kid] = RSAAlgorithm.from_jwk(key_data)
                _JWKS_CACHE["keys"] = keys_by_kid
                _JWKS_CACHE["expires_at"] = now + 3600  # cache 1 hour
                return keys_by_kid
        except Exception as e:
            last_error = e
            continue

    print(f"[Clerk Auth] Failed to fetch JWKS: {last_error}")
    return _JWKS_CACHE.get("keys", {})


def verify_clerk_token(credentials: HTTPAuthorizationCredentials = Security(security_scheme)) -> dict:
    """
    Verify Clerk JWT token using RS256 JWKS signature verification.
    Extracts user_id, email, and role from token claims.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token missing",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        if not kid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token header: missing key ID (kid)",
            )

        # Inspect unverified claims to determine issuer if needed
        unverified_payload = jwt.decode(token, options={"verify_signature": False})
        iss = unverified_payload.get("iss")

        jwks_keys = get_clerk_jwks(issuer_url=iss)
        public_key = jwks_keys.get(kid)

        if not public_key:
            # Force refresh cache once if kid not found
            _JWKS_CACHE["expires_at"] = 0
            jwks_keys = get_clerk_jwks(issuer_url=iss)
            public_key = jwks_keys.get(kid)

        if not public_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Public key not found for token signature verification",
            )

        # Verify signature, expiration, and algorithm
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            options={
                "verify_signature": True,
                "verify_exp": True,
            },
        )

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject (user_id)",
            )

        # Extract role securely from public_metadata or claims
        public_meta = payload.get("public_metadata") or payload.get("metadata") or {}
        role = str(public_meta.get("role") or payload.get("role") or "USER").upper()

        email = payload.get("email") or payload.get("primary_email") or f"{user_id}@clerk.user"

        return {
            "user_id": user_id,
            "email": email,
            "role": role,
            "claims": payload,
        }

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired",
        )
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}",
        )
