import csv
from datetime import datetime
from enum import Enum
from io import StringIO
from typing import Dict, List, Optional, Tuple, Union

import sqlalchemy as sa
import sqlalchemy.dialects.postgresql as sa_pg
from msgspec import Meta, Struct
from msgspec.json import decode as msgspec_decode
from pyramid.response import Response
from typing_extensions import Annotated

from nextgisweb.env import DBSession, inject
from nextgisweb.lib.apitype import AnyOf, AsJSON, ContentType

from nextgisweb.jsrealm import TSExport

from .backend import require_backend
from .component import AuditComponent
from .model import tab_journal

MAX_ROWS = 1_000_000
TIMESTAMP_PATTERN = r"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,6})?$"
FIELD_PATTERN = r"^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$"

Timestamp = Annotated[str, Meta(pattern=TIMESTAMP_PATTERN)]
Field = Annotated[str, Meta(pattern=FIELD_PATTERN)]
Filter = Dict[Field, Union[None, str, int, bool]]


class RequestObject(Struct):
    path: Annotated[str, Meta(description="Request path")]
    method: Annotated[str, Meta(description="HTTP method")]
    remote_addr: Annotated[str, Meta(description="Remote IP address")]


class ResponseObject(Struct):
    route_name: Annotated[str, Meta(description="Routee name")]
    status_code: Annotated[int, Meta(description="HTTP status code")]


class UserObject(Struct):
    id: Annotated[int, Meta(description="User ID")]
    keyname: Annotated[str, Meta(description="User keyname")]
    display_name: Annotated[str, Meta(description="Display name of user")]


class AuditObject(Struct):
    request: RequestObject
    response: ResponseObject
    user: Optional[UserObject] = None


AuditArrayLogEntry = Annotated[
    Tuple[
        Annotated[str, Meta(description="Timestamp")],
        Annotated[List[Union[str, int, None]], Meta(description="Fields")],
    ],
    TSExport("AuditArrayLogEntry"),
]


class QueryFormat(Enum):
    ARRAY = "array"
    OBJECT = "object"
    CSV = "csv"


def _field_expr(dcol, field):
    return dcol.op("#>")(sa.text(f"'{{{','.join(field.split('.'))}}}'"))


def _select_fields(dcol, fields):
    terms = []
    op = dcol.op("#>")
    for field in fields:
        parts = field.split(".")
        terms.append(op(sa.text(f"'{{{','.join(parts)}}}'")))
    return terms


@inject()
def dbase(
    request,
    *,
    format: QueryFormat,
    eq: Optional[Timestamp] = None,
    gt: Optional[Timestamp] = None,
    ge: Optional[Timestamp] = None,
    lt: Optional[Timestamp] = None,
    le: Optional[Timestamp] = None,
    fields: List[Field] = [],
    filter: Optional[str] = None,
    limit: Annotated[int, Meta(gt=0, le=MAX_ROWS)] = MAX_ROWS,
    comp: AuditComponent,
) -> AnyOf[
    AsJSON[List[AuditArrayLogEntry]],
    AsJSON[List[AuditObject]],
    Annotated[str, ContentType("text/csv")],
]:
    request.require_administrator()
    require_backend("dbase")

    tcol = tab_journal.c.tstamp
    dcol = tab_journal.c.data

    if format in (QueryFormat.ARRAY, QueryFormat.CSV):
        terms = _select_fields(dcol, fields)
    else:
        terms = [dcol]

    oldest = datetime.utcnow() - comp.backends["dbase"].options["retention"]
    q = sa.select(tcol, *terms).where(
        tcol >= oldest,
        *(
            ([tcol == eq] if eq else [])
            + ([tcol > gt] if gt else [])
            + ([tcol >= ge] if ge else [])
            + ([tcol < lt] if lt else [])
            + ([tcol <= le] if le else [])
        ),
    )
    q = q.order_by(tcol.asc(), tab_journal.c.ident.asc()).limit(limit)

    if filter is not None:
        filter_obj = msgspec_decode(filter, type=Filter)
        for k, v in filter_obj.items():
            q = q.where(_field_expr(dcol, k) == sa.cast(v, sa_pg.JSONB))

    rows = DBSession.execute(q)

    if format == QueryFormat.ARRAY:
        return [(row[0], row[1:]) for row in rows]
    elif format == QueryFormat.OBJECT:
        return [data for _, data in rows]
    elif format == QueryFormat.CSV:
        buf = StringIO()
        writer = csv.writer(buf, dialect="excel")
        writer.writerow(["@timestamp"] + fields)

        first = None
        last = None
        for row in rows:
            tstamp = last = row[0]
            if first is None:
                first = tstamp
            writer.writerow(row)

        fnparts = ["journal"]
        if first:
            fnparts.append(first.strftime(r"%Y%m%d_%H%M%S"))
        if last:
            fnparts.append(last.strftime(r"%Y%m%d_%H%M%S"))
        fn = "-".join(fnparts) + ".csv"

        return Response(
            buf.getvalue(),
            content_type="text/csv",
            content_disposition=f"attachment; filename={fn}",
        )


def setup_pyramid(comp, config):
    config.add_route(
        "audit.dbase",
        "/api/component/audit/dbase",
        get=dbase,
    )
