from fastapi import Depends, HTTPException, status
from .clerk import verify_clerk_token


def get_current_user(user_data: dict = Depends(verify_clerk_token)) -> dict:
    """Dependency returning authenticated user info."""
    return user_data


def require_admin(user_data: dict = Depends(get_current_user)) -> dict:
    """Dependency enforcing ADMIN role requirement. Returns 403 Forbidden if not ADMIN."""
    if user_data.get("role") != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: ADMIN role required",
        )
    return user_data
