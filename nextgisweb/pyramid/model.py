from nextgisweb.env import Base
from nextgisweb.lib import db


class Session(Base):
    __tablename__ = "pyramid_session"

    id = db.Column(db.Unicode(32), primary_key=True)
    created = db.Column(db.DateTime, nullable=False)
    last_activity = db.Column(db.DateTime, nullable=False)


class SessionStore(Base):
    __tablename__ = "pyramid_session_store"

    session_id = db.Column(db.ForeignKey(Session.id, ondelete="cascade"), primary_key=True)
    key = db.Column(db.Unicode, primary_key=True)
    value = db.Column(db.JSONB, nullable=False)

    session = db.relationship(
        Session, foreign_keys=session_id, backref=db.backref("store", cascade="all,delete-orphan")
    )
