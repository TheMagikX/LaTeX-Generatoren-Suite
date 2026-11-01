# SPDX-License-Identifier: AGPL-3.0-or-later

import pathlib
import shutil
import pytest
from starlette.testclient import TestClient as _StarletteTestClient

import config

_orig_testclient_init = _StarletteTestClient.__init__


def _patched_testclient_init(self, *args, **kwargs):
    if kwargs.get("headers") is None and "headers" not in kwargs:
        kwargs["headers"] = {"X-Requested-With": "GenSuite"}
    _orig_testclient_init(self, *args, **kwargs)


_StarletteTestClient.__init__ = _patched_testclient_init


@pytest.fixture(scope="session", autouse=True)
def _ensure_test_datasets():
    test_data_dir = pathlib.Path(__file__).parent / "test_data"
    if test_data_dir.is_dir():
        config.DATASETS_DIR.mkdir(parents=True, exist_ok=True)
        for f in test_data_dir.glob("*.csv"):
            dest = config.DATASETS_DIR / f.name
            if not dest.exists():
                shutil.copy2(f, dest)
