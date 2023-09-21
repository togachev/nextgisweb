""" {
    "revision": "2bfa0320", "parents": ["00000000"],
    "message": "Drop foo table foreign key",
    "dependencies": [
        ["foo==2bfa06fe", "this"],
        ["this", "foo==2bfa061e"]
    ]
} """

from textwrap import dedent


def forward(ctx):
    # fmt: off
    ctx.execute(dedent("""
        ALTER TABLE bar RENAME TO bar_tmp;

        CREATE TABLE bar (
            id INTEGER PRIMARY KEY,
            foo_id TEXT NOT NULL
        );

        INSERT INTO bar SELECT * FROM bar_tmp;
        DROP TABLE bar_tmp;
    """))
    # fmt: on


def rewind(ctx):
    # fmt: off
    ctx.execute(dedent("""
        ALTER TABLE bar RENAME TO bar_tmp;

        CREATE TABLE bar (
            id INTEGER PRIMARY KEY,
            foo_id TEXT NOT NULL,
            FOREIGN KEY(foo_id) REFERENCES foo(id)
        );

        INSERT INTO bar SELECT * FROM bar_tmp;
        DROP TABLE bar_tmp;
    """))
    # fmt: on
