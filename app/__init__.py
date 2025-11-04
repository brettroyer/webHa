from flask import Flask
from flask_login import LoginManager
from .models import load_user, _users
from .worker import worker

login_manager = LoginManager()
login_manager.login_view = "auth.login"


def create_app():
    app = Flask(__name__)
    app.secret_key = "change-this-secret"

    login_manager.init_app(app)
    login_manager.user_loader(load_user)

    # register blueprints
    from app.blueprints.auth.auth import auth_bp
    from app.blueprints.main.main import main_bp
    from app.blueprints.ha import ha_bp
    app.register_blueprint(auth_bp)
    app.register_blueprint(main_bp)
    app.register_blueprint(ha_bp)

    # Start background worker (idle until started)
    _ = worker

    return app
