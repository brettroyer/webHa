from . import mqtt, socketio
from queue import Queue
import threading
import time
import logging

mqtt_queue = Queue()


def init_mqtt_handlers(app):
    MQTT_USER = app.config.get('MQTT_USER')
    MQTT_PASS = app.config.get('MQTT_PASS')
    if MQTT_USER and MQTT_PASS:
        mqtt.client.username_pw_set(MQTT_USER, MQTT_PASS)

    # Prepare topics list and mapping -> sensor index
    topics = app.config.get('TOPICS')
    topic_to_index = app.config.get('TOPIC_TO_INDEX')
    # In-memory storage of last MAX_HISTORY points per sensor (timestamp, value)
    histories = app.config.get('HISTORIES')

    @mqtt.on_connect()
    def handle_connect(client, userdata, flags, rc):
        logging.info(f"[MQTT] Connected with rc={rc}")
        for t in topics:
            mqtt.subscribe(t)
            print(f"[MQTT] Subscribed to {t}")
            # TODO: Add to db

    @mqtt.on_message()
    def handle_mqtt_message(client, userdata, msg):
        topic = msg.topic
        payload = msg.payload.decode('utf-8').strip()
        ts = int(time.time() * 1000)  # milliseconds
        # Try parse value as float
        try:
            val = float(payload)
        except Exception as e:
            print(f"[MQTT] Could not parse payload for {topic}: {payload}")
            return

        idx = topic_to_index.get(topic)
        if idx is None:
            # optionally ignore or log
            print(f"[MQTT] received message for untracked topic {topic}")
            return

        # Append to history
        _hist = {"t": ts, "v": val}
        histories[idx].append(_hist)

        # Emit to all connected web clients
        data = {"index": idx, "value": val, "timestamp": ts}
        socket_topic = "mqtt_update"
        mqtt_queue.put(data)
        print(f"[MQTT] {topic} -> sensor {idx + 1}: {val} on topic: {socket_topic}")

    # Start background thread (only once)
    threading.Thread(target=mqtt_background_task, daemon=True).start()


def mqtt_background_task():
    while True:
        msg = mqtt_queue.get()
        socketio.emit('mqtt_update', msg)
        print(f"[SocketIO] Emitted message: {msg}")
        time.sleep(0.1)
