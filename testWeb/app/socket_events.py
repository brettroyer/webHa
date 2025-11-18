from . import socketio


@socketio.on('connect')
def handle_connect():
    print('[SocketIO] Client connected')


@socketio.on('disconnect')
def handle_disconnect():
    print('[SocketIO] Client disconnected')
