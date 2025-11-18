import click
from flask.cli import with_appcontext
from flask import current_app as app
from .db import db, Probe
from sqlalchemy import exc


@click.command(name='hello')
@with_appcontext
def hello():
    print("hello world")


@click.command(name='create_all')
@with_appcontext
def create_all():
    db.drop_all()
    db.create_all()


@click.command(name='test_add_probe')
@with_appcontext
def test_add_probe():
    topics = app.config.get('TOPICS')
    print(topics)
    probe = db.session.query(Probe).filter_by(name='Probe1').first()
    if not probe:
        new_probe = Probe(name='Probe1',
                          index=0,
                          topic='iGrill/data/probe1',
                          alarm_en=True,
                          alarm_sp=200
                          )
        try:
            app.logger.info(f"Adding {new_probe.name} to the db")
            db.session.add(new_probe)
            db.session.commit()
        except exc.SQLAlchemyError as e:
            db.session.rollback()
            app.logger.debug(f"Probe Add db Error: {e}")
    else:
        pass
        # Update data
        probe.alarm_en = True
        probe.alarm_sp = 250
        try:
            print(f"Updating {probe.name} to the db")
            db.session.commit()
        except exc.SQLAlchemyError as e:
            db.session.rollback()
            app.logger.debug(f"Probe edit db Error: {e}")


# @click.command(name='test_remove_db')
# @with_appcontext
# def test_remove_db():
#     arthur = Arthur.query.filter_by(name='A.D. Trosper').first()
#     if arthur:
#         try:
#             app.logger.info(f"Removing {arthur.name} from the db")
#             db.session.delete(arthur)
#             db.session.commit()
#         except exc.SQLAlchemyError as e:
#             db.session.rollback()
#             app.logger.debug(f"Podcast Remove db Error: {e}")







