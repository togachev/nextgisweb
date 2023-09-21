""" {
    "revision": "2e8a9c51", "parents": ["2d9056c4"],
    "date": "2021-05-13T03:55:30",
    "message": "Add instance ID"
} """


import json
import uuid

from sqlalchemy import text

from nextgisweb.models import DBSession


def forward(ctx):
    connection = DBSession.connection()
    instance_id = ctx.env.core.options.get("provision.instance_id", str(uuid.uuid4()))

    # fmt: off
    connection.execute(text("""
        INSERT INTO setting (component, name, value)
        VALUES ('core', 'instance_id', :instance_id)
    """), dict(instance_id=json.dumps(instance_id)))
    # fmt: on


def rewind(ctx):
    # fmt: off
    DBSession.execute(text("""
        DELETE FROM setting
        WHERE component = 'core' AND name = 'instance_id';
    """))
    # fmt: on
