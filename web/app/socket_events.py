from . import socketio


def init_socketio_handlers(app):

    topics = app.config.get('TOPICS')
    histories = app.config.get('HISTORIES')
    topic_to_setpoint = app.config.get('TOPIC_TO_SETPOINT')
    topic_to_alarms = app.config.get('TOPIC_TO_ALARM')

    @socketio.on("connect")
    def handle_connect():
        # send current histories to the newly connected client
        payload = []
        for i, h in enumerate(histories):
            # convert deque to list of dicts
            payload.append(list(h))
        socketio.emit("initial_data", {"topics": topics,
                                       "histories": payload,
                                       "setpoints": topic_to_setpoint,
                                       "alarms": topic_to_alarms}
                      )
        print('[SocketIO] Client connected')

    @socketio.on('disconnect')
    def handle_disconnect():
        print('[SocketIO] Client disconnected')
