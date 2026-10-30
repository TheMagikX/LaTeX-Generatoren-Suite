# SPDX-License-Identifier: AGPL-3.0-or-later

"""
backend/generators/strahlenoptik.py
=====================================
2-D ray-optics generator: directed light rays, reflecting/non-reflecting
barriers (line-segment and circular arc shapes), refraction areas 
(Snell's law + TIR), and shadow-zone visualization.
"""

import math
from typing import List, Tuple, Optional, Dict, Any
import numpy as np

from core.latex_document import LatexDocumentSpec, font_input, render_latex_document
from models.strahlenoptik import StrahlenoptikConfig, LightSource, Barrier, RefractionArea, PathNode

EPS = 1e-9


# ---------------------------------------------------------------------------
# Geometry helpers
# ---------------------------------------------------------------------------

def _norm(vx: float, vy: float) -> Tuple[float, float]:
    """Normalize a 2-D vector; returns (0,0) if degenerate."""
    length = math.sqrt(vx * vx + vy * vy)
    if length < EPS:
        return (0.0, 0.0)
    return (vx / length, vy / length)


def _dot(v1: Tuple[float, float], v2: Tuple[float, float]) -> float:
    return v1[0] * v2[0] + v1[1] * v2[1]


def _normalize_angle(a: float) -> float:
    """Normalize angle to [0, 360)."""
    return a % 360.0


def _is_angle_in_sweep(a: float, start: float, sweep: float) -> bool:
    """Check if angle a is within a sweep starting at start."""
    a = _normalize_angle(a)
    s = _normalize_angle(start)
    if sweep >= 0:
        # CCW sweep
        if s + sweep <= 360:
            return s - EPS <= a <= s + sweep + EPS
        else:
            # Wraps around 360
            return a >= s - EPS or a <= (s + sweep) % 360 + EPS
    else:
        # CW sweep (sweep is negative)
        if s + sweep >= 0:
            return s + sweep - EPS <= a <= s + EPS
        else:
            # Wraps around 0
            return a <= s + EPS or a >= (s + sweep) % 360 - EPS


def _get_arc_params(P1: Tuple[float, float], P2: Tuple[float, float], bend: float) -> Optional[Dict[str, Any]]:
    """Convert points and bend angle to circular arc parameters."""
    # TikZ bend angle: central angle alpha = 2 * bend.
    # Radius r = (L/2) / sin(bend_radians).
    # sagitta h = (L/2) / tan(bend_radians).
    if abs(bend) < 0.1:
        return None
        
    x1, y1 = P1
    x2, y2 = P2
    L = math.sqrt((x2-x1)**2 + (y2-y1)**2)
    if L < EPS: return None
    
    safe_bend = max(-89.9, min(89.9, bend))
    theta = math.radians(safe_bend)
    
    r = abs((L/2) / math.sin(theta))
    h = (L/2) / math.tan(theta)
    
    vx, vy = (x2-x1)/L, (y2-y1)/L
    nx, ny = vy, -vx # Right-hand normal to chord
    
    # center
    cx = (x1+x2)/2 + h * nx
    cy = (y1+y2)/2 + h * ny
    
    start_ang = math.degrees(math.atan2(y1-cy, x1-cx))
    # If we put center on the right, bend > 0 is a CW sweep
    sweep_ang = -2 * safe_bend
    
    return {
        'C': (cx, cy),
        'r': r,
        'start': start_ang,
        'sweep': sweep_ang
    }


def ray_segment_intersection(
    O: Tuple[float, float],
    D: Tuple[float, float],
    A: Tuple[float, float],
    B: Tuple[float, float],
) -> Optional[Tuple[float, float, float, float, float]]:
    """
    Returns (t, ix, iy, nx, ny) if ray O+t*D intersects segment AB with t > 0
    and parameter s in [0,1]. (nx, ny) is the surface normal (to the left of AB).
    """
    ox, oy = O
    dx, dy = D
    ax, ay = A
    bx, by = B

    denom = dx * (by - ay) - dy * (bx - ax)
    if abs(denom) < EPS:
        return None  # parallel

    t = ((ax - ox) * (by - ay) - (ay - oy) * (bx - ax)) / denom
    s = ((ax - ox) * dy - (ay - oy) * dx) / denom

    if t > EPS and -EPS <= s <= 1.0 + EPS:
        # Normal perpendicular to segment AB (to the left)
        nx = -(by - ay)
        ny = (bx - ax)
        nx, ny = _norm(nx, ny)
        return (t, ox + t * dx, oy + t * dy, nx, ny)
    return None


def ray_circular_arc_intersection(
    O: Tuple[float, float],
    D: Tuple[float, float],
    C: Tuple[float, float],
    r: float,
    start_ang: float,
    sweep_ang: float,
    bend: float = 0.0,
) -> Optional[Tuple[float, float, float, float, float]]:
    """
    Returns (t, ix, iy, nx, ny) if ray O+t*D intersects circular arc.
    nx, ny is the outward normal (consistent with right-hand rule for path).
    """
    ox, oy = O
    dx, dy = D
    cx, cy = C
    
    # Solve t^2 + 2t(D.(O-C)) + (|O-C|^2 - r^2) = 0
    vx, vy = ox - cx, oy - cy
    b = 2 * (dx * vx + dy * vy)
    c = (vx * vx + vy * vy) - r * r
    
    disc = b * b - 4 * c
    if disc < 0:
        return None
    
    sqrt_disc = math.sqrt(disc)
    t1 = (-b - sqrt_disc) / 2.0
    t2 = (-b + sqrt_disc) / 2.0
    
    best_t = float('inf')
    best_hit = None
    
    for t in (t1, t2):
        if t > EPS:
            ix, iy = ox + t * dx, oy + t * dy
            angle = math.degrees(math.atan2(iy - cy, ix - cx))
            if _is_angle_in_sweep(angle, start_ang, sweep_ang):
                if t < best_t:
                    best_t = t
                    # Unit vector from center to hit point
                    nx, ny = _norm(ix - cx, iy - cy)
                    # if bend > 0, center is to the right, arc is to the left.
                    # Right-hand normal (outward) points TOWARDS center.
                    # if bend < 0, center is to the left, arc is to the right.
                    # Right-hand normal (outward) points AWAY from center.
                    if bend > 0:
                        nx, ny = -nx, -ny
                    best_hit = (t, ix, iy, nx, ny)
                    
    return best_hit


def ray_cubic_bezier_intersection(
    O: Tuple[float, float],
    D: Tuple[float, float],
    P0: Tuple[float, float],
    P1: Tuple[float, float],
    P2: Tuple[float, float],
    P3: Tuple[float, float],
) -> Optional[Tuple[float, float, float, float, float]]:
    """
    Returns (t_ray, ix, iy, nx, ny) if ray O + t_ray*D intersects cubic Bezier.
    """
    # Bezier points
    x0, y0 = P0
    x1, y1 = P1
    x2, y2 = P2
    x3, y3 = P3
    
    # Coefficients of x(t) and y(t)
    # x(t) = ax*t^3 + bx*t^2 + cx*t + dx
    ax_ = -x0 + 3*x1 - 3*x2 + x3
    bx_ = 3*x0 - 6*x1 + 3*x2
    cx_ = -3*x0 + 3*x1
    dx_ = x0
    
    ay_ = -y0 + 3*y1 - 3*y2 + y3
    by_ = 3*y0 - 6*y1 + 3*y2
    cy_ = -3*y0 + 3*y1
    dy_ = y0
    
    ox, oy = O
    rx, ry = D # Ray direction
    
    # (ry*ax - rx*ay)*t^3 + (ry*bx - rx*by)*t^2 + (ry*cx - rx*cy)*t + (ry*(dx - ox) - rx*(dy - oy)) = 0
    c3 = ry * ax_ - rx * ay_
    c2 = ry * bx_ - rx * by_
    c1 = ry * cx_ - rx * cy_
    c0 = ry * (dx_ - ox) - rx * (dy_ - oy)
    
    roots = np.roots([c3, c2, c1, c0])
    
    best_t_ray = float('inf')
    best_hit = None
    
    for rt in roots:
        if np.isreal(rt):
            t = rt.real
            if -EPS <= t <= 1.0 + EPS:
                t = max(0.0, min(1.0, t))
                ix = ax_*t**3 + bx_*t**2 + cx_*t + dx_
                iy = ay_*t**3 + by_*t**2 + cy_*t + dy_
                
                # Check if it's in the direction of the ray
                if abs(rx) > abs(ry):
                    s = (ix - ox) / rx
                else:
                    s = (iy - oy) / ry
                
                if s > EPS:
                    if s < best_t_ray:
                        best_t_ray = s
                        # Normal vector: right-hand normal (dyt, -dxt)
                        dxt = 3*ax_*t**2 + 2*bx_*t + cx_
                        dyt = 3*ay_*t**2 + 2*by_*t + cy_
                        nx, ny = _norm(dyt, -dxt)
                        best_hit = (s, ix, iy, nx, ny)
                        
    return best_hit


def reflect_direction(
    D: Tuple[float, float],
    N: Tuple[float, float],
) -> Tuple[float, float]:
    """
    Reflect direction D off surface with normal N.
    The normal is flipped to face the incoming ray.
    """
    nx, ny = _norm(N[0], N[1])
    dx, dy = D

    # Flip normal to face incoming ray
    if dx * nx + dy * ny > 0:
        nx, ny = -nx, -ny

    # R = D - 2*(D·N)*N
    dot = dx * nx + dy * ny
    return _norm(dx - 2 * dot * nx, dy - 2 * dot * ny)


def refract_direction(
    D: Tuple[float, float],
    N_outward: Tuple[float, float],
    n1: float,
    n2: float,
) -> Optional[Tuple[float, float]]:
    """
    Apply Snell's law.  Returns the refracted unit direction, or None on TIR.

    N_outward is the outward normal of the surface (pointing out of medium-2).
    We orient it so it opposes D (faces the incoming ray).
    """
    nx, ny = N_outward
    # Make normal oppose the incoming ray direction
    if D[0] * nx + D[1] * ny > 0:
        nx, ny = -nx, -ny

    cos_i = -(D[0] * nx + D[1] * ny)   # cosine of angle of incidence (>0)
    cos_i = max(-1.0, min(1.0, cos_i))
    
    sin2_t = (n1 / n2) ** 2 * (1.0 - cos_i ** 2)

    if sin2_t > 1.0:
        return None  # Total internal reflection

    cos_t = math.sqrt(max(0.0, 1.0 - sin2_t))
    rx = (n1 / n2) * D[0] + ((n1 / n2) * cos_i - cos_t) * nx
    ry = (n1 / n2) * D[1] + ((n1 / n2) * cos_i - cos_t) * ny
    return _norm(rx, ry)


def ray_canvas_exit(
    O: Tuple[float, float],
    D: Tuple[float, float],
    bounds: Tuple[float, float, float, float],
) -> Tuple[float, float]:
    """
    Return the first point where ray O+t*D exits the canvas boundary.
    bounds = (xmin, xmax, ymin, ymax)
    """
    xmin, xmax, ymin, ymax = bounds
    boundaries = [
        ((xmin, ymin), (xmax, ymin)),  # bottom
        ((xmax, ymin), (xmax, ymax)),  # right
        ((xmax, ymax), (xmin, ymax)),  # top
        ((xmin, ymax), (xmin, ymin)),  # left
    ]
    best_t = float('inf')
    best_pt = (O[0] + 50.0 * D[0], O[1] + 50.0 * D[1])
    for A, B in boundaries:
        result = ray_segment_intersection(O, D, A, B)
        if result and result[0] < best_t:
            best_t = result[0]
            best_pt = (result[1], result[2])
    return best_pt


# ---------------------------------------------------------------------------
# Ray tracing
# ---------------------------------------------------------------------------

def _get_path_orientation(nodes: List[PathNode], is_closed: bool) -> float:
    """Returns > 0 for CCW, < 0 for CW."""
    pts = _approximate_path(nodes, is_closed)
    if len(pts) < 3:
        return 1.0
    area = 0.0
    for i in range(len(pts)):
        p1 = pts[i]
        p2 = pts[(i + 1) % len(pts)]
        area += (p1[0] * p2[1] - p2[0] * p1[1])
    return area


def _path_to_segments(nodes: List[PathNode], is_closed: bool, metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Convert a path of nodes into oriented boundary segments."""
    if not nodes or len(nodes) < 2:
        return []
    
    # Detect orientation to ensure right-hand normal is outward
    orientation = _get_path_orientation(nodes, is_closed)
    # If CW, we need to flip the right-hand normal to make it outward
    normal_mult = 1.0 if orientation >= 0 else -1.0
    
    segs = []
    n_nodes = len(nodes)
    count = n_nodes if is_closed else n_nodes - 1
    
    for i in range(count):
        node1 = nodes[i]
        node2 = nodes[(i + 1) % n_nodes]
        
        P1 = (node1.x, node1.y)
        P2 = (node2.x, node2.y)
        
        # Metadata for this segment
        seg_meta = {**metadata, 'normal_mult': normal_mult}
        
        if node1.connection == "line":
            dx, dy = P2[0] - P1[0], P2[1] - P1[1]
            if abs(dx) < EPS and abs(dy) < EPS:
                continue
            nx, ny = _norm(dy, -dx)
            segs.append({
                'type': 'line',
                'A': P1,
                'B': P2,
                'outward_normal': (nx, ny),
                **seg_meta
            })
        elif node1.connection == "arc":
            params = _get_arc_params(P1, P2, node1.bend)
            if params:
                segs.append({
                    'type': 'curve',
                    'curve_type': 'circular',
                    'C': params['C'],
                    'r': params['r'],
                    'start_ang': params['start'],
                    'sweep_ang': params['sweep'],
                    'bend': node1.bend,
                    **seg_meta
                })
            else:
                # Fallback to line
                dx, dy = P2[0] - P1[0], P2[1] - P1[1]
                nx, ny = _norm(dy, -dx)
                segs.append({
                    'type': 'line',
                    'A': P1, 'B': P2,
                    'outward_normal': (nx, ny),
                    **seg_meta
                })
        elif node1.connection == "bezier":
            L = math.sqrt((P2[0]-P1[0])**2 + (P2[1]-P1[1])**2)
            dist = L / 3.0
            a_out = math.radians(node1.out_angle)
            a_in = math.radians(node1.in_angle)
            
            C1 = (P1[0] + dist * math.cos(a_out), P1[1] + dist * math.sin(a_out))
            C2 = (P2[0] - dist * math.cos(a_in), P2[1] - dist * math.sin(a_in))
            
            segs.append({
                'type': 'curve',
                'curve_type': 'bezier',
                'P0': P1, 'P1': C1, 'P2': C2, 'P3': P2,
                **seg_meta
            })
            
    return segs


def _get_barrier_segments(cfg: StrahlenoptikConfig) -> List[Dict[str, Any]]:
    """Flatten all barrier nodes into boundary segments."""
    segs: List[Dict[str, Any]] = []
    for bi, barrier in enumerate(cfg.barriers):
        meta = {
            'reflecting': barrier.reflecting,
            'is_refracting': False,
            'barrier_idx': bi
        }
        segs.extend(_path_to_segments(barrier.nodes, barrier.is_closed, meta))
    return segs


def _get_refraction_segments(cfg: StrahlenoptikConfig) -> List[Dict[str, Any]]:
    """Convert each RefractionArea into oriented boundary segments."""
    segs: List[Dict[str, Any]] = []
    for ai, area in enumerate(cfg.refraction_areas):
        n = area.refractive_index
        meta = {
            'n_inside': n,
            'is_refracting': True,
            'area_idx': ai
        }
        
        if area.mode == "path":
            # Areas are always closed paths
            segs.extend(_path_to_segments(area.nodes, True, meta))
        else:
            # Rectangle boundaries
            xmn, xmx = area.x_min, area.x_max
            ymn, ymx = area.y_min, area.y_max
            edges = [
                ((xmn, ymn), (xmx, ymn), (0.0, -1.0)),   # bottom
                ((xmx, ymn), (xmx, ymx), (1.0,  0.0)),   # right
                ((xmx, ymx), (xmn, ymx), (0.0,  1.0)),   # top
                ((xmn, ymx), (xmn, ymn), (-1.0, 0.0)),   # left
            ]
            for A, B, N in edges:
                segs.append({
                    'type': 'line',
                    'A': A,
                    'B': B,
                    'outward_normal': N,
                    **meta
                })
    return segs


def _get_all_segments(cfg: StrahlenoptikConfig) -> List[Dict[str, Any]]:
    """Combine barrier and refraction boundary segments."""
    return _get_barrier_segments(cfg) + _get_refraction_segments(cfg)


def _trace_single_ray(
    origin: Tuple[float, float],
    direction: Tuple[float, float],
    all_segs: List[Dict[str, Any]],
    bounds: Tuple[float, float, float, float],
    reflections_left: int,
    current_n: float = 1.0,
) -> Tuple[List[Tuple[float, float]], List[Dict[str, Any]]]:
    """Trace a single ray; return (path, refraction_events)."""
    path: List[Tuple[float, float]] = [origin]
    events: List[Dict[str, Any]] = []
    O = origin
    D = direction

    max_iterations = 200
    iters = 0

    while iters < max_iterations:
        iters += 1
        best_t = float('inf')
        best_hit_pt: Optional[Tuple[float, float]] = None
        best_hit_normal: Optional[Tuple[float, float]] = None
        best_seg: Optional[Dict[str, Any]] = None

        for seg in all_segs:
            result = None
            if seg['type'] == 'line':
                result = ray_segment_intersection(O, D, seg['A'], seg['B'])
            elif seg['type'] == 'curve':
                if seg['curve_type'] == 'circular':
                    result = ray_circular_arc_intersection(O, D, seg['C'], seg['r'], seg['start_ang'], seg['sweep_ang'], seg.get('bend', 0.0))
                elif seg['curve_type'] == 'bezier':
                    result = ray_cubic_bezier_intersection(O, D, seg['P0'], seg['P1'], seg['P2'], seg['P3'])
            
            if result and result[0] < best_t:
                best_t, ix, iy, nx, ny = result
                best_hit_pt = (ix, iy)
                # Apply orientation multiplier to the normal
                mult = seg.get('normal_mult', 1.0)
                best_hit_normal = (nx * mult, ny * mult)
                best_seg = seg

        if best_hit_pt is None:
            path.append(ray_canvas_exit(O, D, bounds))
            break

        path.append(best_hit_pt)

        if best_seg['is_refracting']:
            N = best_hit_normal # Use the normal from intersection logic
            n_inside = best_seg['n_inside']

            # Entering when ray direction aligns with inward normal (dot > 0)
            entering = (D[0] * N[0] + D[1] * N[1]) > 0
            n1 = current_n
            n2 = n_inside if entering else 1.0

            # Normal oriented to face the incoming ray
            nx, ny = N
            if D[0] * nx + D[1] * ny > 0:
                nx, ny = -nx, -ny
            N_facing = (nx, ny)

            refracted = refract_direction(D, N, n1, n2)

            events.append({
                'point': best_hit_pt,
                'normal_facing': N_facing,
                'incident_dir': D,
                'refracted_dir': refracted,
                'n1': n1,
                'n2': n2,
                'is_tir': refracted is None,
            })

            if refracted is None:
                if reflections_left <= 0: break
                D = reflect_direction(D, best_hit_normal)
                reflections_left -= 1
            else:
                D = refracted
                current_n = n2
            O = best_hit_pt
            continue

        if not best_seg['reflecting']:
            break

        if reflections_left <= 0:
            break

        D = reflect_direction(D, best_hit_normal)
        O = best_hit_pt
        reflections_left -= 1

    return path, events


def fresnel_reflectance(cos_i: float, n1: float, n2: float) -> float:
    """Unpolarized Fresnel reflectance at a dielectric interface."""
    sin2_t = (n1 / n2) ** 2 * (1.0 - cos_i ** 2)
    if sin2_t >= 1.0:
        return 1.0
    cos_t = math.sqrt(max(0.0, 1.0 - sin2_t))
    denom_s = n1 * cos_i + n2 * cos_t
    denom_p = n2 * cos_i + n1 * cos_t
    if denom_s < EPS or denom_p < EPS:
        return 1.0
    r_s = ((n1 * cos_i - n2 * cos_t) / denom_s) ** 2
    r_p = ((n2 * cos_i - n1 * cos_t) / denom_p) ** 2
    return (r_s + r_p) / 2.0


def trace_rays(cfg: StrahlenoptikConfig) -> List[Dict[str, Any]]:
    """One entry per ray."""
    all_segs = _get_all_segments(cfg)
    bounds = (cfg.canvas_x_min, cfg.canvas_x_max, cfg.canvas_y_min, cfg.canvas_y_max)
    rays: List[Dict[str, Any]] = []

    for si, src in enumerate(cfg.light_sources):
        if src.spread > 0 and src.num_rays > 1:
            half = src.spread / 2.0
            angles = [src.angle - half + k / (src.num_rays - 1) * src.spread for k in range(src.num_rays)]
        else:
            angles = [src.angle]

        for angle in angles:
            rad = math.radians(angle)
            D = _norm(math.cos(rad), math.sin(rad))
            if D == (0.0, 0.0): continue
            path, events = _trace_single_ray((src.x, src.y), D, all_segs, bounds, cfg.max_reflections)
            rays.append({
                'path': path,
                'color': src.ray_color,
                'source_idx': si,
                'refraction_events': events,
                'draw_opacity': 1.0,
            })

            if cfg.show_partial_reflection:
                for event in events:
                    if event['is_tir']:
                        continue
                    px, py = event['point']
                    nx, ny = event['normal_facing']
                    dx, dy = event['incident_dir']
                    n1, n2 = event['n1'], event['n2']
                    cos_i = max(-1.0, min(1.0, -(dx * nx + dy * ny)))
                    R = fresnel_reflectance(cos_i, n1, n2)
                    if R < 0.01:
                        continue
                    ref_dir = reflect_direction((dx, dy), (nx, ny))
                    refl_path, _ = _trace_single_ray((px, py), ref_dir, all_segs, bounds, cfg.max_reflections)
                    rays.append({
                        'path': refl_path,
                        'color': src.ray_color,
                        'source_idx': si,
                        'refraction_events': [],
                        'draw_opacity': R,
                    })

    return rays


# ---------------------------------------------------------------------------
# Light zone / Shadow computation
# ---------------------------------------------------------------------------

def _approximate_path(nodes: List[PathNode], is_closed: bool) -> List[Tuple[float, float]]:
    """Convert a curved path into a sequence of points for shadow/grid calculation."""
    if not nodes:
        return []
    pts = []
    num_nodes = len(nodes)
    limit = num_nodes if is_closed else num_nodes - 1
    
    for i in range(limit):
        n1 = nodes[i]
        n2 = nodes[(i + 1) % num_nodes]
        p1 = (n1.x, n1.y)
        p2 = (n2.x, n2.y)
        
        if i == 0:
            pts.append(p1)
        
        if n1.connection == "line":
            pts.append(p2)
        elif n1.connection == "arc":
            params = _get_arc_params(p1, p2, n1.bend)
            if params:
                c = params['C']
                r = params['r']
                s, sw = params['start'], params['sweep']
                # Subdivide arc
                n_sub = 16
                for k in range(1, n_sub + 1):
                    ang = s + sw * k / n_sub
                    pts.append((c[0] + r * math.cos(math.radians(ang)),
                                c[1] + r * math.sin(math.radians(ang))))
            else:
                pts.append(p2)
        elif n1.connection == "bezier":
            L = math.sqrt((p2[0]-p1[0])**2 + (p2[1]-p1[1])**2)
            dist = L / 3.0
            a_out = math.radians(n1.out_angle)
            a_in = math.radians(n1.in_angle)
            c1 = (p1[0] + dist * math.cos(a_out), p1[1] + dist * math.sin(a_out))
            c2 = (p2[0] - dist * math.cos(a_in), p2[1] - dist * math.sin(a_in))
            n_sub = 16
            for k in range(1, n_sub + 1):
                t = k / n_sub
                x = (1-t)**3*p1[0] + 3*(1-t)**2*t*c1[0] + 3*(1-t)*t**2*c2[0] + t**3*p2[0]
                y = (1-t)**3*p1[1] + 3*(1-t)**2*t*c1[1] + 3*(1-t)*t**2*c2[1] + t**3*p2[1]
                pts.append((x, y))
    return pts


def _shadow_polygon(L: Tuple[float, float], A: Tuple[float, float], B: Tuple[float, float]) -> Optional[List[Tuple[float, float]]]:
    lx, ly = L
    ax, ay = A
    bx, by = B
    da = _norm(ax - lx, ay - ly)
    db = _norm(bx - lx, by - ly)
    if da == (0.0, 0.0) or db == (0.0, 0.0): return None
    return [A, B, (bx + 500 * db[0], by + 500 * db[1]), (ax + 500 * da[0], ay + 500 * da[1])]


def compute_shadow_polygons(cfg: StrahlenoptikConfig) -> List[Dict[str, Any]]:
    result: List[Dict[str, Any]] = []
    for barrier in cfg.barriers:
        pts = _approximate_path(barrier.nodes, barrier.is_closed)
        if len(pts) < 2:
            continue
        for i in range(len(pts) - 1):
            A, B = pts[i], pts[i+1]
            for src in cfg.light_sources:
                poly = _shadow_polygon((src.x, src.y), A, B)
                if poly:
                    result.append({ 'points': poly, 'opacity': cfg.shadow_opacity, 'color': cfg.shadow_color })
    return result


def _barrier_shadow_polygons_for_source(
    cfg: StrahlenoptikConfig,
    src: LightSource,
) -> List[List[Tuple[float, float]]]:
    holes: List[List[Tuple[float, float]]] = []
    for barrier in cfg.barriers:
        pts = _approximate_path(barrier.nodes, barrier.is_closed)
        if len(pts) < 2:
            continue
        for i in range(len(pts) - 1):
            poly = _shadow_polygon((src.x, src.y), pts[i], pts[i + 1])
            if poly:
                holes.append(poly)
    return holes


def _is_on_canvas_boundary(pt: Tuple[float, float], bounds: Tuple[float, float, float, float]) -> bool:
    x, y = pt
    xmin, xmax, ymin, ymax = bounds
    return (
        abs(x - xmin) < 1e-6 or abs(x - xmax) < 1e-6 or
        abs(y - ymin) < 1e-6 or abs(y - ymax) < 1e-6
    )


def _boundary_corners_in_wedge(
    origin: Tuple[float, float],
    lower_exit: Tuple[float, float],
    upper_exit: Tuple[float, float],
    bounds: Tuple[float, float, float, float],
) -> List[Tuple[float, float]]:
    xmin, xmax, ymin, ymax = bounds
    corners = [(xmin, ymin), (xmax, ymin), (xmax, ymax), (xmin, ymax)]
    ox, oy = origin

    lower_angle = math.degrees(math.atan2(lower_exit[1] - oy, lower_exit[0] - ox))
    upper_angle = math.degrees(math.atan2(upper_exit[1] - oy, upper_exit[0] - ox))
    if upper_angle <= lower_angle:
        upper_angle += 360.0

    selected: List[Tuple[float, Tuple[float, float]]] = []
    for corner in corners:
        if corner == lower_exit or corner == upper_exit:
            continue
        angle = math.degrees(math.atan2(corner[1] - oy, corner[0] - ox))
        while angle < lower_angle:
            angle += 360.0
        if lower_angle + EPS < angle < upper_angle - EPS:
            selected.append((angle, corner))

    return [corner for _, corner in sorted(selected, key=lambda item: item[0])]


def compute_light_zones(cfg: StrahlenoptikConfig, rays: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    zones: List[Dict[str, Any]] = []
    bounds = (cfg.canvas_x_min, cfg.canvas_x_max, cfg.canvas_y_min, cfg.canvas_y_max)
    for si, src in enumerate(cfg.light_sources):
        if not src.show_light_zone: continue
        src_rays = [r for r in rays if r['source_idx'] == si]
        quads: List[List[Tuple[float, float]]] = []
        holes = _barrier_shadow_polygons_for_source(cfg, src)
        if len(src_rays) >= 2:
            for i in range(len(src_rays) - 1):
                p, q = src_rays[i]['path'], src_rays[i + 1]['path']
                n_segs = min(len(p), len(q)) - 1
                for k in range(n_segs):
                    boundary_corners: List[Tuple[float, float]] = []
                    if (
                        k == 0 and
                        abs(p[k][0] - q[k][0]) < EPS and
                        abs(p[k][1] - q[k][1]) < EPS and
                        _is_on_canvas_boundary(p[k+1], bounds) and
                        _is_on_canvas_boundary(q[k+1], bounds)
                    ):
                        boundary_corners = _boundary_corners_in_wedge(p[k], p[k+1], q[k+1], bounds)
                    quads.append([p[k], p[k+1], *boundary_corners, q[k+1], q[k]])
        zones.append({ 'src_x': src.x, 'src_y': src.y, 'angle': src.angle, 'spread': src.spread,
                       'quads': quads, 'holes': holes, 'color': src.ray_color, 'opacity': src.light_zone_opacity })
    return zones


# ---------------------------------------------------------------------------
# LaTeX / TikZ helpers
# ---------------------------------------------------------------------------

def _f(v: float) -> str:
    if math.isnan(v): return "0"
    v = max(-1000.0, min(1000.0, v))
    s = f"{v:.4f}".rstrip("0").rstrip(".")
    return s if s else "0"


def _pt(p: Tuple[float, float]) -> str:
    return f"({_f(p[0])},{_f(p[1])})"


def _render_path(nodes: List[PathNode], is_closed: bool) -> str:
    """Generate a TikZ path string from nodes."""
    if not nodes:
        return ""
    num_nodes = len(nodes)
    parts = [_pt((nodes[0].x, nodes[0].y))]
    
    limit = num_nodes if is_closed else num_nodes - 1
    for i in range(limit):
        n1 = nodes[i]
        n2 = nodes[(i + 1) % num_nodes]
        p2_str = _pt((n2.x, n2.y))
        
        if n1.connection == "line":
            parts.append(f"-- {p2_str}")
        elif n1.connection == "arc":
            parts.append(f"to[bend left={_f(n1.bend)}] {p2_str}")
        elif n1.connection == "bezier":
            parts.append(f"to[out={_f(n1.out_angle)}, in={_f(n1.in_angle)}] {p2_str}")
            
    if is_closed:
        parts.append("-- cycle")
    return " ".join(parts)


def _tikz_path(pts: List[Tuple[float, float]], close: bool = True) -> str:
    if not pts: return ""
    path = " -- ".join(_pt(p) for p in pts)
    return path + (" -- cycle" if close else "")


# ---------------------------------------------------------------------------
# Refraction annotation rendering (normals + angle arcs)
# ---------------------------------------------------------------------------

def _render_refraction_annotations(
    cfg: StrahlenoptikConfig,
    all_rays: List[Dict[str, Any]],
) -> List[str]:
    ann = cfg.refraction_annotations
    if not ann.show_normals and not ann.show_angle_arcs:
        return []

    lines: List[str] = []

    for ray in all_rays:
        for event in ray.get('refraction_events', []):
            px, py = event['point']
            nx, ny = event['normal_facing']
            dx, dy = event['incident_dir']

            # ── Normal line ──────────────────────────────────────────────────
            if ann.show_normals:
                hl = ann.normal_length / 2.0
                x1, y1 = px - nx * hl, py - ny * hl
                x2, y2 = px + nx * hl, py + ny * hl
                style_part = f"{ann.normal_style}, " if ann.normal_style else ""
                lines.append(
                    rf"  \draw[{style_part}{ann.normal_color}, line width={_f(ann.normal_line_width)}pt]"
                    rf" ({_f(x1)},{_f(y1)}) -- ({_f(x2)},{_f(y2)});"
                )

            # ── Angle arcs ───────────────────────────────────────────────────
            if not ann.show_angle_arcs:
                continue

            rev_dx, rev_dy = -dx, -dy
            n_ang_deg = math.degrees(math.atan2(ny, nx))

            # Incident angle α: between N_facing and reversed-incident direction
            dot_i = max(-1.0, min(1.0, nx * rev_dx + ny * rev_dy))
            alpha_deg = math.degrees(math.acos(dot_i))

            if alpha_deg > 0.1:
                cz_i = nx * rev_dy - ny * rev_dx  # (N_facing × -D)_z
                if cz_i >= 0:
                    arc_start_i, arc_end_i = n_ang_deg, n_ang_deg + alpha_deg
                else:
                    arc_start_i, arc_end_i = n_ang_deg - alpha_deg, n_ang_deg
                mid_i = (arc_start_i + arc_end_i) / 2.0
                r_i = ann.incident_radius

                lines.append(
                    rf"  \fill[{ann.incident_color}, fill opacity={_f(ann.incident_opacity)}]"
                    rf" ({_f(px)},{_f(py)}) -- ++({_f(arc_start_i)}:{_f(r_i)})"
                    rf" arc ({_f(arc_start_i)}:{_f(arc_end_i)}:{_f(r_i)}) -- cycle;"
                )
                if ann.show_angle_labels and ann.incident_label:
                    lx = px + (r_i + 0.3) * math.cos(math.radians(mid_i))
                    ly = py + (r_i + 0.3) * math.sin(math.radians(mid_i))
                    lines.append(
                        rf"  \node[font=\tiny] at ({_f(lx)},{_f(ly)}) {{{ann.incident_label}}};"
                    )

            # Refracted angle β: between -N_facing and refracted direction
            if not event['is_tir'] and event['refracted_dir'] is not None:
                rdir_x, rdir_y = event['refracted_dir']
                neg_nx, neg_ny = -nx, -ny
                neg_n_ang_deg = math.degrees(math.atan2(neg_ny, neg_nx))

                dot_r = max(-1.0, min(1.0, neg_nx * rdir_x + neg_ny * rdir_y))
                beta_deg = math.degrees(math.acos(dot_r))

                if beta_deg > 0.1:
                    cz_r = neg_nx * rdir_y - neg_ny * rdir_x
                    if cz_r >= 0:
                        arc_start_r, arc_end_r = neg_n_ang_deg, neg_n_ang_deg + beta_deg
                    else:
                        arc_start_r, arc_end_r = neg_n_ang_deg - beta_deg, neg_n_ang_deg
                    mid_r = (arc_start_r + arc_end_r) / 2.0
                    r_r = ann.refracted_radius

                    lines.append(
                        rf"  \fill[{ann.refracted_color}, fill opacity={_f(ann.refracted_opacity)}]"
                        rf" ({_f(px)},{_f(py)}) -- ++({_f(arc_start_r)}:{_f(r_r)})"
                        rf" arc ({_f(arc_start_r)}:{_f(arc_end_r)}:{_f(r_r)}) -- cycle;"
                    )
                    if ann.show_angle_labels and ann.refracted_label:
                        lx = px + (r_r + 0.3) * math.cos(math.radians(mid_r))
                        ly = py + (r_r + 0.3) * math.sin(math.radians(mid_r))
                        lines.append(
                            rf"  \node[font=\tiny] at ({_f(lx)},{_f(ly)}) {{{ann.refracted_label}}};"
                        )

    return lines


# ---------------------------------------------------------------------------
# LaTeX generation
# ---------------------------------------------------------------------------

def _render_refraction_area_path(area: RefractionArea) -> str:
    if area.mode == "path" and area.nodes:
        return _render_path(area.nodes, True)
    else:
        x1, y1, x2, y2 = area.x_min, area.y_min, area.x_max, area.y_max
        return rf"({_f(x1)},{_f(y1)}) rectangle ({_f(x2)},{_f(y2)})"


def _get_area_center(area: RefractionArea) -> Tuple[float, float]:
    if area.mode == "path" and area.nodes:
        xs = [n.x for n in area.nodes]
        ys = [n.y for n in area.nodes]
        if xs and ys:
            return (sum(xs)/len(xs), sum(ys)/len(ys))
    return ((area.x_min + area.x_max)/2, (area.y_min + area.y_max)/2)


def generate_strahlenoptik_latex(cfg: StrahlenoptikConfig) -> str:
    xmin, xmax, ymin, ymax = cfg.canvas_x_min, cfg.canvas_x_max, cfg.canvas_y_min, cfg.canvas_y_max
    rays = trace_rays(cfg)
    shadows = compute_shadow_polygons(cfg) if cfg.show_shadow_zones else []
    light_zones = compute_light_zones(cfg, rays)

    lines = [r"\begin{tikzpicture}", rf"  \fill[white] ({_f(xmin)},{_f(ymin)}) rectangle ({_f(xmax)},{_f(ymax)});"]

    for area in cfg.refraction_areas:
        path_str = _render_refraction_area_path(area)
        lines.append(rf"  \fill[{area.fill_color}, fill opacity={_f(area.fill_opacity)}] {path_str};")
        lines.append(rf"  \draw[{area.border_color}, line width={_f(area.border_width)}pt] {path_str};")
        if area.label:
            cx, cy = _get_area_center(area)
            lines.append(rf"  \node[font=\small, text={area.border_color}] at ({_f(cx)},{_f(cy)}) {{{area.label}}};")

    for zone in light_zones:
        color, opacity = zone['color'], _f(zone['opacity'])
        holes = zone.get('holes', [])
        for quad in zone['quads']:
            quad_path = _tikz_path(quad)
            if holes:
                hole_paths = " ".join(_tikz_path(hole) for hole in holes)
                lines.append(r"  \begin{scope}")
                lines.append(rf"    \clip {quad_path};")
                lines.append(rf"    \fill[even odd rule, {color}, fill opacity={opacity}] {quad_path} {hole_paths};")
                lines.append(r"  \end{scope}")
            else:
                lines.append(rf"  \fill[{color}, fill opacity={opacity}] {quad_path};")

    for shadow in shadows:
        lines.append(rf"  \fill[{shadow['color']}, fill opacity={_f(shadow['opacity'])}] {_tikz_path(shadow['points'])};")

    if cfg.show_grid:
        lines.append(rf"  \draw[gray!25, very thin, step={_f(cfg.grid_step)}] ({_f(xmin)},{_f(ymin)}) grid ({_f(xmax)},{_f(ymax)});")

    for barrier in cfg.barriers:
        path_str = _render_path(barrier.nodes, barrier.is_closed)
        if not path_str:
            continue
        if barrier.reflecting:
            lines.append(rf"  \draw[gray!60, line width={_f(barrier.line_width + 1)}pt] {path_str};")
        lines.append(rf"  \draw[{barrier.color}, line width={_f(barrier.line_width)}pt] {path_str};")

    arrow = "->" if cfg.ray_arrow else "-"
    for ray in rays:
        p = ray['path']
        opacity = ray.get('draw_opacity', 1.0)
        opacity_str = f", draw opacity={_f(opacity)}" if opacity < 0.999 else ""
        for k in range(len(p)-1):
            lines.append(rf"  \draw[{arrow if k==len(p)-2 else '-'}, {ray['color']}{opacity_str}, line width={_f(cfg.ray_line_width)}pt] {_pt(p[k])} -- {_pt(p[k+1])};")

    for line in _render_refraction_annotations(cfg, rays): lines.append(line)

    for src in cfg.light_sources:
        lines.append(rf"  \fill[{src.ray_color}] ({_f(src.x)},{_f(src.y)}) circle ({_f(src.source_size)}pt);")

    lines.append(rf"  \draw[black, thin] ({_f(xmin)},{_f(ymin)}) rectangle ({_f(xmax)},{_f(ymax)});")
    lines.append(r"\end{tikzpicture}")
    return _wrap_document("\n".join(lines), cfg)

def _wrap_document(body, cfg):
    return render_latex_document(
        LatexDocumentSpec(
            body=body,
            class_options=("tikz", "border=6pt"),
            preamble_parts=(
                r"\usepackage{tikz}",
                r"\usetikzlibrary{arrows.meta}",
                font_input(cfg.font_family),
            ),
        )
    )
