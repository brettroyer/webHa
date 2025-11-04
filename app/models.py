from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

# In-memory demo user store
_users = {
    "admin": {
        "id": "admin",
        "username": "admin",
        "password_hash": generate_password_hash("admin"),
        "display_name": "Administrator"
    }
}


class User(UserMixin):
    def __init__(self, id_, username, display_name):
        self.id = id_
        self.username = username
        self.display_name = display_name


def load_user(user_id):
    info = _users.get(user_id)
    if not info:
        return None
    return User(info["id"], info["username"], info.get("display_name", info["username"]))


def verify_credentials(username, password):
    for info in _users.values():
        if info["username"] == username and check_password_hash(info["password_hash"], password):
            return User(info["id"], info["username"], info.get("display_name", info["username"]))
    return None
