from contextlib import contextmanager

import pytest

pytestmark = pytest.mark.usefixtures("ngw_auth_administrator")

good_domains = ["http://example.com", "http://test.qqq"]
bad_domains = ["http://very.bad", "http://bad.domain"]


@pytest.fixture()
def override(ngw_core_settings_override):
    @contextmanager
    def wrapped(value=None):
        with ngw_core_settings_override(
            [
                ("pyramid", "cors_allow_origin", value),
            ]
        ):
            yield

    return wrapped


@pytest.mark.parametrize(
    "domain, ok",
    (
        ("http://domain.com", True),
        ("https://domain.com/", True),
        ("https://*", False),
        ("https://*.com", False),
        ("https://*.domain.com", True),
        ("https://*.sub.domain.com", True),
        ("https://*.sub.domain.com.", True),
        ("https://*.*.domain.com", False),
    ),
)
def test_validation(domain, ok, ngw_webtest_app, override):
    API_URL = "/api/component/pyramid/csettings"
    with override():
        body = dict(pyramid=dict(allow_origin=[domain]))
        ngw_webtest_app.put_json(API_URL, body, status=200 if ok else 422)


@pytest.mark.parametrize(
    "domain, resource_exists, expected_ok",
    (
        (good_domains[0], True, True),
        (good_domains[1], False, True),
        (bad_domains[0], False, False),
        (bad_domains[1], True, False),
    ),
)
def test_headers(domain, resource_exists, expected_ok, ngw_webtest_app, override):
    with override(good_domains):
        url = "/api/resource/%d" % (0 if resource_exists else 2**31)
        response = ngw_webtest_app.get(url, headers=dict(Origin=domain), status="*")

        exp_creds = "true" if expected_ok else None
        exp_origin = domain if expected_ok else None
        assert response.headers.get("Access-Control-Allow-Credentials") == exp_creds
        assert response.headers.get("Access-Control-Allow-Origin") == exp_origin


@pytest.mark.parametrize(
    "domain, resource_exists, expected_ok",
    (
        (good_domains[0], True, True),
        (good_domains[1], False, True),
        (bad_domains[0], False, False),
        (bad_domains[1], True, False),
    ),
)
def test_options(domain, resource_exists, expected_ok, ngw_webtest_app, override):
    with override(good_domains):
        url = "/api/resource/%d" % (0 if resource_exists else 2**31)
        response = ngw_webtest_app.options(
            url, headers={"Origin": domain, "Access-Control-Request-Method": "OPTIONS"}, status="*"
        )

        exp_creds = "true" if expected_ok else None
        exp_origin = domain if expected_ok else None
        exp_methods = "OPTIONS" if expected_ok else None
        assert response.headers.get("Access-Control-Allow-Credentials") == exp_creds
        assert response.headers.get("Access-Control-Allow-Origin") == exp_origin
        assert response.headers.get("Access-Control-Allow-Methods") == exp_methods


def test_wildcard(ngw_webtest_app, override):
    with override(["https://*.one.com", "https://*.sub.two.com"]):

        def test_domain(domain, ok):
            response = ngw_webtest_app.head(
                "/api/resource/0", headers=dict(Origin=domain), status="*"
            )
            exp_creds = "true" if ok else None
            exp_origin = domain if ok else None
            assert response.headers.get("Access-Control-Allow-Credentials") == exp_creds
            assert response.headers.get("Access-Control-Allow-Origin") == exp_origin

        test_domain("https://one.com", True)
        test_domain("http://one.com", False)
        test_domain("http://one.com:12345", False)
        test_domain("https://sub.one.com", True)
        test_domain("https://sub.sub.one.com", True)
        test_domain("https://two.com", False)
        test_domain("https://sub.two.com", True)
        test_domain("https://other.two.com", False)
        test_domain("https://sub.sub.two.com", True)
