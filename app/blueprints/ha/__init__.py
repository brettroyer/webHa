import os.path

from flask import Blueprint, render_template, jsonify, Response, request
from flask_login import login_required, current_user
import json, time
from app.worker import worker

__basedir__ = os.path.dirname(os.path.abspath(__file__))

ha_bp = Blueprint("ha",
                  __name__,
                  url_prefix='/ha',
                  template_folder=os.path.join(__basedir__, 'templates'),
                  static_folder=os.path.join(__basedir__, 'static')
                  )


@ha_bp.route("/")
@login_required
def index():
    return render_template("ha.index.html")


@ha_bp.route("/rooms")
@login_required
def rooms():
    return render_template("ha.rooms.html")


@ha_bp.route("/recent")
@login_required
def recent():
    return render_template("ha.recent.html")


@ha_bp.route("/bookmark")
@login_required
def bookmark():
    return render_template("ha.bookmark.html")


@ha_bp.route("/notification")
@login_required
def notification():
    return render_template("ha.notification.html")


@ha_bp.route("/settings")
@login_required
def settings():
    return render_template("ha.settings.html")