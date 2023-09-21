import pytest

from nextgisweb.env import Component, load_all
from nextgisweb.lib.config import Option


def pytest_generate_tests(metafunc):
    if "comp_option_annotations" in metafunc.fixturenames:
        load_all()
        metafunc.parametrize(
            "comp_option_annotations",
            [
                pytest.param(c, id=identity)
                for identity, c in Component.registry.items()
                if hasattr(c, "option_annotations")
            ],
        )


def test_annotations(comp_option_annotations):
    for oa in comp_option_annotations.option_annotations:
        assert isinstance(oa, Option)
