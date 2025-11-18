import os.path
import re

from flask import Blueprint, render_template, jsonify, Response, request
from flask_login import login_required, current_user

__basedir__ = os.path.dirname(os.path.abspath(__file__))

bp = Blueprint("igrill",
                  __name__,
                  url_prefix='/igrill',
                  template_folder=os.path.join(__basedir__, 'templates'),
                  static_folder=os.path.join(__basedir__, 'static')
                  )

"""
@bp.route('/api/', methods=["POST"])
@cache.cached(timeout=3600)
def api():
"""


@bp.route("/")
@login_required
def index():
    return render_template("igrill.index.html")


@bp.route("/update_checkbox", methods=('GET', 'POST'))
def update_checkbox():
    data = request.get_json()
    index = int(re.findall(r'\d+', data.get('id'))[0])
    print(data)
    return jsonify({"data": data})


@bp.route("/update_sp", methods=('GET', 'POST'))
def update_sp():
    data = request.get_json()
    index = int(re.findall(r'\d+', data.get('id'))[0])
    print(data)
    return jsonify({"data": data})
