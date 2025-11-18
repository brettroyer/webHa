import os.path

from flask import Blueprint, render_template, jsonify, Response, request
from flask_login import login_required, current_user
import json, time
from ...worker import worker
__basedir__ = os.path.dirname(os.path.abspath(__file__))

bp = Blueprint("cntl",
               __name__,
               url_prefix='/cntl',
               template_folder=os.path.join(__basedir__, 'templates'),
               static_folder=os.path.join(__basedir__, 'static')
               )


@bp.route("/")
@login_required
def index():
    return render_template("cntl.index.html", user=current_user)


def event_stream():
    while True:
        logs = worker.pop_logs()
        if logs:
            yield f"event: logs\ndata: {json.dumps(logs)}\n\n"
        status = worker.get_status()
        yield f"event: status\ndata: {json.dumps({'status': status, 'ts': time.time()})}\n\n"
        time.sleep(1.0)


@bp.route("/stream")
@login_required
def stream():
    return Response(event_stream(), mimetype="text/event-stream")


@bp.route("/api/start", methods=["POST"])
@login_required
def start():
    worker.start()
    return jsonify(worker.get_status())


@bp.route("/api/stop", methods=["POST"])
@login_required
def stop():
    worker.stop()
    return jsonify(worker.get_status())


@bp.route("/api/params", methods=["POST"])
@login_required
def params():
    data = request.json or {}
    worker.update(**data)
    return jsonify(worker.get_status())


@bp.route("/api/manual", methods=["POST"])
@login_required
def manual():
    return jsonify(worker.manual_step())


@bp.route("/api/status")
@login_required
def status():
    return jsonify(worker.get_status())
