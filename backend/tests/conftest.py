# SPDX-License-Identifier: AGPL-3.0-or-later

from starlette.testclient import TestClient as _StarletteTestClient

_orig_testclient_init = _StarletteTestClient.__init__


def _patched_testclient_init(self, *args, **kwargs):
    if kwargs.get("headers") is None and "headers" not in kwargs:
        kwargs["headers"] = {"X-Requested-With": "GenSuite"}
    _orig_testclient_init(self, *args, **kwargs)


_StarletteTestClient.__init__ = _patched_testclient_init
