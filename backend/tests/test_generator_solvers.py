# SPDX-License-Identifier: AGPL-3.0-or-later

import pytest
import math

from models.geometrie import TriangleConstructionConfig, QuadrilateralConstructionConfig
from generators.geometrie import solve_triangle, solve_quadrilateral
from models.optik import OptikConfig, OptikObject, LensConfig
from generators.optik import calculate_images
from models.statistik import DatasetConfig, DataMode, StatistikConfig, StatistikType, AxisConfig, HistogramOptions
from generators.statistik import (
    calculate_params,
    parse_frequency_data,
    generate_histogram_tikz,
    _MAX_FREQ_COUNT_PER_ENTRY,
    _MAX_EXPANDED_DATA_LEN,
    _MAX_HISTOGRAM_BINS,
)
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


def test_solve_triangle_sss_near_degenerate_clamping():
    # Near-degenerate triangle that can trigger float rounding slightly outside [-1, 1]
    cfg = TriangleConstructionConfig(mode="SSS", a=1e-8, b=1.0, c=1.0)
    res, err = solve_triangle(cfg)
    assert err is None
    assert res is not None


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


def test_optik_multi_lens_object_at_focal_point_collimator_converging():
    """Objekt im Brennpunkt der 1. Linse -> Bild im Unendlichen -> 2. Sammellinse fokussiert in Brennebene."""
    cfg = OptikConfig(
        telescope_mode=False,
        lenses=[
            LensConfig(x=0.0, f=3.0, h=5.0),
            LensConfig(x=5.0, f=4.0, h=5.0),
        ],
        objects=[OptikObject(x=-3.0, G=2.0, label="G")]
    )
    images = calculate_images(cfg)
    assert len(images) == 2

    # Bild 1: Im Unendlichen
    img1 = images[0]
    assert math.isclose(img1["g"], 3.0, abs_tol=1e-4)
    assert not math.isfinite(img1["b"])
    assert not math.isfinite(img1["x"])
    assert not math.isfinite(img1["y"])

    # Bild 2: In Brennebene von Linse 2 (x = 5 + 4 = 9.0), y = -(G / f1) * f2 = -2/3 * 4 = -8/3
    img2 = images[1]
    assert math.isclose(img2["b"], 4.0, abs_tol=1e-4)
    assert math.isclose(img2["x"], 9.0, abs_tol=1e-4)
    assert math.isclose(img2["y"], -8.0 / 3.0, abs_tol=1e-4)
    assert img2["virtual"] is False
    assert math.isfinite(img2["x"])
    assert math.isfinite(img2["y"])


def test_optik_multi_lens_object_at_focal_point_collimator_diverging():
    """Objekt im Brennpunkt der 1. Linse -> Bild im Unendlichen -> 2. Zerstreuungslinse fokussiert virtuell."""
    cfg = OptikConfig(
        telescope_mode=False,
        lenses=[
            LensConfig(x=0.0, f=3.0, h=5.0),
            LensConfig(x=5.0, f=-4.0, h=5.0),
        ],
        objects=[OptikObject(x=-3.0, G=2.0, label="G")]
    )
    images = calculate_images(cfg)
    assert len(images) == 2

    img1 = images[0]
    assert not math.isfinite(img1["x"])

    img2 = images[1]
    assert math.isclose(img2["b"], -4.0, abs_tol=1e-4)
    assert math.isclose(img2["x"], 1.0, abs_tol=1e-4)
    assert math.isclose(img2["y"], 8.0 / 3.0, abs_tol=1e-4)
    assert img2["virtual"] is True
    assert math.isfinite(img2["x"])
    assert math.isfinite(img2["y"])


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


def test_statistik_horizontal_boxplot_auto_range():
    from models.statistik import StatistikConfig, StatistikType, BoxplotOptions, Orientation, AxisConfig
    from generators.statistik import generate_boxplot_tikz

    cfg = StatistikConfig(
        type=StatistikType.BOXPLOT,
        datasets=[DatasetConfig(name="Test", data_mode=DataMode.RAW, raw_data=[10.0, 20.0, 30.0, 40.0, 50.0])],
        x_axis=AxisConfig(min=None, max=None),
        boxplot_opts=BoxplotOptions(orientation=Orientation.HORIZONTAL),
    )
    tikz = generate_boxplot_tikz(cfg)
    assert "xmin=4, xmax=56" in tikz


def test_statistik_parse_frequency_data_oom_protection():
    # 1. Single extreme frequency is capped to _MAX_FREQ_COUNT_PER_ENTRY
    res_single = parse_frequency_data("1: 100000000")
    assert len(res_single) == _MAX_FREQ_COUNT_PER_ENTRY
    assert all(v == 1.0 for v in res_single)

    # 2. Cumulative frequency capped to _MAX_EXPANDED_DATA_LEN
    # 6 entries with 10_000 each -> should be clamped to 50_000
    res_multi = parse_frequency_data("1: 10000; 2: 10000; 3: 10000; 4: 10000; 5: 10000; 6: 10000")
    assert len(res_multi) == _MAX_EXPANDED_DATA_LEN

    # 3. Handling invalid tokens, overflows and negative numbers safely
    res_edge = parse_frequency_data("1: -5; 2: 0; 3: inf; 4: abc; 5: 3")
    assert res_edge == [5.0, 5.0, 5.0]

    # 4. Empty string returns empty list
    assert parse_frequency_data("") == []


def test_statistik_histogram_bin_edge_cases():
    # 1. Inverted boundaries (xmin > xmax) are swapped and do not throw ValueError
    cfg_inverted = StatistikConfig(
        type=StatistikType.HISTOGRAMM,
        datasets=[DatasetConfig(name="D1", data_mode=DataMode.RAW, raw_data=[3.0, 4.0, 5.0])],
        x_axis=AxisConfig(min=10.0, max=2.0),
        histogram_opts=HistogramOptions(bin_width=1.0)
    )
    tikz_inv = generate_histogram_tikz(cfg_inverted)
    assert "xmin=2.0, xmax=10.0" in tikz_inv
    assert r"\begin{axis}" in tikz_inv

    # 2. Equal boundaries (xmin == xmax) are expanded by max(bin_width, 1.0)
    cfg_equal = StatistikConfig(
        type=StatistikType.HISTOGRAMM,
        datasets=[DatasetConfig(name="D1", data_mode=DataMode.RAW, raw_data=[5.0])],
        x_axis=AxisConfig(min=5.0, max=5.0),
        histogram_opts=HistogramOptions(bin_width=2.0)
    )
    tikz_eq = generate_histogram_tikz(cfg_equal)
    assert "xmin=5.0, xmax=7.0" in tikz_eq

    # 3. Non-positive bin_width (<= 0) is normalized to 1.0
    cfg_zero_bw = StatistikConfig(
        type=StatistikType.HISTOGRAMM,
        datasets=[DatasetConfig(name="D1", data_mode=DataMode.RAW, raw_data=[1.0, 2.0, 3.0])],
        x_axis=AxisConfig(min=0.0, max=5.0),
        histogram_opts=HistogramOptions(bin_width=0.0)
    )
    tikz_zero_bw = generate_histogram_tikz(cfg_zero_bw)
    assert r"\begin{axis}" in tikz_zero_bw

    # 4. Excessively small bin_width is clamped to avoid bin explosion (_MAX_HISTOGRAM_BINS)
    cfg_tiny_bw = StatistikConfig(
        type=StatistikType.HISTOGRAMM,
        datasets=[DatasetConfig(name="D1", data_mode=DataMode.RAW, raw_data=[10.0, 50.0])],
        x_axis=AxisConfig(min=0.0, max=1000.0),
        histogram_opts=HistogramOptions(bin_width=1e-5)
    )
    tikz_tiny = generate_histogram_tikz(cfg_tiny_bw)
    assert r"\begin{axis}" in tikz_tiny

    # 5. Empty dataset renders empty axis without errors
    cfg_empty = StatistikConfig(
        type=StatistikType.HISTOGRAMM,
        datasets=[],
        x_axis=AxisConfig(min=0.0, max=10.0),
        histogram_opts=HistogramOptions(bin_width=1.0)
    )
    tikz_empty = generate_histogram_tikz(cfg_empty)
    assert r"\begin{axis}" in tikz_empty


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


def test_sitzplan_dislikes_symmetric():
    # Felix dislikes Tom (one-way in config), but solver and report must treat it symmetrically
    req = SitzplanRequest(
        students=[
            StudentConfig(name="Felix", dislikes_neighbors=["Tom"]),
            StudentConfig(name="Tom", dislikes_neighbors=[]),
            StudentConfig(name="Anna", dislikes_neighbors=[]),
        ],
        layout=LayoutConfig(rows=1, cols=3, front_rows=1),
        dislike_distance=1,
        hard_rules=HardRuleConfig()
    )
    res = solve_sitzplan(req)
    assert res is not None
    assert len(res.assignment) == 3
    pos_felix = res.assignment["Felix"]
    pos_tom = res.assignment["Tom"]
    # In 1x3 row, distance must be > 1 (so distance >= 2)
    assert abs(pos_felix - pos_tom) > 1
    # Check report: neither violates dislike
    assert res.per_student_report["Felix"]["violates_dislike"] is False
    assert res.per_student_report["Tom"]["violates_dislike"] is False


def test_sitzplan_solve_greedy_deterministic():
    from generators.sitzplan import solve_greedy
    import numpy as np

    req = SitzplanRequest(
        students=[
            StudentConfig(name="Alice", wants_neighbors=["Bob", "Charlie"], wants_front=True),
            StudentConfig(name="Bob", wants_neighbors=["Alice"]),
            StudentConfig(name="Charlie", wants_neighbors=["Alice"], dislikes_neighbors=["David"]),
            StudentConfig(name="David", dislikes_neighbors=["Charlie"]),
            StudentConfig(name="Eve", wants_front=True),
            StudentConfig(name="Frank"),
        ],
        layout=LayoutConfig(rows=3, cols=3, front_rows=1),
        hard_rules=HardRuleConfig(no_alone=True),
    )

    assignment1 = solve_greedy(req)
    assignment2 = solve_greedy(req)

    assert assignment1 == assignment2
    assert len(assignment1) == 6
    for name, seat in assignment1.items():
        assert isinstance(seat, (int, np.integer))
        assert 0 <= int(seat) < 9


def test_flaschenzug_tangent_clamping():
    from generators.flaschenzug import tangent_point_external, tangent_line_two_circles
    # If point is barely at boundary or float exceeds slightly
    tx, ty, deg = tangent_point_external(0.0, 0.0, 1.0, 0.0, 1.0000000000000002)
    assert all(isinstance(v, (int, float)) and math.isfinite(v) for v in (tx, ty, deg))

    # Exact boundary d == r (r / d == 1.0)
    tx_eq, ty_eq, deg_eq = tangent_point_external(0.0, 0.0, 1.0, 0.0, 1.0)
    assert all(math.isfinite(v) for v in (tx_eq, ty_eq, deg_eq))

    # Two circles touching or overlapping where dr/d or rs/d is approx 1 (outer and inner tangents)
    t1x, t1y, t2x, t2y, a1, a2 = tangent_line_two_circles(0.0, 0.0, 1.0, 2.0, 0.0, 1.0, side1="cw", side2="cw")
    assert all(isinstance(v, (int, float)) and math.isfinite(v) for v in (t1x, t1y, t2x, t2y, a1, a2))

    t1x_in, t1y_in, t2x_in, t2y_in, a1_in, a2_in = tangent_line_two_circles(
        0.0, 0.0, 1.0, 2.0, 0.0, 1.0000000000000002, side1="cw", side2="ccw"
    )
    assert all(isinstance(v, (int, float)) and math.isfinite(v) for v in (t1x_in, t1y_in, t2x_in, t2y_in, a1_in, a2_in))


def test_latex_image_config_default_raw_string():
    from models.latex_image import LatexImageConfig
    cfg = LatexImageConfig()
    assert cfg.code.startswith(r"\textbf")
    assert not cfg.code.startswith("\t")


def test_baumdiagramm_node_limit_guard():
    from models.baumdiagramm import BaumdiagrammConfig
    from generators.baumdiagramm import generate_baumdiagramm_latex
    import pytest

    cfg = BaumdiagrammConfig(max_depth=6, branches_global=4)
    with pytest.raises(ValueError, match="512"):
        generate_baumdiagramm_latex(cfg)


def test_math_utils_helpers():
    from core.math_utils import (
        hex_to_rgb01,
        hex_to_rgb_csv,
        tikz_color_def,
        fmt_float,
        normalize_hex6,
        tikz_color_opt,
    )

    assert hex_to_rgb01("#000000") == (0.0, 0.0, 0.0)
    assert hex_to_rgb01("#fff") == (1.0, 1.0, 1.0)
    assert hex_to_rgb01("invalid", fallback=(0.5, 0.5, 0.5)) == (0.5, 0.5, 0.5)
    assert hex_to_rgb_csv("#ff0000", precision=3) == "1.000,0.000,0.000"
    assert hex_to_rgb_csv("#abc") == "0,0,0"
    assert tikz_color_def("TestCol", "#00ff00") == r"\definecolor{TestCol}{rgb}{0.0000,1.0000,0.0000}"
    assert tikz_color_def("ShortCol", "#f0a") == r"\definecolor{ShortCol}{rgb}{1.0000,0.0000,0.6667}"
    assert normalize_hex6("#abc") == "AABBCC"
    assert normalize_hex6("f1c40f") == "F1C40F"
    assert normalize_hex6("red") is None
    assert tikz_color_opt("#ef4444") == "hexcol=EF4444"
    assert tikz_color_opt("#f00") == "hexcol=FF0000"
    assert tikz_color_opt("red", prefix_named="color=") == "color=red"
    assert tikz_color_opt("red") == "red"
    assert fmt_float(3.1400, 4) == "3.14"
    assert fmt_float(-0.0000001, 4) == "0"


def test_geometry3d_helpers():
    import numpy as np
    from core.geometry3d import (
        get_camera_dir,
        is_behind_plane,
        calculate_plane_polygon,
        intersect_line_with_bbox,
        calculate_line_line_intersection,
        calculate_line_plane_intersection,
        calculate_plane_plane_intersection,
    )
    from models.koordinatensystem3d import Line3DConfig, Plane3DConfig

    cam = get_camera_dir(90.0, 0.0)
    assert np.allclose(cam, [1.0, 0.0, 0.0], atol=1e-6)
    assert is_behind_plane(np.array([-1.0, 0.0, 0.0]), np.array([1.0, 0.0, 0.0]), 0.0, cam) is True

    poly, centroid = calculate_plane_polygon(0.0, 0.0, 1.0, 2.0, 0.0, 5.0, 0.0, 5.0, 0.0, 5.0)
    assert len(poly) == 4
    assert centroid == (2.5, 2.5, 2.0)

    clipped = intersect_line_with_bbox(0.0, 2.5, 2.5, 1.0, 0.0, 0.0, 0.0, 5.0, 0.0, 5.0, 0.0, 5.0)
    assert clipped is not None
    assert np.allclose(clipped[0], [0.0, 2.5, 2.5])
    assert np.allclose(clipped[1], [5.0, 2.5, 2.5])

    g1 = Line3DConfig(x0=0.0, y0=0.0, z0=0.0, rx=1.0, ry=1.0, rz=0.0)
    g2 = Line3DConfig(x0=0.0, y0=2.0, z0=0.0, rx=1.0, ry=-1.0, rz=0.0)
    pt_ll = calculate_line_line_intersection(g1, g2)
    assert pt_ll is not None and np.allclose(pt_ll, [1.0, 1.0, 0.0])

    e1 = Plane3DConfig(mode="Koordinatenform", n1=0.0, n2=0.0, n3=1.0, d=3.0)
    g3 = Line3DConfig(x0=1.0, y0=2.0, z0=0.0, rx=0.0, ry=0.0, rz=1.0)
    pt_lp = calculate_line_plane_intersection(g3, e1)
    assert pt_lp is not None and np.allclose(pt_lp, [1.0, 2.0, 3.0])

    e2 = Plane3DConfig(mode="Koordinatenform", n1=0.0, n2=1.0, n3=0.0, d=2.0)
    res_pp = calculate_plane_plane_intersection(e1, e2)
    assert res_pp is not None


def test_strahlenoptik_bezier_collinear_and_zero_direction():
    from generators.strahlenoptik import ray_cubic_bezier_intersection

    # Kollineare Kontrollpunkte entlang der x-Achse, Strahl ebenfalls entlang x-Achse -> None
    assert ray_cubic_bezier_intersection((0.0, 0.0), (1.0, 0.0), (1.0, 0.0), (2.0, 0.0), (3.0, 0.0), (4.0, 0.0)) is None
    # Null-Richtungsvektor -> None (kein ZeroDivisionError)
    assert ray_cubic_bezier_intersection((0.0, 0.0), (0.0, 0.0), (1.0, -1.0), (1.0, 0.0), (1.0, 0.0), (1.0, 1.0)) is None

    # Normaler Schnittpunkt: Strahl von (0, 0) nach (1, 0), vertikale Linie als Bezier bei x=2
    hit = ray_cubic_bezier_intersection((0.0, 0.0), (1.0, 0.0), (2.0, -1.0), (2.0, -0.33), (2.0, 0.33), (2.0, 1.0))
    assert hit is not None
    s, ix, iy, nx, ny = hit
    assert math.isclose(s, 2.0, abs_tol=1e-4)
    assert math.isclose(ix, 2.0, abs_tol=1e-4)
    assert math.isclose(iy, 0.0, abs_tol=1e-4)


def test_geometrie_kite_ccw_and_angle_hex_colors():
    from models.geometrie import GeometrieConfig, QuadrilateralConstructionConfig
    from generators.geometrie import solve_quadrilateral, generate_geometrie_latex

    res, err = solve_quadrilateral(QuadrilateralConstructionConfig(mode="Kite", a=4.0, b=5.0, alpha=70.0))
    assert err is None
    assert res is not None
    # B liegt unten (-y), D liegt oben (+y) -> CCW-Reihenfolge A -> B -> C -> D
    assert res["coords"]["B"][1] < 0.0
    assert res["coords"]["D"][1] > 0.0

    cfg = GeometrieConfig(
        shape="Quadrilateral",
        quad_construction=QuadrilateralConstructionConfig(mode="Kite", a=4.0, b=5.0, alpha=70.0),
    )
    cfg.elements.angles.colors.alpha = "#F1C40F"
    cfg.elements.angles.colors.beta = "#0af"
    cfg.elements.angles.colors.gamma = "red"
    tex = generate_geometrie_latex(cfg)
    assert "hexcol=F1C40F" in tex
    assert "hexcol=00AAFF" in tex
    assert "[draw, red," in tex
    assert "text opacity=1" in tex
    assert "#" not in tex.split(r"\begin{tikzpicture}")[1]


def test_koordinatensystem_between_validation_pattern_and_escaped_x():
    from models.koordinatensystem import CoordinateSystemConfig, PlotConfig, BetweenConfig, SlopeConfig
    from generators.koordinatensystem import generate_koordinatensystem_latex

    cfg = CoordinateSystemConfig(
        xmin=-3.0,
        xmax=3.0,
        ymin=-2.0,
        ymax=6.0,
        plots=[
            PlotConfig(
                show=True,
                func=r"\x^2 + x",
                slopes=[SlopeConfig(show=True, x0=0.0, dx=1.0)],
                betweens=[
                    # Gültige Zielkurve (Index 1) mit Pattern
                    BetweenConfig(show=True, other_index=1, pattern="north east lines"),
                    # Ausgeblendete Zielkurve (Index 2) -> muss übersprungen werden
                    BetweenConfig(show=True, other_index=2),
                    # Ungültige Indizes -> müssen übersprungen werden
                    BetweenConfig(show=True, other_index=-1),
                    BetweenConfig(show=True, other_index=99),
                ],
            ),
            PlotConfig(show=True, func="x + 1"),
            PlotConfig(show=False, func="2*x"),
        ],
    )

    latex = generate_koordinatensystem_latex(cfg)

    # P4A-09: Bereits vorhandenes \x darf nicht zu \\x verdoppelt werden
    assert r"func_0(\x)=\x^2 + \x;" in latex
    assert r"\\x" not in latex

    # P4A-08: Pattern wird übernommen und ungültige/ausgeblendete Zielkurven nicht referenziert
    assert "pattern=north east lines" in latex
    assert "fill between[of=curve0 and curve1" in latex
    assert "curve2" not in latex
    assert "curve-1" not in latex
    assert "curve99" not in latex


