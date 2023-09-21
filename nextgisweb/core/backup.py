import io
import json
import os
import re
from collections import namedtuple
from contextlib import contextmanager
from functools import lru_cache
from packaging.version import Version
from subprocess import check_call, check_output

import sqlalchemy as sa
import transaction
from zope.sqlalchemy import mark_changed

from nextgisweb.env import DBSession
from nextgisweb.lib.logging import logger
from nextgisweb.lib.registry import dict_registry

IR_FIELDS = ("id", "identity", "payload")
IndexRecord = namedtuple("IndexRecord", IR_FIELDS)


class IndexFile:
    def __init__(self, filename):
        self.filename = filename

    @contextmanager
    def writer(self):
        def write(record):
            if write.fp is None:
                write.fp = io.open(self.filename, "w", newline="\n", encoding="utf-8")

            fp = write.fp
            fp.write(json.dumps(dict(zip(IR_FIELDS, record)), ensure_ascii=False))
            fp.write("\n")

        write.fp = None

        yield write

        if write.fp is not None:
            write.fp.close()

    @contextmanager
    def reader(self):
        with io.open(self.filename, "r", newline="\n", encoding="utf-8") as fp:

            def read():
                for line in fp:
                    data = json.loads(line)
                    yield IndexRecord(**data)

            yield read()


@dict_registry
class BackupBase:
    def __init__(self, payload):
        self.payload = payload
        self.component = None

    def bind(self, component):
        self.component = component

    @property
    def blob(self):
        return False

    def backup(self, dst):
        raise NotImplementedError()

    def restore(self, src):
        raise NotImplementedError()


class BackupConfiguration:
    def __init__(self):
        self._exclude_table = list()
        self._exclude_table_data = list()

    def exclude_table(self, schema, table):
        self._exclude_table.append("{}.{}".format(schema, table))

    def exclude_table_data(self, schema, table):
        self._exclude_table_data.append("{}.{}".format(schema, table))


BackupMetadata = namedtuple("BackupMetadata", ["filename", "timestamp", "size"])


def parse_pg_dump_version(output):
    """Parse output of pg_dump --version to Version"""
    output = output.strip()
    output = re.sub(r"\(.*?\)", " ", output)
    m = re.search(r"\d+(?:\.\d+){1,}", output)
    if m is None:
        raise ValueError("Unrecognized pg_dump output!")
    return Version(m.group(0))


def pg_connection_options(env):
    con_args = env.core._db_connection_args()
    return [
        "--host",
        con_args["host"],
        "--port",
        str(con_args["port"]),
        "--username",
        con_args["username"],
        "--dbname",
        con_args["database"],
    ], con_args["password"]


def backup(env, dst):
    # TRANSACTION AND CONNECTION

    con = DBSession.connection()
    con.execute(sa.text("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE " "   READ ONLY DEFERRABLE"))

    (snapshot,) = con.execute(sa.text("SELECT pg_export_snapshot()")).fetchone()
    logger.debug("Using postgres snapshot: %s", snapshot)

    # CONFIGURATION

    config = BackupConfiguration()
    for comp in env.chain("backup_configure"):
        comp.backup_configure(config)

    # POSTGES DUMP

    logger.info("Dumping PostgreSQL database...")

    pg_dir = os.path.join(dst, "postgres")
    os.mkdir(pg_dir)

    pgd_version = parse_pg_dump_version(
        check_output(["/usr/bin/pg_dump", "--version"]).decode("utf-8")
    )
    if pgd_version < Version("10.0"):
        raise RuntimeError("pg_dump 10.0+ required")

    exc_opt = list()
    if len(config._exclude_table) > 0:
        logger.debug("Excluding table: %s", ", ".join(config._exclude_table))
        exc_opt += ["--exclude-table={}".format(i) for i in config._exclude_table]

    if len(config._exclude_table_data) > 0:
        logger.debug("Excluding table data: %s", ", ".join(config._exclude_table_data))
        exc_opt += ["--exclude-table-data={}".format(i) for i in config._exclude_table_data]

    pg_copt, pg_pass = pg_connection_options(env)
    check_call(
        [
            "/usr/bin/pg_dump",
            "--format=directory",
            "--compress=0",
            "--file={}".format(pg_dir),
            "--snapshot={}".format(snapshot),
        ]
        + exc_opt
        + pg_copt,
        env=dict(PGPASSWORD=pg_pass),
    )

    pg_listing = check_output(["/usr/bin/pg_restore", "--list", pg_dir]).decode("utf-8")

    @lru_cache(maxsize=None)
    def get_cls_relname(oid):
        (relname,) = con.execute(
            sa.text("SELECT relname FROM pg_catalog.pg_class WHERE oid = :oid"), dict(oid=oid)
        ).fetchone()
        return relname

    def get_namespace(oid):
        (nspname,) = con.execute(
            sa.text("SELECT nspname FROM pg_catalog.pg_namespace WHERE oid = :oid"), dict(oid=oid)
        ).fetchone()
        return nspname

    pg_toc_regexp = re.compile(r"(\d+)\;\s+(\d+)\s+(\d+)\s+(.*)")

    restore_list = []
    skip_prev = False
    for line in pg_listing.split("\n"):
        if line == "" or line.startswith(";"):
            restore_list.append(line)
            continue

        skip = False
        m = pg_toc_regexp.match(line)
        if m:
            did, cls_oid, obj_oid, rest = m.groups()
            cls_oid = int(cls_oid)
            obj_oid = int(obj_oid)

            cls_relname = get_cls_relname(cls_oid) if cls_oid != 0 else None

            # Skip restoration: database, extensions, public schema
            # and comments for skipped comments
            skip = (
                cls_relname in ("pg_database", "pg_extension")
                or (cls_relname == "pg_namespace" and get_namespace(obj_oid) == "public")
                or (skip_prev and rest.startswith("COMMENT "))
            )

            restore_list.append((";" if skip else "") + line)
        else:
            logger.warn("Unexpected line in TOC: %s", line)

        skip_prev = skip

    pg_restore_list = os.path.join(pg_dir, "restore")
    with io.open(pg_restore_list, "w") as fd:
        fd.write("\n".join(restore_list))

    # CUSTOM COMPONENT DATA

    logger.info("Dumping components data...")

    comp_root = os.path.join(dst, "component")
    os.mkdir(comp_root)

    for comp in env.chain("backup_objects"):
        comp_dir = os.path.join(comp_root, comp.identity)
        os.mkdir(comp_dir)

        idx_file = IndexFile(os.path.join(comp_dir, "$index"))
        with idx_file.writer() as idx_write:
            for seq, itm in enumerate(comp.backup_objects(), start=1):
                itm.bind(comp)
                record = IndexRecord(id=seq, identity=itm.identity, payload=itm.payload)
                if itm.blob:
                    binfn = os.path.join(comp_dir, "{:08d}".format(seq))
                    with io.open(binfn, "wb") as fd:
                        itm.backup(fd)

                idx_write(record)

        # Remove empty component directory
        if len(os.listdir(comp_dir)) == 0:
            os.rmdir(comp_dir)


def restore(env, src):
    metadata = env.metadata()
    with transaction.manager:
        metadata.drop_all(DBSession().connection())
        mark_changed(DBSession())

    # POSTGRES RESTORE
    logger.info("Restoring PostgreSQL dump...")

    pg_dir = os.path.join(src, "postgres")
    pg_restore_list = os.path.join(pg_dir, "restore")

    pg_copt, pg_pass = pg_connection_options(env)
    check_call(
        [
            "/usr/bin/pg_restore",
            "--clean",
            "--if-exists",
            "--no-owner",
            "--no-privileges",
            "--exit-on-error",
            "--use-list",
            pg_restore_list,
        ]
        + pg_copt
        + [
            pg_dir,
        ],
        env=dict(PGPASSWORD=pg_pass),
    )

    # CUSTOM COMPONENT DATA
    logger.info("Restoring component data...")

    comp_root = os.path.join(src, "component")
    with transaction.manager:
        for comp_identity in os.listdir(comp_root):
            comp = env.components[comp_identity]
            comp_dir = os.path.join(comp_root, comp_identity)
            idx_fn = os.path.join(comp_dir, "$index")
            if os.path.exists(idx_fn):
                idx_file = IndexFile(idx_fn)
                with idx_file.reader() as read:
                    for record in read:
                        itm = BackupBase.registry[record.identity](record.payload)
                        itm.bind(comp)
                        if itm.blob:
                            binfn = os.path.join(comp_dir, "{:08d}".format(record.id))
                            with io.open(binfn, "rb") as fd:
                                itm.restore(fd)
        mark_changed(DBSession())
