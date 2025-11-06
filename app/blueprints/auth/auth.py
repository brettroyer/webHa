from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, logout_user, current_user
from app.blueprints.auth.models import verify_credentials

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for("cntl.index"))
    if request.method == "POST":
        user = verify_credentials(request.form["username"], request.form["password"])
        if not user:
            flash("Invalid username or password", "danger")
            return render_template("cntl.login.html")
        login_user(user)
        flash("Logged in successfully.", "success")
        return redirect(url_for("main.index"))
    return render_template("cntl.login.html")


@auth_bp.route("/logout")
def logout():
    logout_user()
    flash("Logged out", "info")
    return redirect(url_for("auth.login"))
