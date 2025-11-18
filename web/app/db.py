from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import (
    String, Integer, Boolean
)
from datetime import datetime

db = SQLAlchemy()


class Probe(db.Model):
    __tablename__ = 'probe'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    index: Mapped[int] = mapped_column(Integer, unique=True)
    name: Mapped[str] = mapped_column(String(255), unique=True)
    topic: Mapped[str] = mapped_column(String(255), unique=True)
    alarm_en: Mapped[bool] = mapped_column(Boolean, default=False)
    alarm_sp: Mapped[int] = mapped_column(Integer, unique=False)

    def __repr__(self):
        return self.topic
