from flask import Flask
from flask_socketio import SocketIO
from flask_mqtt import Mqtt

socketio = SocketIO(async_mode='threading', cors_allowed_origins="*")
mqtt = Mqtt()


def register_blueprints(app):
    # Register routes
    from .routes import main_bp
    app.register_blueprint(main_bp)


def register_mqtt_handlers(app):
    # Register MQTT handlers
    from .mqtt_handler import init_mqtt_handlers
    init_mqtt_handlers(app)


def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'secret!'
    app.config['MQTT_BROKER_URL'] = '192.168.1.50'
    app.config['MQTT_BROKER_PORT'] = 1883
    app.config['MQTT_KEEPALIVE'] = 60
    app.config['MQTT_TOPIC'] = 'test/topic'

    # Initialize extensions
    socketio.init_app(app)
    mqtt.init_app(app)

    with app.app_context():
        register_blueprints(app)
        register_mqtt_handlers(app)

    return app
