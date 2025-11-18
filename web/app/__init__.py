from flask import Flask
from flask_socketio import SocketIO
from flask_mqtt import Mqtt
from flask_login import LoginManager
from .extentions import cache
from .blueprints.auth.models import load_user, _users
from .worker import worker
from .db import db
from .commands import create_all, hello, test_add_probe
import logging
from dotenv import load_dotenv
load_dotenv()  # loads .env if present

logging.basicConfig()

login_manager = LoginManager()
login_manager.login_view = "auth.login"

socketio = SocketIO(async_mode='threading', cors_allowed_origins="*")
mqtt = Mqtt()


def register_blueprints(app):
    # register blueprints
    from .blueprints.auth.auth import auth_bp
    from .blueprints.main import main_bp
    from .blueprints.ha import ha_bp
    app.register_blueprint(auth_bp)
    app.register_blueprint(main_bp)
    app.register_blueprint(ha_bp)

    from .blueprints.ha_templates import bp as ha_templates
    app.register_blueprint(ha_templates)

    from .blueprints.cntl import bp as cntl
    app.register_blueprint(cntl)
    # Start background worker (idle until started)
    # _ = worker

    from .blueprints.igrill import bp as grill
    app.register_blueprint(grill)


def register_handlers(app):
    # Register MQTT handlers
    from .mqtt_handler import init_mqtt_handlers
    init_mqtt_handlers(app)

    from .socket_events import init_socketio_handlers
    init_socketio_handlers(app)


def initialize_extensions(app):
    db.init_app(app)
    cache.init_app(app)
    socketio.init_app(app)
    mqtt.init_app(app)
    login_manager.init_app(app)
    login_manager.user_loader(load_user)


def register_commands(app):
    app.cli.add_command(hello)
    app.cli.add_command(create_all)
    app.cli.add_command(test_add_probe)


def create_app(config_class=None):
    app = Flask(__name__)
    app.config.from_object(config_class or "config.Config")

    with app.app_context():
        register_commands(app)
        initialize_extensions(app)
        register_blueprints(app)
        register_handlers(app)

    return app
