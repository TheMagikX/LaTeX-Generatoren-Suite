# SPDX-License-Identifier: AGPL-3.0-or-later

"""
3D-Vektorgeometrie, Ebenenschnitte, Bounding-Box-Clipping und Occlusion-Berechnungen.
"""

import math
from typing import List, Optional, Tuple
import numpy as np


def get_camera_dir(az_pgfplots: float, el: float) -> np.ndarray:
    """Berechnet den Kamera-Richtungsvektor in Weltkoordinaten."""
    # In pgfplots: az=0 schaut von -Y. az=90 schaut von +X.
    # Sphärisch: theta=0 ist +X, theta=90 ist +Y.
    # az=90 -> theta=0. az=0 -> theta=-90.
    # Also theta = az - 90.
    # Elevation: el=0 ist Äquator (XY-Ebene), el=90 ist Nordpol (+Z).
    theta = math.radians(az_pgfplots - 90)
    phi = math.radians(el)
    return np.array([
        math.cos(phi) * math.cos(theta),
        math.cos(phi) * math.sin(theta),
        math.sin(phi)
    ])


def is_behind_plane(point: np.ndarray, n: np.ndarray, d: float, cam_dir: np.ndarray) -> bool:
    """True wenn point auf der kamerafernen Seite von Ebene (n,d) liegt."""
    cam_side = np.dot(n, cam_dir)
    point_side = np.dot(n, point) - d
    # Wenn die Kamera auf der einen Seite ist und der Punkt auf der anderen (relativ zur Ebene),
    # dann ist der Punkt "hinter" der Ebene.
    return bool((cam_side * point_side) < -1e-9)


def is_point_in_polygon(point: np.ndarray, poly_verts: list[np.ndarray], n: np.ndarray) -> bool:
    """Prüft ob ein 3D-Punkt (der auf der Ebene liegt) innerhalb des Polygons ist."""
    if not poly_verts:
        return False
    # Projektion auf 2D durch Weglassen der kleinsten Normalenkomponente
    axis_idx = np.argmax(np.abs(n))
    uv_indices = [i for i in [0, 1, 2] if i != axis_idx]

    p_u, p_v = point[uv_indices[0]], point[uv_indices[1]]

    inside = False
    j = len(poly_verts) - 1
    for i in range(len(poly_verts)):
        vi = poly_verts[i]
        vj = poly_verts[j]
        if ((vi[uv_indices[1]] > p_v) != (vj[uv_indices[1]] > p_v)) and \
           (p_u < (vj[uv_indices[0]] - vi[uv_indices[0]]) * (p_v - vi[uv_indices[1]]) / (vj[uv_indices[1]] - vi[uv_indices[1]]) + vi[uv_indices[0]]):
            inside = not inside
        j = i
    return inside


def split_segment(A: np.ndarray, B: np.ndarray, occluders: list, cam_dir: np.ndarray) -> list[tuple[np.ndarray, np.ndarray, bool]]:
    """
    Zerlegt Segment A->B an allen Occluder-Ebenen/Shapes.
    occluders: Liste von dicts {'n': n, 'd': d, 'poly': list_of_verts_or_None}.
    Gibt Liste von (start, end, is_behind) zurück.
    """
    t_values = [0.0, 1.0]
    AB = B - A
    for occ in occluders:
        n, d = occ['n'], occ['d']
        poly = occ['poly']

        # 1. Ebenen-Schnitt: t wo der Vektor die Occluder-Ebene kreuzt
        denom = np.dot(n, AB)
        if abs(denom) > 1e-9:
            t = (d - np.dot(n, A)) / denom
            if 1e-9 < t < 1 - 1e-9:
                if poly is not None:
                    P_int = A + t * AB
                    if is_point_in_polygon(P_int, poly, n):
                        t_values.append(t)
                else:
                    t_values.append(t)

        # 2. Schatten-Ebenen-Schnitte: t wo der Vektor die Schattengrenze des Polygons kreuzt.
        # Für jede Kante des Polygons gibt es eine Schatten-Ebene, die die Kante enthält
        # und in cam_dir-Richtung verläuft. Schnitte mit diesen Ebenen liefern die
        # Stellen, an denen der Vektor in den Schatten des Polygons ein- oder austritt.
        if poly is not None:
            num_verts = len(poly)
            for ei in range(num_verts):
                edge_dir = poly[(ei + 1) % num_verts] - poly[ei]
                n_s = np.cross(edge_dir, cam_dir)
                n_s_len = np.linalg.norm(n_s)
                if n_s_len < 1e-9:
                    continue
                n_s = n_s / n_s_len
                d_s = float(np.dot(n_s, poly[ei]))
                denom_s = np.dot(n_s, AB)
                if abs(denom_s) < 1e-9:
                    continue
                t_s = (d_s - float(np.dot(n_s, A))) / denom_s
                if 1e-9 < t_s < 1 - 1e-9:
                    t_values.append(t_s)

    # Sortieren und Duplikate entfernen, Endpunkt 1.0 stets erhalten
    t_values = sorted(set(t_values))
    clean_t = [0.0]
    for t in t_values:
        if 1e-7 < t < 1.0 - 1e-7 and t - clean_t[-1] > 1e-7:
            clean_t.append(t)
    clean_t.append(1.0)

    segments = []
    for i in range(len(clean_t) - 1):
        t0, t1 = clean_t[i], clean_t[i + 1]
        seg_start = A + t0 * AB
        seg_end   = A + t1 * AB
        midpoint  = (seg_start + seg_end) / 2
        behind = False
        for occ in occluders:
            n, d = occ['n'], occ['d']
            cam_side = np.dot(n, cam_dir)
            point_side = np.dot(n, midpoint) - d

            if abs(cam_side) < 1e-9:
                continue

            # Liegen Kamera und Punkt auf verschiedenen Seiten der Ebene?
            if (cam_side * point_side) < -1e-7:
                if occ['poly'] is not None:
                    # Der Punkt auf der Ebene, der direkt auf der Sichtlinie liegt
                    # Ray: midpoint + s * cam_dir
                    s = - point_side / cam_side
                    # s muss positiv sein, damit die Ebene ZWISCHEN Kamera und Punkt liegt
                    P_int = midpoint + s * cam_dir
                    if is_point_in_polygon(P_int, occ['poly'], n):
                        behind = True
                        break
                else:
                    behind = True
                    break
        segments.append((seg_start, seg_end, behind))
    return segments


def get_shape_plane(shape, points) -> Optional[Tuple[np.ndarray, float, list[np.ndarray]]]:
    """Berechnet (n, d, verts) für ein Shape aus seinen Punkten."""
    verts = [np.array([points[idx].x, points[idx].y, points[idx].z])
             for idx in shape.point_indices if 0 <= idx < len(points)]
    if len(verts) < 3:
        return None
    p0 = verts[0]
    p1 = None
    for p in verts[1:]:
        if np.linalg.norm(p - p0) > 1e-7:
            p1 = p
            break
    if p1 is None:
        return None

    p2 = None
    for p in verts:
        n_cand = np.cross(p1 - p0, p - p0)
        if np.linalg.norm(n_cand) > 1e-7:
            p2 = p
            n = n_cand
            break
    if p2 is None:
        return None

    n_norm = n / np.linalg.norm(n)
    d = float(np.dot(n_norm, p0))
    return n_norm, d, verts


def calculate_plane_polygon(n1: float, n2: float, n3: float, d: float, xmin: float, xmax: float, ymin: float, ymax: float, zmin: float, zmax: float) -> Tuple[List[Tuple[float, float, float]], Optional[Tuple[float, float, float]]]:
    """
    Berechnet das Polygon (Liste von 3D-Punkten), das den Schnitt der Ebene
    n1*x + n2*y + n3*z = d  mit der Bounding Box darstellt.
    Gibt eine Liste von Tupeln [(x,y,z), ...] zurück, sortiert im Kreis.
    """
    corners = [
        (xmin, ymin, zmin), (xmax, ymin, zmin),
        (xmax, ymax, zmin), (xmin, ymax, zmin),
        (xmin, ymin, zmax), (xmax, ymin, zmax),
        (xmax, ymax, zmax), (xmin, ymax, zmax),
    ]
    edges = [
        (0, 1), (1, 2), (2, 3), (3, 0),  # Unten
        (4, 5), (5, 6), (6, 7), (7, 4),  # Oben
        (0, 4), (1, 5), (2, 6), (3, 7),  # Vertikale
    ]

    intersections = []
    TOL = 1e-9
    normal = np.array([n1, n2, n3], dtype=float)

    for i1, i2 in edges:
        p1 = np.array(corners[i1], dtype=float)
        p2 = np.array(corners[i2], dtype=float)
        vec = p2 - p1
        denom = np.dot(normal, vec)

        if abs(denom) > TOL:
            t = (d - np.dot(normal, p1)) / denom
            if -TOL <= t <= 1 + TOL:
                pt = p1 + t * vec
                # Duplikate an Ecken vermeiden
                if not any(np.linalg.norm(pt - ex) < 1e-4 for ex in intersections):
                    intersections.append(pt)

    if len(intersections) < 3:
        return [], None

    # Schwerpunkt und Sortierung via Projektion auf dominante Ebene
    center = np.mean(intersections, axis=0)
    axis_idx = np.argmax(np.abs([n1, n2, n3]))

    # Projektion-Achsenpaare: (u, v) je nach dominanter Normalenkomponente
    uv_pairs = {0: (1, 2), 1: (0, 2), 2: (0, 1)}
    u_idx, v_idx = uv_pairs[axis_idx]

    intersections.sort(key=lambda pt: math.atan2(
        (pt - center)[v_idx], (pt - center)[u_idx]
    ))

    poly = [(float(p[0]), float(p[1]), float(p[2])) for p in intersections]
    centroid = (float(center[0]), float(center[1]), float(center[2]))
    return poly, centroid


def intersect_line_with_bbox(x0, y0, z0, rx, ry, rz, xmin, xmax, ymin, ymax, zmin, zmax):
    """Clips a line to the bounding box."""
    t_min = -1e9
    t_max = 1e9

    origin = np.array([x0, y0, z0], dtype=float)
    direction = np.array([rx, ry, rz], dtype=float)

    bounds = [(xmin, xmax), (ymin, ymax), (zmin, zmax)]
    if any(lo > hi for lo, hi in bounds):
        return None

    for i in range(3):
        if abs(direction[i]) < 1e-9:
            if origin[i] < bounds[i][0] or origin[i] > bounds[i][1]:
                return None
        else:
            t1 = (bounds[i][0] - origin[i]) / direction[i]
            t2 = (bounds[i][1] - origin[i]) / direction[i]
            t_min = max(t_min, min(t1, t2))
            t_max = min(t_max, max(t1, t2))

    if t_min <= t_max:
        return origin + t_min * direction, origin + t_max * direction
    return None


def calculate_line_line_intersection(g1, g2):
    A = np.array([[g1.rx, -g2.rx], [g1.ry, -g2.ry], [g1.rz, -g2.rz]])
    b = np.array([g2.x0 - g1.x0, g2.y0 - g1.y0, g2.z0 - g1.z0])
    t_s, residuals, rank, s = np.linalg.lstsq(A, b, rcond=None)
    if residuals.size > 0 and residuals[0] > 1e-6:
        return None
    if rank < 2:
        return None
    return np.array([g1.x0, g1.y0, g1.z0]) + t_s[0] * np.array([g1.rx, g1.ry, g1.rz])


def get_plane_nd(e):
    if e.mode == "3 Punkte":
        p1 = np.array([e.x1, e.y1, e.z1])
        p2 = np.array([e.x2, e.y2, e.z2])
        p3 = np.array([e.x3, e.y3, e.z3])
        n = np.cross(p2 - p1, p3 - p1)
        d = np.dot(n, p1)
        return n, d
    return np.array([e.n1, e.n2, e.n3]), e.d


def calculate_line_plane_intersection(g, e):
    p0 = np.array([g.x0, g.y0, g.z0])
    r = np.array([g.rx, g.ry, g.rz])
    n, d = get_plane_nd(e)
    denom = np.dot(n, r)
    if abs(denom) < 1e-9:
        return None
    t = (d - np.dot(n, p0)) / denom
    return p0 + t * r


def calculate_plane_plane_intersection(e1, e2):
    n1, d1 = get_plane_nd(e1)
    n2, d2 = get_plane_nd(e2)
    r = np.cross(n1, n2)
    if np.linalg.norm(r) < 1e-9:
        return None
    A = np.array([n1, n2, r])
    b = np.array([d1, d2, 0])
    try:
        x0 = np.linalg.solve(A, b)
        return x0, r
    except (np.linalg.LinAlgError, ValueError):
        return None
