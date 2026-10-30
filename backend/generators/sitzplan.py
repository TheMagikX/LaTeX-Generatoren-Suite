# SPDX-License-Identifier: AGPL-3.0-or-later

import numpy as np
from typing import List, Tuple, Dict, Set
from dataclasses import dataclass, field
from collections import defaultdict
import time

try:
    from ortools.sat.python import cp_model
    ORTOOLS_OK = True
except ImportError:
    ORTOOLS_OK = False

from models.sitzplan import SitzplanRequest, SitzplanResponse, StudentConfig

def id_to_rc(idx: int, cols: int) -> Tuple[int, int]:
    return (idx // cols, idx % cols)

def rc_to_id(r: int, c: int, cols: int) -> int:
    return r * cols + c

def solve_sitzplan(req: SitzplanRequest) -> SitzplanResponse:
    solver_used = "greedy"
    if ORTOOLS_OK:
        try:
            assignment = solve_with_ortools(req)
            if assignment:
                solver_used = "ortools"
            else:
                assignment = solve_greedy(req)
        except Exception:
            assignment = solve_greedy(req)
    else:
        assignment = solve_greedy(req)

    return compute_reports(req, assignment, solver_used)

def solve_with_ortools(req: SitzplanRequest) -> Dict[str, int]:
    model = cp_model.CpModel()
    students = req.students
    layout = req.layout
    rows, cols = layout.rows, layout.cols
    
    # Identify available seats
    if layout.matrix:
        allowed_coords = {(r, c) for r in range(rows) for c in range(len(layout.matrix[r])) if layout.matrix[r][c] == 1}
    else:
        blocked = set(tuple(p) for p in layout.blocked_seats)
        allowed_coords = {(r, c) for r in range(rows) for c in range(cols) if (r, c) not in blocked}
    
    available_seat_ids = [rc_to_id(r, c, cols) for (r, c) in sorted(allowed_coords)]
    
    # Front seats
    front_seat_ids = {
        rc_to_id(r, c, cols) for r in range(rows - layout.front_rows, rows) for c in range(cols)
        if (r, c) in allowed_coords
    }
    
    # Adjacency pairs
    adj_id_pairs = []
    for (r, c) in allowed_coords:
        # right
        if (r, c + 1) in allowed_coords:
            adj_id_pairs.append((rc_to_id(r, c, cols), rc_to_id(r, c + 1, cols)))
        # down
        if req.include_vertical and (r + 1, c) in allowed_coords:
            adj_id_pairs.append((rc_to_id(r, c, cols), rc_to_id(r + 1, c, cols)))
        # diagonal
        if req.include_diagonal and (r + 1, c + 1) in allowed_coords:
            adj_id_pairs.append((rc_to_id(r, c, cols), rc_to_id(r + 1, c + 1, cols)))
        if req.include_diagonal and (r + 1, c - 1) in allowed_coords:
            adj_id_pairs.append((rc_to_id(r, c, cols), rc_to_id(r + 1, c - 1, cols)))

    # Bidirectional
    all_adj_id_pairs = []
    for p, q in adj_id_pairs:
        all_adj_id_pairs.append((p, q))
        all_adj_id_pairs.append((q, p))

    S = list(range(len(students)))
    P = available_seat_ids
    
    # Variables: x[s, p] is true if student s is in seat p
    x = {(s, p): model.NewBoolVar(f"x_{s}_{p}") for s in S for p in P}
    
    # Constraints: each student exactly 1 seat, each seat max 1 student
    for s in S:
        model.Add(sum(x[s, p] for p in P) == 1)
    for p in P:
        model.Add(sum(x[s, p] for s in S) <= 1)
        
    idx_by_name = {st.name: i for i, st in enumerate(students)}
    
    # Hard: Dislikes must maintain minimum distance
    forbid_neighbors_pairs = set()
    for s in students:
        for d in s.dislikes_neighbors:
            if d in idx_by_name:
                forbid_neighbors_pairs.add(frozenset([s.name, d]))

    for pair in forbid_neighbors_pairs:
        a, b = list(pair)
        sa, sb = idx_by_name[a], idx_by_name[b]
        for p in P:
            rp, cp = id_to_rc(p, cols)
            for q in P:
                rq, cq = id_to_rc(q, cols)
                if abs(rp - rq) + abs(cp - cq) <= req.dislike_distance:
                    model.Add(x[sa, p] + x[sb, q] <= 1)
            
    # Hard: Teacher restrictions
    # Row exclusion
    for a_name, b_name in req.hard_rules.not_same_row:
        if a_name in idx_by_name and b_name in idx_by_name:
            sa, sb = idx_by_name[a_name], idx_by_name[b_name]
            for p in P:
                rp, _ = id_to_rc(p, cols)
                for q in P:
                    rq, _ = id_to_rc(q, cols)
                    if rp == rq:
                        model.Add(x[sa, p] + x[sb, q] <= 1)
                        
    # Col exclusion
    for a_name, b_name in req.hard_rules.not_same_col:
        if a_name in idx_by_name and b_name in idx_by_name:
            sa, sb = idx_by_name[a_name], idx_by_name[b_name]
            for p in P:
                _, cp = id_to_rc(p, cols)
                for q in P:
                    _, cq = id_to_rc(q, cols)
                    if cp == cq:
                        model.Add(x[sa, p] + x[sb, q] <= 1)
                        
    # Min distance
    for rule in req.hard_rules.min_distance:
        a_name, b_name = rule["names"]
        k_req = rule["k"]
        if a_name in idx_by_name and b_name in idx_by_name:
            sa, sb = idx_by_name[a_name], idx_by_name[b_name]
            for p in P:
                rp, cp = id_to_rc(p, cols)
                for q in P:
                    rq, cq = id_to_rc(q, cols)
                    if abs(rp - rq) + abs(cp - cq) < k_req:
                        model.Add(x[sa, p] + x[sb, q] <= 1)

    # Hard: No student sits alone
    if req.hard_rules.no_alone:
        alone_adj_ids = defaultdict(list)
        for (r, c) in allowed_coords:
            p = rc_to_id(r, c, cols)
            # horizontal (always partner)
            for dc in [-1, 1]:
                if (r, c + dc) in allowed_coords:
                    alone_adj_ids[p].append(rc_to_id(r, c + dc, cols))
            # vertical (if enabled)
            if req.hard_rules.no_alone_vertical:
                for dr in [-1, 1]:
                    if (r + dr, c) in allowed_coords:
                        alone_adj_ids[p].append(rc_to_id(r + dr, c, cols))
            # diagonal (if enabled)
            if req.hard_rules.no_alone_diagonal:
                for dr, dc in [(-1, -1), (-1, 1), (1, -1), (1, 1)]:
                    if (r + dr, c + dc) in allowed_coords:
                        alone_adj_ids[p].append(rc_to_id(r + dr, c + dc, cols))

        for p in P:
            q_list = alone_adj_ids[p]
            if q_list:
                model.Add(sum(x[s, q] for s in S for q in q_list) >= sum(x[s, p] for s in S))
            else:
                model.Add(sum(x[s, p] for s in S) == 0)

    # Soft: Front wishes
    obj_soft = []
    for s_idx, st in enumerate(students):
        if st.wants_front:
            for p in front_seat_ids:
                obj_soft.append(req.w_front * x[s_idx, p])
                
    # Neighbor wishes
    wish_neighbors_pairs = set()
    for st in students:
        for n in st.wants_neighbors:
            if n in idx_by_name and n != st.name:
                wish_neighbors_pairs.add(frozenset([st.name, n]))
                
    pairs_list = []
    for pair in wish_neighbors_pairs:
        a, b = list(pair)
        sa, sb = idx_by_name[a], idx_by_name[b]
        pairs_list.append((min(sa, sb), max(sa, sb)))
        
    y_by_pair = {}
    for (sa, sb) in pairs_list:
        key = (sa, sb)
        ys = []
        for (p, q) in all_adj_id_pairs:
            y = model.NewBoolVar(f"y_adj_{sa}_{sb}_{p}_{q}")
            model.AddMultiplicationEquality(y, [x[sa, p], x[sb, q]])
            ys.append(y)
        y_by_pair[key] = ys
        
    e_by_pair = {}
    for key, ys in y_by_pair.items():
        e = model.NewBoolVar(f"e_{key[0]}_{key[1]}")
        if ys:
            for y in ys:
                model.Add(e >= y)
            model.Add(e <= sum(ys))
        else:
            model.Add(e == 0)
        e_by_pair[key] = e
        
    # Fairness: at least one wish fulfilled
    pairs_by_student = {i: [] for i in S}
    for (sa, sb), e in e_by_pair.items():
        pairs_by_student[sa].append(e)
        pairs_by_student[sb].append(e)
        
    z = {}
    for s in S:
        zs = model.NewBoolVar(f"z_{s}")
        if pairs_by_student[s]:
            model.Add(zs <= sum(pairs_by_student[s]))
        else:
            model.Add(zs == 0)
        z[s] = zs
        
    # Weights for fairness based on wish count
    SCALE = 1000
    wfair = {i: max(1, int(round(SCALE / (1 + len(students[i].wants_neighbors))))) for i in S}
    
    # Mutual wishes factor
    mutual_count = defaultdict(int)
    for i, st_i in enumerate(students):
        for name_j in st_i.wants_neighbors:
            if name_j in idx_by_name and name_j != st_i.name:
                j = idx_by_name[name_j]
                key = (min(i, j), max(i, j))
                mutual_count[key] += 1
                
    wpair = {}
    for (sa, sb) in e_by_pair.keys():
        base = max(1, wfair[sa] + wfair[sb])
        m = req.mutual_factor if mutual_count.get((sa, sb), 0) >= 2 else 1
        wpair[(sa, sb)] = base * m
        
    # Objective
    FAIR_WEIGHT = 1_000_000
    PAIR_WEIGHT = 1
    FRONT_WEIGHT = 1
    
    model.Maximize(
        FAIR_WEIGHT * sum(wfair[s] * z[s] for s in S) +
        PAIR_WEIGHT * sum(wpair[(sa, sb)] * e_by_pair[(sa, sb)] for (sa, sb) in e_by_pair.keys()) +
        FRONT_WEIGHT * sum(obj_soft)
    )
    
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 15.0
    solver.parameters.num_search_workers = 8
    res = solver.Solve(model)
    
    if res in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        assignment = {}
        for s in S:
            for p in P:
                if solver.Value(x[s, p]) == 1:
                    assignment[students[s].name] = p
                    break
        return assignment
    return {}

def solve_greedy(req: SitzplanRequest) -> Dict[str, int]:
    rng = np.random.default_rng(1)
    layout = req.layout
    rows, cols = layout.rows, layout.cols
    
    if layout.matrix:
        allowed_coords = {(r, c) for r in range(rows) for c in range(len(layout.matrix[r])) if layout.matrix[r][c] == 1}
    else:
        blocked = set(tuple(p) for p in layout.blocked_seats)
        allowed_coords = {(r, c) for r in range(rows) for c in range(cols) if (r, c) not in blocked}
        
    available_seat_ids = [rc_to_id(r, c, cols) for (r, c) in sorted(allowed_coords)]
    free = set(available_seat_ids)
    
    adj_map = defaultdict(set)
    for (r, c) in allowed_coords:
        # right
        if (r, c + 1) in allowed_coords:
            p, q = rc_to_id(r, c, cols), rc_to_id(r, c + 1, cols)
            adj_map[p].add(q); adj_map[q].add(p)
        # down
        if req.include_vertical and (r + 1, c) in allowed_coords:
            p, q = rc_to_id(r, c, cols), rc_to_id(r + 1, c, cols)
            adj_map[p].add(q); adj_map[q].add(p)
            
    idx_by_name = {st.name: i for i, st in enumerate(req.students)}
    forbid_pairs = set()
    for s in req.students:
        for d in s.dislikes_neighbors:
            if d in idx_by_name:
                forbid_pairs.add(frozenset([s.name, d]))
                
    def forbidden(a, b):
        return frozenset([a, b]) in forbid_pairs

    assignment = {}
    used = set()
    
    def place(name, seat):
        assignment[name] = seat
        used.add(name)
        free.discard(seat)
        
    # Heuristic: place hubs first
    deg = {s.name: len(s.wants_neighbors) for s in req.students}
    hubs = sorted([n for n in deg if deg[n] >= 2], key=lambda n: deg[n], reverse=True)
    
    for hub in hubs:
        if hub in used or not free: continue
        # Find a seat with free neighbors
        seat = next(iter(free))
        place(hub, seat)
        
    # Then pairs
    wish_neighbors_pairs = set()
    for st in req.students:
        for n in st.wants_neighbors:
            if n in idx_by_name and n != st.name:
                wish_neighbors_pairs.add(frozenset([st.name, n]))
    
    pairs = [list(p) for p in wish_neighbors_pairs]
    rng.shuffle(pairs)
    for a, b in pairs:
        if a in used or b in used: continue
        done = False
        for p in list(free):
            for q in adj_map[p]:
                if q in free and not forbidden(a, b):
                    place(a, p); place(b, q)
                    done = True
                    break
            if done: break
            
    # Then front wishes
    front_seat_ids = [rc_to_id(r, c, cols) for r in range(rows - layout.front_rows, rows) for c in range(cols) if (r, c) in allowed_coords]
    front_free = [p for p in free if p in front_seat_ids]
    rng.shuffle(front_free)
    for s in req.students:
        if s.name in used: continue
        if s.wants_front and front_free:
            place(s.name, front_free.pop())
            
    # Then the rest
    if req.hard_rules.no_alone:
        alone_adj_map = defaultdict(set)
        for (r, c) in allowed_coords:
            p = rc_to_id(r, c, cols)
            for dc in [-1, 1]:
                if (r, c + dc) in allowed_coords:
                    alone_adj_map[p].add(rc_to_id(r, c + dc, cols))
            if req.hard_rules.no_alone_vertical:
                for dr in [-1, 1]:
                    if (r + dr, c) in allowed_coords:
                        alone_adj_map[p].add(rc_to_id(r + dr, c, cols))
            if req.hard_rules.no_alone_diagonal:
                for dr, dc in [(-1, -1), (-1, 1), (1, -1), (1, 1)]:
                    if (r + dr, c + dc) in allowed_coords:
                        alone_adj_map[p].add(rc_to_id(r + dr, c + dc, cols))

        for s in req.students:
            if s.name in used or not free:
                continue
            # Prefer free seat with occupied neighbor
            candidate_seats = [p for p in free if any(q in free for q in alone_adj_map[p]) or any(assignment.get(name) in alone_adj_map[p] for name in used)]
            if candidate_seats:
                chosen = rng.choice(candidate_seats)
            else:
                chosen = next(iter(free))
            place(s.name, chosen)
    else:
        rest = list(free); rng.shuffle(rest)
        for s in req.students:
            if s.name in used: continue
            if rest:
                place(s.name, rest.pop())
            
    return assignment

def compute_reports(req: SitzplanRequest, assignment: Dict[str, int], solver_used: str = "greedy") -> SitzplanResponse:
    students = req.students
    layout = req.layout
    cols = layout.cols
    
    if layout.matrix:
        allowed_coords = {(r, c) for r in range(layout.rows) for c in range(len(layout.matrix[r])) if layout.matrix[r][c] == 1}
    else:
        blocked = set(tuple(p) for p in layout.blocked_seats)
        allowed_coords = {(r, c) for r in range(layout.rows) for c in range(cols) if (r, c) not in blocked}
        
    front_seat_ids = {
        rc_to_id(r, c, cols) for r in range(layout.rows - layout.front_rows, layout.rows) for c in range(cols)
        if (r, c) in allowed_coords
    }
    
    adj_map = defaultdict(set)
    for (r, c) in allowed_coords:
        # right
        if (r, c + 1) in allowed_coords:
            p, q = rc_to_id(r, c, cols), rc_to_id(r, c + 1, cols)
            adj_map[p].add(q); adj_map[q].add(p)
        # down
        if req.include_vertical and (r + 1, c) in allowed_coords:
            p, q = rc_to_id(r, c, cols), rc_to_id(r + 1, c, cols)
            adj_map[p].add(q); adj_map[q].add(p)
        # diagonal
        if req.include_diagonal:
            for dr, dc in [(1, 1), (1, -1)]:
                if (r + dr, c + dc) in allowed_coords:
                    p, q = rc_to_id(r, c, cols), rc_to_id(r + dr, c + dc, cols)
                    adj_map[p].add(q); adj_map[q].add(p)

    # Specific partner adjacency for 'no alone' analysis
    alone_adj_map = defaultdict(set)
    for (r, c) in allowed_coords:
        p = rc_to_id(r, c, cols)
        for dc in [-1, 1]:
            if (r, c + dc) in allowed_coords:
                alone_adj_map[p].add(rc_to_id(r, c + dc, cols))
        if req.hard_rules.no_alone_vertical:
            for dr in [-1, 1]:
                if (r + dr, c) in allowed_coords:
                    alone_adj_map[p].add(rc_to_id(r + dr, c, cols))
        if req.hard_rules.no_alone_diagonal:
            for dr, dc in [(-1, -1), (-1, 1), (1, -1), (1, 1)]:
                if (r + dr, c + dc) in allowed_coords:
                    alone_adj_map[p].add(rc_to_id(r + dr, c + dc, cols))

    name_of = {p: n for n, p in assignment.items()}
    idx_by_name = {st.name: i for i, st in enumerate(students)}
    forbid_set = set()
    for s in students:
        for d in s.dislikes_neighbors:
            if d in idx_by_name:
                forbid_set.add(frozenset([s.name, d]))

    records = []
    per_student_report = {}
    
    for s in students:
        p = assignment.get(s.name)
        ok_front = p in front_seat_ids if p is not None else False
        
        neigh_ids = adj_map.get(p, set()) if p is not None else set()
        neigh_names = {name_of[q] for q in neigh_ids if q in name_of}
        
        wanted_list = sorted(list(s.wants_neighbors))
        ok_list = sorted([w for w in wanted_list if w in neigh_names])
        unmet_list = [w for w in wanted_list if w not in ok_list]
        
        violates_dislike = False
        if p is not None:
            rp, cp_coord = id_to_rc(p, cols)
            for d_name in s.dislikes_neighbors:
                if d_name in {st.name: i for i, st in enumerate(students)} and d_name in assignment:
                    q = assignment[d_name]
                    rq, cq_coord = id_to_rc(q, cols)
                    if abs(rp - rq) + abs(cp_coord - cq_coord) <= req.dislike_distance:
                        violates_dislike = True
                        break
                    
        partners = sorted([name_of[q] for q in alone_adj_map.get(p, set()) if q in name_of]) if p is not None else []
        is_alone = len(partners) == 0
        violates_no_alone = req.hard_rules.no_alone and is_alone

        if is_alone:
            partner_status = "❌ Alleine"
        elif len(partners) <= 2:
            partner_status = f"✅ ({', '.join(partners)})"
        else:
            partner_status = f"✅ ({len(partners)} Partner)"

        records.append({
            "Schüler": s.name,
            "PlatzID": p,
            "Reihe": id_to_rc(p, cols)[0] if p is not None else None,
            "Spalte": id_to_rc(p, cols)[1] if p is not None else None,
            "Front erfüllt": "✅" if (s.wants_front and ok_front) else ("—" if not s.wants_front else "❌"),
            "Neben erfüllt": f"{len(ok_list)}/{len(wanted_list)}",
            "Nicht erfüllte Wünsche": ", ".join(unmet_list) if unmet_list else "—",
            "Abneigungen eingehalten": "✅" if not violates_dislike else "❌",
            "Partner": partner_status,
        })
        
        per_student_report[s.name] = {
            "front_wish": s.wants_front,
            "front_ok": ok_front,
            "wanted_neighbors": wanted_list,
            "neighbors_ok": ok_list,
            "neighbors_unmet": unmet_list,
            "violates_dislike": violates_dislike,
            "partners": partners,
            "is_alone": is_alone,
            "violates_no_alone": violates_no_alone,
        }
        
    return SitzplanResponse(
        assignment=assignment,
        report=records,
        per_student_report=per_student_report,
        solver_used=solver_used
    )
