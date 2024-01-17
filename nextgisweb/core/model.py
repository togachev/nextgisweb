from nextgisweb.env import Base
from nextgisweb.lib import db


class CState(Base):
    __tablename__ = "core_cstate"

    component = db.Column(db.Unicode, primary_key=True)
    heads = db.Column(db.Unicode, nullable=False)


class Migration(Base):
    __tablename__ = "core_migration"

    component = db.Column(db.Unicode, primary_key=True)
    revision = db.Column(db.Unicode, primary_key=True)


class Setting(Base):
    __tablename__ = "setting"

    component = db.Column(db.Unicode, primary_key=True)
    name = db.Column(db.Unicode, primary_key=True)
    value = db.Column(db.JSONB, nullable=False)


storage_stat_dimension = db.Table(
    "core_storage_stat_dimension",
    Base.metadata,
    db.Column("tstamp", db.TIMESTAMP, nullable=False),
    db.Column("component", db.Unicode, nullable=False),
    db.Column("kind_of_data", db.Unicode, nullable=False),
    db.Column("resource_id", db.Integer, index=True),
    db.Column("value_data_volume", db.BigInteger),
)


storage_stat_dimension_total = db.Table(
    "core_storage_stat_dimension_total",
    Base.metadata,
    db.Column("tstamp", db.TIMESTAMP, nullable=False),
    db.Column("kind_of_data", db.Unicode, primary_key=True),
    db.Column("value_data_volume", db.BigInteger),
)


storage_stat_delta = db.Table(
    "core_storage_stat_delta",
    Base.metadata,
    db.Column("tstamp", db.TIMESTAMP, nullable=False),
    db.Column("component", db.Unicode, nullable=False),
    db.Column("kind_of_data", db.Unicode, nullable=False),
    db.Column("resource_id", db.Integer, index=True),
    db.Column("value_data_volume", db.BigInteger),
)


storage_stat_delta_total = db.Table(
    "core_storage_stat_delta_total",
    Base.metadata,
    db.Column("tstamp", db.TIMESTAMP, nullable=False),
    db.Column("kind_of_data", db.Unicode, primary_key=True),
    db.Column("value_data_volume", db.BigInteger),
)


db.event.listen(
    storage_stat_delta,
    "after_create",
    # fmt: off
    db.DDL("""
        CREATE FUNCTION core_storage_stat_delta_after_insert() RETURNS trigger
        LANGUAGE 'plpgsql' AS $BODY$
        BEGIN
            PERFORM pg_advisory_xact_lock('core_storage_stat_delta_total'::regclass::int, 0);

            UPDATE core_storage_stat_delta_total
            SET tstamp = NEW.tstamp, value_data_volume = value_data_volume + NEW.value_data_volume
            WHERE kind_of_data = NEW.kind_of_data;

            IF NOT found THEN
                INSERT INTO core_storage_stat_delta_total (tstamp, kind_of_data, value_data_volume)
                VALUES (NEW.tstamp, NEW.kind_of_data, NEW.value_data_volume);
            END IF;

            UPDATE core_storage_stat_delta_total
            SET tstamp = NEW.tstamp, value_data_volume = value_data_volume + NEW.value_data_volume
            WHERE kind_of_data = '';

            IF NOT found THEN
                INSERT INTO core_storage_stat_delta_total (tstamp, kind_of_data, value_data_volume)
                VALUES (NEW.tstamp, '', NEW.value_data_volume);
            END IF;

            RETURN NEW;
        END
        $BODY$;

        CREATE TRIGGER after_insert AFTER INSERT ON core_storage_stat_delta
        FOR EACH ROW EXECUTE PROCEDURE core_storage_stat_delta_after_insert();
    """),
    # fmt: on
    propagate=True,
)


db.event.listen(
    storage_stat_delta,
    "after_drop",
    db.DDL("DROP FUNCTION core_storage_stat_delta_after_insert();"),
    propagate=True,
)
