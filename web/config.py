import os
from collections import deque
import urllib.parse


def mysql_uri():
    db_user = "admin"
    db_password = "admin"
    db_name = "webha"
    host = "192.168.1.87:3308"
    encoded_password = urllib.parse.quote_plus(db_password)

    return f"mysql+mysqlconnector://{db_user}:{encoded_password}@{host}/{db_name}"


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "devkey")
    MQTT_BROKER_URL = os.getenv("MQTT_BROKER", "localhost")
    MQTT_BROKER_PORT = int(os.getenv("MQTT_PORT", 1883))
    MQTT_USER = os.getenv("MQTT_USER", "") or None
    MQTT_PASS = os.getenv("MQTT_PASS", "") or None
    MQTT_KEEPALIVE = 60
    # MQTT_TOPIC = os.getenv("MQTT_TOPICS", "sensors/temp/1,sensors/temp/2,sensors/temp/3,sensors/temp/4")
    _topics = ("iGrill/data/probe1", "iGrill/data/probe2", "iGrill/data/probe3", "iGrill/data/probe4")
    MQTT_TOPIC = os.getenv("MQTT_TOPICS", _topics)
    SOCKETIO_ASYNC_MODE = os.getenv("SOCKETIO_ASYNC_MODE", "eventlet")  # eventlet recommended
    MAX_HISTORY = int(os.getenv("MAX_HISTORY", 100))

    # Prepare topics list and mapping -> sensor index
    TOPICS = [t.strip() for t in MQTT_TOPIC.split(",") if t.strip()]
    TOPIC_TO_INDEX = {topic: idx for idx, topic in enumerate(TOPICS)}
    # TOPIC_TO_SETPOINT = {150: idx for idx, topic in enumerate(TOPICS)}
    TOPIC_TO_SETPOINT = [150, 150, 150, 150]
    TOPIC_TO_ALARM = [True, True, True, True]

    # In-memory storage of last MAX_HISTORY points per sensor (timestamp, value)
    HISTORIES = [deque(maxlen=100) for _ in TOPICS]

    # SQL
    SECURITY_PASSWORD_SALT = '2006781966416166403938917619205615330'
    sqlalchemy_echo=False  # Flask-SQLAlchemy - The default value for echo and echo_pool for every engine. This is useful to quickly debug the connections and queries issued from SQLAlchemy.
    SQLALCHEMY_DATABASE_URI = mysql_uri()
    SQLALCHEMY_POOL_TIMEOUT = 30
    SQLALCHEMY_POOL_RECYCLE = 30
    SQLALCHEMY_MAX_OVERFLOW = 2
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True,}
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Flask-Caching related config
    # https://flask-caching.readthedocs.io/en/latest/
    CACHE_TYPE = "RedisCache"
    # CACHE_REDIS_HOST = 'redis'  # container network
    CACHE_REDIS_HOST = '192.168.1.87'
    CACHE_REDIS_PORT = 6380
    CACHE_REDIS_DB = 0
    _CACHE_REDIS_URL = f'redis://{CACHE_REDIS_HOST}:{CACHE_REDIS_PORT}/{CACHE_REDIS_DB}'  # 'redis://redis:6379/0'
    CACHE_REDIS_URL = _CACHE_REDIS_URL
    CACHE_DEFAULT_TIMEOUT = 500
