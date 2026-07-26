"""
Helper script to grant ADMIN role to a Clerk user via Clerk API.

Usage:
  python backend/scripts/set_admin_role.py <USER_ID>
  
Example:
  python backend/scripts/set_admin_role.py user_2abc123xyz
"""
import sys
import os
import requests

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.config import CLERK_SECRET_KEY


def set_user_admin(user_id: str):
    if not CLERK_SECRET_KEY:
        print("❌ CLERK_SECRET_KEY is not set in environment variables.")
        print("You can also set the role manually in Clerk Dashboard -> Users -> Public Metadata:")
        print('{\n  "role": "ADMIN"\n}')
        return

    url = f"https://api.clerk.com/v1/users/{user_id}/metadata"
    headers = {
        "Authorization": f"Bearer {CLERK_SECRET_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "public_metadata": {
            "role": "ADMIN"
        }
    }

    resp = requests.patch(url, json=payload, headers=headers)
    if resp.status_code == 200:
        print(f"✅ Successfully updated user {user_id} role to ADMIN in Clerk!")
    else:
        print(f"❌ Failed to update role. Status: {resp.status_code}, Response: {resp.text}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python set_admin_role.py <USER_ID>")
        sys.exit(1)
    set_user_admin(sys.argv[1])
