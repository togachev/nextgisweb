from subprocess import check_call, check_output

import webtest

from ..model import FileUpload

TEST_FILENAME = "file.ext"
TEST_CONTENT = "content".encode("utf-8")

TEST_FILENAME2 = "file2.ext"
TEST_CONTENT2 = "content2".encode("utf-8")


def test_options(ngw_env, ngw_webtest_app):
    resp = ngw_webtest_app.options("/api/component/file_upload/")
    headers = resp.headers
    assert headers.get("Tus-Resumable") == "1.0.0"
    assert headers.get("Tus-Version") == "1.0.0"
    assert headers.get("Tus-Extension") == "creation,termination"
    assert headers.get("Tus-Max-Size") == str(ngw_env.file_upload.max_size)


def test_tus_method(ngw_webtest_app):
    create = ngw_webtest_app.post(
        "/api/component/file_upload/",
        headers={
            "Tus-Resumable": "1.0.0",
            "Upload-Length": str(len(TEST_CONTENT)),
            "Upload-Metadata": "name dGVzdA==",
        },
        status=201,
    )

    assert create.headers.get("Location").startswith("http://localhost/")
    assert create.headers.get("Tus-Resumable") == "1.0.0"

    location = create.headers["Location"]
    location = location[len("http://localhost") :]

    # Content type missing
    ngw_webtest_app.patch(
        location,
        TEST_CONTENT,
        headers={"Tus-Resumable": "1.0.0", "Upload-Offset": str(0)},
        status=415,
    )

    # Conflict
    ngw_webtest_app.patch(
        location,
        TEST_CONTENT[1:],
        headers={
            "Tus-Resumable": "1.0.0",
            "Content-Type": "application/offset+octet-stream",
            "Upload-Offset": str(1),
        },
        status=409,
    )

    patch = ngw_webtest_app.patch(
        location,
        TEST_CONTENT,
        headers={
            "Tus-Resumable": "1.0.0",
            "Content-Type": "application/offset+octet-stream",
            "Upload-Offset": str(0),
        },
        status=204,
    )

    assert patch.headers.get("Tus-Resumable") == "1.0.0"
    assert patch.headers.get("Upload-Offset") == str(len(TEST_CONTENT))

    head = ngw_webtest_app.head(
        location,
        headers={
            "Tus-Resumable": "1.0.0",
        },
    )

    assert head.status_code == 200
    assert head.headers.get("Upload-Offset") == str(len(TEST_CONTENT))
    assert head.headers.get("Upload-Length") == str(len(TEST_CONTENT))

    get = ngw_webtest_app.get(location, status=200)

    assert get.status_code == 200
    assert get.json["size"] == len(TEST_CONTENT)
    assert get.json["name"] == "test"

    ngw_webtest_app.delete(location, status=204)
    ngw_webtest_app.delete(location, status=404)


def test_tus_client(ngw_httptest_app, tmp_path):
    of = tmp_path / "sample"
    check_call(["dd", "if=/dev/zero", "of=" + str(of), "bs=1M", "count=16"])

    burl = ngw_httptest_app.base_url + "/api/component/file_upload/"
    furl = check_output(["tusc", "client", burl, str(of)], encoding="utf-8").strip()
    assert furl.startswith(burl)

    response = ngw_httptest_app.get(furl)
    response.raise_for_status()

    data = response.json()
    assert data["size"] == 16 * 1024 * 1024


def test_post_single(ngw_webtest_app):
    resp = ngw_webtest_app.post(
        "/api/component/file_upload/",
        dict(file=webtest.Upload(TEST_FILENAME, TEST_CONTENT)),
    )

    fupload = FileUpload(id=resp.json["upload_meta"][0]["id"])
    assert fupload.data_path.read_bytes() == TEST_CONTENT


def test_post_multi(ngw_webtest_app):
    resp = ngw_webtest_app.post(
        "/api/component/file_upload/",
        [
            ["files[]", webtest.Upload(TEST_FILENAME, TEST_CONTENT)],
            ["files[]", webtest.Upload(TEST_FILENAME2, TEST_CONTENT2)],
        ],
    )

    fupload = FileUpload(id=resp.json["upload_meta"][0]["id"])
    assert fupload.data_path.read_bytes() == TEST_CONTENT

    fupload = FileUpload(id=resp.json["upload_meta"][1]["id"])
    assert fupload.data_path.read_bytes() == TEST_CONTENT2


def test_put(ngw_webtest_app):
    resp = ngw_webtest_app.put("/api/component/file_upload/", TEST_CONTENT)
    fupload = FileUpload(id=resp.json["id"])
    assert fupload.data_path.read_bytes() == TEST_CONTENT
