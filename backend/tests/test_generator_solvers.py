# SPDX-License-Identifier: AGPL-3.0-or-later

import pytest
import math

from models.geometrie import TriangleConstructionConfig, QuadrilateralConstructionConfig
from generators.geometrie import solve_triangle, solve_quadrilateral
from models.optik import OptikConfig, OptikObject, LensConfig
from generators.optik import calculate_images
from models.statistik import DatasetConfig, DataMode
from generators.statistik import calculate_params
from models.sitzplan import SitzplanRequest, StudentConfig, LayoutConfig, HardRuleConfig
from generators.sitzplan import solve_sitzplan


def test_solve_triangle_sss_valid():
    cfg = TriangleConstructionConfig(mode="SSS", a=3.0, b=4.0, c=5.0)
    res, err = solve_triangle(cfg)
    assert err is None
    assert res is not None
    # 3-4-5 is a right triangle
    assert math.isclose(res["angles"]["gamma"], 90.0, abs_tol=1e-2)
    # Area should be 0.5 * 3 * 4 = 6.0
    assert math.isclose(res["area"], 6.0, abs_tol=1e-2)
    # Perimeter = 12
    assert math.isclose(res["perimeter"], 12.0, abs_tol=1e-2)


def test_solve_triangle_sss_invalid_triangle_inequality():
    # 1 + 2 < 10, cannot form a triangle
    cfg = TriangleConstructionConfig(mode="SSS", a=1.0, b=2.0, c=10.0)
    res, err = solve_triangle(cfg)
    assert res is None
    assert err is not None
    assert "Dreiecksungleichung" in err or "Fehler" in err or "nicht" in err.lower()


def test_solve_triangle_sws():
    # Equilateral triangle with side 4, angle 60°
    cfg = TriangleConstructionConfig(mode="SWS", c=4.0, b=4.0, alpha=60.0)
    res, err = solve_triangle(cfg)
    assert err is None
    assert math.isclose(res["sides"]["a"], 4.0, abs_tol=1e-2)
    assert math.isclose(res["angles"]["beta"], 60.0, abs_tol=1e-2)
    assert math.isclose(res["angles"]["gamma"], 60.0, abs_tol=1e-2)


def test_solve_quadrilateral_parallelogram():
    cfg = QuadrilateralConstructionConfig(mode="Parallelogram", a=5.0, b=3.0, alpha=60.0)
    res, err = solve_quadrilateral(cfg)
    assert err is None
    assert res is not None
    assert math.isclose(res["sides"]["a"], 5.0, abs_tol=1e-2)
    assert math.isclose(res["sides"]["c"], 5.0, abs_tol=1e-2)
    assert math.isclose(res["sides"]["b"], 3.0, abs_tol=1e-2)
    assert math.isclose(res["sides"]["d"], 3.0, abs_tol=1e-2)
    # Angles: alpha=60, beta=120, gamma=60, delta=120
    assert math.isclose(res["angles"]["alpha"], 60.0, abs_tol=1e-2)
    assert math.isclose(res["angles"]["beta"], 120.0, abs_tol=1e-2)


def test_optik_lens_formula_real_image():
    # f = 2, g = 6 -> 1/b = 1/2 - 1/6 = 2/6 = 1/3 -> b = 3
    # G = 2 -> Image height y = -G * (b/g) = -2 * (3/6) = -1.0 (inverted)
    cfg = OptikConfig(
        telescope_mode=False,
        lenses=[LensConfig(x=0.0, f=2.0, h=5.0)],
        objects=[OptikObject(x=-6.0, G=2.0, label="G")]
    )
    images = calculate_images(cfg)
    assert len(images) == 1
    img = images[0]
    assert math.isclose(img["g"], 6.0, abs_tol=1e-2)
    assert math.isclose(img["b"], 3.0, abs_tol=1e-2)
    assert img["virtual"] is False
    assert math.isclose(img["y"], -1.0, abs_tol=1e-2)


def test_optik_lens_formula_virtual_image():
    # f = 4, g = 2 -> 1/b = 1/4 - 1/2 = -1/4 -> b = -4 (virtual)
    # Magnification m = b/g or |b|/g
    cfg = OptikConfig(
        telescope_mode=False,
        lenses=[LensConfig(x=0.0, f=4.0, h=5.0)],
        objects=[OptikObject(x=-2.0, G=1.0, label="G")]
    )
    images = calculate_images(cfg)
    assert len(images) == 1
    img = images[0]
    assert math.isclose(img["b"], -4.0, abs_tol=1e-2)
    assert img["virtual"] is True
    assert math.isclose(abs(img["m"]), 2.0, abs_tol=1e-2)


def test_statistik_calculate_params():
    data = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0]
    params = calculate_params(data)
    assert params is not None
    assert params.min == 1.0
    assert params.max == 9.0
    assert params.median == 5.0
    assert params.q1 == 3.0
    assert params.q3 == 7.0
    assert math.isclose(params.mean, 5.0, abs_tol=1e-2)


def test_sitzplan_solver_allocation():
    # In classroom layout, front rows are indexed at the bottom: range(rows - front_rows, rows)
    # For rows=2, cols=2, front_rows=1:
    # Row 0: seats 0, 1 (hinten)
    # Row 1: seats 2, 3 (vorne an der Tafel)
    req = SitzplanRequest(
        students=[
            StudentConfig(name="Lukas", wants_front=True),
            StudentConfig(name="Mia", wants_front=True),
            StudentConfig(name="Jonas", wants_front=False),
        ],
        layout=LayoutConfig(rows=2, cols=2, front_rows=1),
        hard_rules=HardRuleConfig()
    )
    res = solve_sitzplan(req)
    assert res is not None
    assert len(res.assignment) == 3
    # Lukas and Mia want front row (row 1), seats 2 or 3
    assert res.assignment["Lukas"] in [2, 3]
    assert res.assignment["Mia"] in [2, 3]
    # Jonas should be in row 0, seats 0 or 1
    assert res.assignment["Jonas"] in [0, 1]
