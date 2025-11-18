from app import create_app, socketio

app = create_app()

if __name__ == "__main__":
    # app.run(host='0.0.0.0', port=5000, debug=True, threaded=True)
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)
