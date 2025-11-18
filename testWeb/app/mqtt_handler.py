from . import mqtt, socketio
from queue import Queue
import threading
import time

mqtt_queue = Queue()


def init_mqtt_handlers(app):
    @mqtt.on_connect()
    def handle_connect(client, userdata, flags, rc):
        topic = app.config['MQTT_TOPIC']
        mqtt.subscribe(topic)
        print(f"[MQTT] Connected and subscribed to {topic}")

    @mqtt.on_message()
    def handle_mqtt_message(client, userdata, message):
        payload = message.payload.decode()
        print(f"[MQTT] Message: {payload}")
        mqtt_queue.put(payload)

    # Start background thread (only once)
    threading.Thread(target=mqtt_background_task, daemon=True).start()


def mqtt_background_task():
    while True:
        msg = mqtt_queue.get()
        socketio.emit('mqtt_data', {'message': msg})
        print(f"[SocketIO] Emitted message: {msg}")
        time.sleep(0.1)
