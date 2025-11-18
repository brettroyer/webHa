from flask import Blueprint, render_template_string

main_bp = Blueprint('main', __name__)


@main_bp.route('/')
def index():
    return render_template_string('''
    <!DOCTYPE html>
    <html>
    <head>
      <title>MQTT Test</title>
      <script src="https://cdn.socket.io/4.6.1/socket.io.min.js"></script>
      <script>
        const socket = io();

        socket.on('connect', () => {
            console.log('Connected to server');
        });

        socket.on('mqtt_data', (data) => {
            console.log("MQTT Data:", data);
            document.getElementById('data').innerText = data.message;
        });
      </script>
    </head>
    <body>
      <h2>MQTT + SocketIO Test</h2>
      <div>Received: <span id="data">None</span></div>
    </body>
    </html>
    ''')
