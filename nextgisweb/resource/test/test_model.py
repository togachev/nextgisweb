import json

import pytest
from sqlalchemy.exc import IntegrityError

from nextgisweb.env import DBSession
from nextgisweb.lib.json import dumps

from nextgisweb.auth import User

from .. import Resource, ResourceGroup
from ..serialize import CompositeSerializer


def test_root_serialize(ngw_txn):
    resource = Resource.filter_by(id=0).one()
    srlzr = CompositeSerializer(resource, resource.owner_user)
    srlzr.serialize()

    data = json.loads(dumps(srlzr.data))

    assert "resource" in data
    assert data["resource"]["cls"] == "resource_group"


def test_same_display_name(ngw_txn, ngw_resource_group):
    margs = dict(
        parent_id=ngw_resource_group,
        display_name="display name",
        owner_user=User.by_keyname("administrator"),
    )

    with pytest.raises(IntegrityError, match='"resource_parent_id_display_name_key"'):
        ResourceGroup(**margs).persist()
        ResourceGroup(**margs).persist()
        DBSession.flush()
