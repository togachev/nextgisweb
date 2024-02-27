from datetime import datetime
from threading import Thread
from typing import ClassVar, Mapping, Type

import sqlalchemy as sa
import transaction
from zope.sqlalchemy import mark_changed

from nextgisweb.env import DBSession, _
from nextgisweb.lib.i18n import TrStr
from nextgisweb.lib.logging import logger
from nextgisweb.lib.registry import dict_registry

from .exception import UserException
from .model import (
    storage_stat_delta,
    storage_stat_delta_total,
    storage_stat_dimension,
    storage_stat_dimension_total,
)
from .util import format_size


@dict_registry
class KindOfData:
    registry: ClassVar[Mapping[str, Type["KindOfData"]]]

    identity: ClassVar[str]
    display_name: ClassVar[TrStr]


class StorageComponentMixin:
    def initialize(self):
        super().initialize()

        # Do flush reservations to the database as soon as possible. But
        # sometimes there's no flush event (for clean sessions).
        sa.event.listen(DBSession, "after_flush", self._flush_reservations)
        sa.event.listen(DBSession, "before_commit", self._flush_reservations)

    def check_storage_limit(self, requested=0):
        if (
            not self.options["storage.enabled"]
            or (volume_limit := self.options["storage.limit"]) is None
        ):
            return

        sinfo = DBSession().info
        current_total = sinfo.get("storage.cur")
        if current_total is None:
            with DBSession.no_autoflush:
                result = self.query_storage(where=dict(kind_of_data=lambda col: col == ""))
            current_total = sinfo["storage.cur"] = result[""]["data_volume"]

            # FIXME: Work around to clean up 'storage.cur' in DBSession().info
            mark_changed(DBSession())

        if volume_limit < current_total + requested:
            raise StorageLimitExceeded(
                total=current_total, limit=volume_limit, requested=requested
            )

    def reserve_storage(self, component, kind_of_data, value_data_volume=None, resource=None):
        if not self.options["storage.enabled"]:
            return

        # For now we reserve data volume only
        if value_data_volume is not None:
            sinfo = DBSession().info
            requested = value_data_volume + sinfo.setdefault("storage.txn", 0)

            # Don't need to check limit if freeing storage
            if value_data_volume > 0 and requested > 0:
                self.check_storage_limit(requested)

            sinfo["storage.txn"] = requested
            sinfo.setdefault("storage.res", []).append(
                dict(
                    component=component,
                    kind_of_data=kind_of_data,
                    resource=resource,
                    value_data_volume=value_data_volume,
                )
            )

        mark_changed(DBSession())

    def query_storage(self, where=None):
        if not where or len(set(where.keys()) - {"kind_of_data"}) == 0:
            # If there's no filters except kind_of_data, we use totals tables
            dimen = storage_stat_dimension_total.alias("di")
            delta = storage_stat_delta_total.alias("de")
        else:
            # Otherwise we have to use detatils tables
            dimen = storage_stat_dimension.alias("di")
            delta = storage_stat_delta.alias("de")

        whereclause = (
            sa.and_(v(sa.column(k)) for k, v in where.items())
            if where and len(where) > 0
            else True
        )

        source = (
            sa.select(
                dimen.c.kind_of_data,
                dimen.c.tstamp.label("estimated"),
                sa.sql.null().label("updated"),
                dimen.c.value_data_volume.label("data_volume"),
            )
            .where(whereclause)
            .union_all(
                sa.select(
                    delta.c.kind_of_data,
                    sa.sql.null(),
                    delta.c.tstamp,
                    delta.c.value_data_volume,
                ).where(whereclause)
            )
            .alias("src")
        )

        agg_cols = (
            sa.func.MIN(sa.column("estimated")).label("estimated"),
            sa.func.MAX(sa.column("updated")).label("updated"),
            # Dunno why, but w/o this cast postgres generates the numeric type
            sa.func.coalesce(sa.func.SUM(sa.column("data_volume")), 0)
            .cast(sa.BigInteger)
            .label("data_volume"),
        )

        agg = (
            sa.select(source.c.kind_of_data, *agg_cols).group_by(source.c.kind_of_data).cte("agg")
        )

        q = agg.select()
        if where is not None:
            q = q.union_all(sa.select(sa.literal(""), *agg_cols).select_from(agg))

        with DBSession.no_autoflush:
            return dict(
                (
                    row.kind_of_data,
                    dict(
                        estimated=row.estimated,
                        updated=row.updated,
                        data_volume=row.data_volume,
                    ),
                )
                for row in DBSession.query(q.alias("q"))
                if row.kind_of_data == "" or row.data_volume != 0
            )

    def estimate_storage_all(self):
        if not self.options["storage.enabled"]:
            logger.warning("Nothing to do because storage stat isn't enabled!")
            return

        timestamp = datetime.utcnow()
        try:
            logger.debug("Starting estimation...")
            with transaction.manager:
                con = DBSession().connection()

                con.execute(SQL_LOCK)
                logger.debug("Lock acquired, clearing tables...")
                self._clear_storage_tables()
                details = storage_stat_dimension
                totals = storage_stat_dimension_total

                for comp in self.env.components.values():
                    if hasattr(comp, "estimate_storage"):
                        logger.debug("Estimating storage of component '%s'...", comp.identity)
                        for kind_of_data, resource_id, size in comp.estimate_storage():
                            con.execute(
                                details.insert().values(
                                    dict(
                                        tstamp=timestamp,
                                        component=comp.identity,
                                        kind_of_data=kind_of_data.identity,
                                        resource_id=resource_id,
                                        value_data_volume=size,
                                    )
                                )
                            )

                qtotal = (
                    sa.select(
                        sa.literal(timestamp).label("tstamp"),
                        details.c.kind_of_data,
                        sa.func.sum(details.c.value_data_volume),
                    )
                    .group_by(details.c.kind_of_data)
                    .union_all(
                        sa.select(
                            sa.literal(timestamp),
                            sa.literal(""),
                            sa.func.coalesce(sa.func.sum(details.c.value_data_volume), 0),
                        )
                    )
                )

                con.execute(
                    totals.insert().from_select(
                        ["tstamp", "kind_of_data", "value_data_volume"], qtotal
                    )
                )

                summary = [
                    (k if k != "" else "total", v["data_volume"])
                    for k, v in self.query_storage().items()
                ]
                summary.sort(key=lambda i: i[1], reverse=True)

            logger.info("Estimation completed: %s", ", ".join("{}={}".format(*i) for i in summary))

        except Exception:
            logger.exception("Unexpected exception during estimation proccess")
            raise

    def start_estimation(self):
        already_running = not DBSession.execute(SQL_TRY_LOCK).scalar()
        if already_running:
            raise EstimationAlreadyRunning()

        Thread(target=self.estimate_storage_all).start()

    def estimation_running(self):
        result = not DBSession.execute(SQL_TRY_LOCK).scalar()
        return result

    def _flush_reservations(self, session, *args, **kwargs):
        # NOTE: We don't have to check storage.enabled here. If it's disabled,
        # there's not pending reservations in the list.

        sinfo = session.info

        if reservations := sinfo.get("storage.res"):
            tstamp = datetime.utcnow()
            session.connection().execute(
                storage_stat_delta.insert(),
                [
                    dict(
                        tstamp=tstamp,
                        component=res["component"],
                        kind_of_data=res["kind_of_data"].identity,
                        resource_id=None if res["resource"] is None else res["resource"].id,
                        value_data_volume=res["value_data_volume"],
                    )
                    for res in reservations
                ],
            )

        # Cleanup storage session info
        sinfo.pop("storage.res", None)
        sinfo.pop("storage.txn", None)
        sinfo.pop("storage.cur", None)

    def _clear_storage_tables(self):
        for tab in STORAGE_TABLES:
            DBSession.execute(tab.delete())
        mark_changed(DBSession())


STORAGE_TABLES = (
    storage_stat_dimension,
    storage_stat_dimension_total,
    storage_stat_delta,
    storage_stat_delta_total,
)

LOCK_TABLE = sa.text("'core_storage_stat_dimension'::regclass::int")
SQL_LOCK = sa.text("SELECT pg_advisory_xact_lock({}, 0)".format(LOCK_TABLE))
SQL_TRY_LOCK = sa.text("SELECT pg_try_advisory_xact_lock({}, 0)".format(LOCK_TABLE))


class StorageLimitExceeded(UserException):
    http_status_code = 402

    def __init__(self, *, total, limit, requested=0):
        data = dict(storage_total=total, storage_limit=limit)
        if requested != 0:
            data["storage_requested"] = requested

        assert total + requested > limit
        if requested == 0 or limit < total:
            # TODO: Humanize output of sizes
            super().__init__(
                title=_("Storage full"),
                message=_(
                    "This operation can't be performed because the storage "
                    "limit (%s) has been already exceeded by %s."
                )
                % (format_size(limit), format_size(total - limit)),
                data=data,
            )
        else:
            # TODO: Humanize output of sizes
            super().__init__(
                title=_("Not enough storage"),
                message=_(
                    "This operation requires %s of storage and can't be "
                    "performed because only %s available."
                )
                % (format_size(requested), format_size(limit - total)),
                data=data,
            )


class EstimationAlreadyRunning(UserException):
    title = _("Estimation is already running")
    http_status_code = 503
