import os.path

from flask import Blueprint, render_template, jsonify, Response, request
from flask_login import login_required, current_user

__basedir__ = os.path.dirname(os.path.abspath(__file__))

bp = Blueprint("ha_templates",
                  __name__,
                  url_prefix='/ha_templates',
                  template_folder=os.path.join(__basedir__, 'templates'),
                  static_folder=os.path.join(__basedir__, 'static')
                  )


@bp.route("/")
@login_required
def index():
    return render_template("ha_templates.ha.html")