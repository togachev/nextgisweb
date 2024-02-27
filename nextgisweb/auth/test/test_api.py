from datetime import datetime, timedelta
from itertools import product
from urllib.parse import parse_qs, urlparse

import pytest
import transaction
from freezegun import freeze_time

from nextgisweb.env import DBSession
from nextgisweb.lib import db

from nextgisweb.auth import Group, User


@pytest.fixture(scope="module", autouse=True)
def disable_oauth(ngw_env):
    auth = ngw_env.auth

    prev_helper = auth.oauth
    with auth.options.override({"oauth.enabled": False}):
        auth.oauth = None
        yield
    auth.oauth = prev_helper


def user_url(user_id=None):
    return "/api/component/auth/user/" + (str(user_id) if user_id else "")


def group_url(group_id=None):
    return "/api/component/auth/group/" + (str(group_id) if group_id else "")


@pytest.fixture(scope="class")
def user():
    with transaction.manager:
        user = User(
            keyname="test-user", display_name="test-user", password="password123"
        ).persist()
        DBSession.flush()

    yield user

    with transaction.manager:
        DBSession.delete(User.filter_by(id=user.id).one())


@pytest.fixture(scope="class")
def group():
    with transaction.manager:
        group = Group(
            keyname="test-group",
            display_name="test-group",
        ).persist()
        DBSession.flush()

    yield group

    with transaction.manager:
        DBSession.delete(Group.filter_by(id=group.id).one())


def _test_current_user(ngw_webtest_app, keyname, *, auth_medium=None, auth_provider=None):
    res = ngw_webtest_app.get("/api/component/auth/current_user").json
    assert res["keyname"] == keyname
    assert auth_medium is None or (res["auth_medium"] == auth_medium)
    assert auth_provider is None or (res["auth_provider"] == auth_provider)


def test_login_logout(user, ngw_webtest_app, ngw_env):
    sid_cookie = ngw_env.pyramid.options["session.cookie.name"]

    _test_current_user(ngw_webtest_app, "guest")

    ngw_webtest_app.post(
        "/api/component/auth/login",
        dict(login="test-user", missing="password"),
        status=422,
    )
    ngw_webtest_app.post(
        "/api/component/auth/login",
        dict(login="test-user", password="invalid"),
        status=401,
    )

    ngw_webtest_app.post(
        "/api/component/auth/login",
        dict(login="test-user", password="password123"),
        status=200,
    )
    _test_current_user(
        ngw_webtest_app, "test-user", auth_medium="session", auth_provider="local_pw"
    )
    assert sid_cookie in ngw_webtest_app.cookies, "Login must create a session"

    ngw_webtest_app.post(
        "/api/component/auth/logout",
        status=200,
    )
    _test_current_user(ngw_webtest_app, "guest")

    ngw_webtest_app.post_json(
        "/api/component/auth/login",
        dict(login=42, password="password123"),
        status=422,
    )

    ngw_webtest_app.post_json(
        "/api/component/auth/login",
        dict(login="test-user", password="password123"),
        status=200,
    )
    _test_current_user(ngw_webtest_app, "test-user")

    ngw_webtest_app.post(
        "/api/component/auth/logout",
        status=200,
    )
    _test_current_user(ngw_webtest_app, "guest")
    assert sid_cookie not in ngw_webtest_app.cookies, "Logout must invalidate the session"


def test_login_no_password(user, ngw_webtest_app):
    with transaction.manager:
        User.filter_by(id=user.id).one().password = None

    ngw_webtest_app.post(
        "/api/component/auth/login",
        dict(login=user.keyname, password=None),
        status=401,
    )


def test_session_invite(user, ngw_env, ngw_webtest_app):
    sid_cookie = ngw_env.pyramid.options["session.cookie.name"]

    with transaction.manager:
        url = ngw_env.auth.session_invite(user.keyname, "https://no-matter/some/path")
    result = urlparse(url)

    query = parse_qs(result.query)
    sid = query["sid"][0]
    expires = query["expires"][0]
    expires_dt = datetime.fromisoformat(expires)
    next_url = query["next"][0]
    assert next_url == "/some/path"

    ngw_webtest_app.post(
        "/api/component/auth/login",
        dict(
            login="test-user",
            password="password123",
            status=302,
        ),
    )
    sid_cookie in ngw_webtest_app.cookies
    assert ngw_webtest_app.cookies[sid_cookie] != sid
    _test_current_user(ngw_webtest_app, "test-user")

    ngw_webtest_app.post(
        "/session-invite",
        dict(sid=sid + "invalid", expires=expires),
        status=401,
    )

    ngw_webtest_app.post(
        "/session-invite",
        dict(sid=sid, expires=expires_dt + timedelta(seconds=1)),
        status=401,
    )

    with freeze_time(expires_dt + timedelta(seconds=1)):
        ngw_webtest_app.post(
            "/session-invite",
            dict(sid=sid, expires=expires),
            status=401,
        )

    with freeze_time(expires_dt - timedelta(minutes=5)):
        ngw_webtest_app.post(
            "/session-invite",
            dict(sid=sid, expires=expires),
            status=302,
        )

    assert sid_cookie in ngw_webtest_app.cookies
    assert ngw_webtest_app.cookies[sid_cookie] == sid
    _test_current_user(ngw_webtest_app, "test-user", auth_medium="session", auth_provider="invite")

    ngw_webtest_app.get("/logout", status=302)
    sid_cookie not in ngw_webtest_app.cookies
    _test_current_user(ngw_webtest_app, "guest")

    # Invite can be used only once
    ngw_webtest_app.post(
        "/session-invite",
        dict(sid=sid, expires=expires),
        status=401,
    )


@pytest.fixture()
def disable_users():
    active_uids = []

    with transaction.manager:
        for user in User.filter(
            db.and_(
                User.keyname != "administrator",
                db.not_(User.disabled),
                db.not_(User.system),
            )
        ).all():
            user.disabled = True
            active_uids.append(user.id)

    yield

    with transaction.manager:
        for user in User.filter(User.id.in_(active_uids)).all():
            user.disabled = False
        DBSession.flush()


def test_user_limit(ngw_env, ngw_webtest_app, ngw_auth_administrator, disable_users):
    admins = Group.filter_by(keyname="administrators").one()

    vasya = dict(
        keyname="test-vasya",
        display_name="Test Vasya",
        password="12345",
        disabled=False,
        member_of=[admins.id],
    )

    with ngw_env.auth.options.override(dict(user_limit=2)):
        res = ngw_webtest_app.post_json(user_url(), vasya, status=201)
        vasya_id = res.json["id"]

        petya = dict(
            keyname="test-petya",
            display_name="Test Petya",
            password="67890",
            disabled=False,
        )
        ngw_webtest_app.post_json(user_url(), petya, status=422)

        vasya["disabled"] = True
        ngw_webtest_app.put_json(user_url(vasya_id), vasya, status=200)

        res = ngw_webtest_app.post_json(user_url(), petya, status=201)
        petya_id = res.json["id"]

        masha = dict(
            keyname="test-masha",
            display_name="Test Masha",
            password="password",
            disabled=False,
        )
        ngw_webtest_app.post_json(user_url(), masha, status=422)

        ngw_webtest_app.delete(user_url(vasya_id), status=200)
        ngw_webtest_app.delete(user_url(petya_id), status=200)


def test_user_over_limit(ngw_env, ngw_webtest_app, ngw_auth_administrator, disable_users):
    user1 = dict(keyname="test-user1", display_name="Test user1", password="12345", disabled=False)
    res = ngw_webtest_app.post_json(user_url(), user1)
    user1_id = res.json["id"]
    user2 = dict(keyname="test-user2", display_name="Test user2", password="12345", disabled=False)
    res = ngw_webtest_app.post_json(user_url(), user2)
    user2_id = res.json["id"]

    with ngw_env.auth.options.override(dict(user_limit=2)):
        ngw_webtest_app.put_json(
            user_url(user1_id),
            dict(display_name="Test user1 name"),
            status=200,
        )

        ngw_webtest_app.put_json(
            user_url(user1_id),
            dict(disabled=True),
            status=200,
        )

        ngw_webtest_app.put_json(
            user_url(user1_id),
            dict(disabled=False),
            status=422,
        )

    with ngw_env.auth.options.override(dict(user_limit=3)):
        ngw_webtest_app.put_json(
            user_url(user1_id) + str(),
            dict(disabled=False),
            status=200,
        )

    ngw_webtest_app.delete(user_url(user1_id), status=200)
    ngw_webtest_app.delete(user_url(user2_id), status=200)


def test_unique(ngw_webtest_app, ngw_auth_administrator):
    petya = dict(keyname="test-petya", display_name="Test Petya", password="qwerty")
    res = ngw_webtest_app.post_json(user_url(), petya, status=201)
    petya["id"] = res.json["id"]

    vasya = dict(keyname="TEST-petya", display_name="test petya", password="qwerty")
    ngw_webtest_app.post_json(user_url(), vasya, status=422)
    vasya["display_name"] = "Test Vasya"
    ngw_webtest_app.post_json(user_url(), vasya, status=422)
    vasya["keyname"] = "test-vasya"
    res = ngw_webtest_app.post_json(user_url(), vasya, status=201)
    vasya["id"] = res.json["id"]

    drones = dict(keyname="drones-club", display_name="Drones Club")
    res = ngw_webtest_app.post_json(group_url(), drones, status=201)
    drones["id"] = res.json["id"]
    petya_grp = dict(keyname="Drones-Club", display_name="Drones club")
    ngw_webtest_app.post_json(group_url(), petya_grp, status=422)
    petya_grp["display_name"] = "Test Petya"
    res = ngw_webtest_app.post_json(group_url(), petya_grp, status=422)
    petya_grp["keyname"] = "test-petya-group"
    res = ngw_webtest_app.post_json(group_url(), petya_grp, status=201)
    petya_grp["id"] = res.json["id"]

    ngw_webtest_app.delete(user_url(petya["id"]))
    ngw_webtest_app.delete(user_url(vasya["id"]))
    ngw_webtest_app.delete(group_url(drones["id"]))
    ngw_webtest_app.delete(group_url(petya_grp["id"]))


class TestKeyname:
    @pytest.mark.parametrize(
        "keyname, ok",
        (
            pytest.param("simple", True, id="simple"),
            pytest.param("snake-case", True, id="snake"),
            pytest.param("kebab_case", True, id="kebab"),
            pytest.param("Keyname1", True, id="wdigit"),
            pytest.param("1Keyname", False, id="fdigit"),
            pytest.param("user@localhost", False, id="email"),
            pytest.param("Юникод", False, id="unicode"),
            pytest.param("ASCII_Юникод", False, id="mixed"),
        ),
    )
    def test_keyname(self, keyname, ok, user, group, ngw_webtest_app, ngw_auth_administrator):
        data = dict(keyname=keyname)
        status = 200 if ok else 422
        ngw_webtest_app.put_json(user_url(user.id), data, status=status)
        ngw_webtest_app.put_json(group_url(group.id), data, status=status)


@pytest.fixture(scope="class")
def group_members():
    with transaction.manager:
        admins = Group.filter_by(keyname="administrators").one()
        remember = [u.id for u in admins.members]
        admins.members = [u for u in admins.members if u.keyname != "guest"]

    yield

    with transaction.manager:
        admins = Group.filter_by(keyname="administrators").one()
        admins.members = [u for u in User.filter(User.id.in_(remember))]


class TestSystemPrincipal:
    def system_user_params():
        for k in ("guest", "authenticated", "everyone", "owner"):
            for t, data, ok in (
                ("empty", dict(), True),
                ("equal", dict(keyname=k), True),
                ("edit", dict(display_name=k.upper()), False),
                ("member_of", dict(member_of=["administrators"]), k == "guest"),
            ):
                yield pytest.param(k, data, ok, id=f"{k}-{t}")

    @pytest.mark.parametrize("keyname, data, ok", system_user_params())
    def test_system_user(
        self,
        keyname,
        data,
        ok,
        group_members,
        ngw_webtest_app,
        ngw_auth_administrator,
    ):
        user = User.by_keyname(keyname)
        if "member_of" in data:
            data["member_of"] = [g.id for g in Group.filter(Group.keyname.in_(data["member_of"]))]
        ngw_webtest_app.put_json(user_url(user.id), data, status=200 if ok else 422)

    def system_group_params():
        p = pytest.param
        yield p(dict(), None, True, id="empty")
        yield p(dict(keyname="administrators"), None, True, id="equal")
        yield p(dict(display_name="ADMINS!"), None, False, id="edit")
        for k in ("guest", "authenticated", "everyone", "owner"):
            yield p(dict(), k, k == "guest", id=f"members-{k}")

    @pytest.mark.parametrize("data, member_add, ok", system_group_params())
    def test_system_group(
        self,
        data,
        member_add,
        ok,
        ngw_webtest_app,
        ngw_auth_administrator,
    ):
        group = Group.filter_by(keyname="administrators").one()
        if member_add is not None:
            data["members"] = [u.id for u in group.members]
            member = User.by_keyname(member_add)
            data["members"].append(member.id)
        ngw_webtest_app.put_json(group_url(group.id), data, status=200 if ok else 422)


@pytest.mark.parametrize(
    "password_before, password",
    product(
        ("old-T3ST", None),
        ("new-secret-test-password", True, False),
    ),
)
def test_password(password_before, password, user, ngw_webtest_app, ngw_auth_administrator):
    with transaction.manager:
        User.filter_by(id=user.id).one().password = password_before

    ok = not (password is True and password_before is None)

    ngw_webtest_app.put_json(
        user_url(user.id),
        dict(password=password),
        status=200 if ok else 422,
    )
    if not ok:
        return

    password_after = User.filter_by(id=user.id).one().password

    if password is None or password is True:
        assert password_after == password_before
    elif password is False:
        assert password_after is None
    elif isinstance(password, str):
        assert password_after == password
    else:
        raise NotImplementedError()

    resp = ngw_webtest_app.get(user_url(user.id), status=200)
    assert resp.json["password"] is (password_after is not None)
