# SPDX-License-Identifier: AGPL-3.0-or-later

from pydantic import BaseModel, Field
from typing import List


class LensConfig(BaseModel):
    """Konfiguration einer einzelnen dünnen Linse im Linsensystem."""
    x: float = 0.0       # Position auf der optischen Achse (cm)
    f: float = 3.0       # Brennweite (cm); negativ = Zerstreuungslinse
    h: float = 4.0       # Gesamthöhe der Linse (cm)


class RayConfig(BaseModel):
    """Konfiguration für einen einzelnen Konstruktionsstrahl."""
    show: bool = True
    color: str = "gray"
    width: float = 0.8


class LightSource(BaseModel):
    """Konfiguration einer zusätzlichen Lichtquelle mit Konstruktionsstrahlen."""
    show: bool = True
    x: float = -7.0
    y: float = 2.0
    label: str = ""
    source_size: float = 2.0
    # Individuelle Strahlen
    parallel_ray: RayConfig = Field(default_factory=lambda: RayConfig(color="yellow!90!black", show=False))
    central_ray: RayConfig = Field(default_factory=lambda: RayConfig(color="yellow!90!black", show=True))
    focal_ray: RayConfig = Field(default_factory=lambda: RayConfig(color="yellow!90!black", show=False))


class OptikObject(BaseModel):
    """Konfiguration eines Gegenstands (Pfeil) mit eigenen Strahlen."""
    show: bool = True
    x: float = -5.0
    G: float = 2.0
    label: str = "G"
    color: str = "blue"
    # Individuelle Strahlen
    parallel_ray: RayConfig = Field(default_factory=lambda: RayConfig(color="orange", width=1.0))
    central_ray: RayConfig = Field(default_factory=lambda: RayConfig(color="green!60!black", width=1.0))
    focal_ray: RayConfig = Field(default_factory=lambda: RayConfig(color="violet", width=1.0))


class OptikConfig(BaseModel):
    """Vollständige Konfiguration des Optik-Generators."""

    # --- System-Modus ---
    telescope_mode: bool = False
    """Fernrohr-Modus: Objekt liegt im Unendlichen (paralleles Strahlenbündel)."""
    alpha: float = 5.0
    """Sehwinkel/Eintrittswinkel in Grad (nur im Fernrohr-Modus)."""

    # --- Gegenstände (Pfeile) ---
    objects: List[OptikObject] = Field(
        default_factory=lambda: [OptikObject()]
    )

    # --- Lichtquellen (Punkte) ---
    light_sources: List[LightSource] = Field(default_factory=list)

    # --- Linsensystem ---
    lenses: List[LensConfig] = Field(
        default_factory=lambda: [LensConfig(x=0.0, f=3.0, h=4.0)]
    )

    # --- Darstellung ---
    axis_extra: float = 1.5
    """Überstand der optischen Achse links/rechts (cm)."""
    realistic_lens: bool = True
    """Realistische (Bézier-Kurven) statt symbolischer Linsenzeichnung."""
    show_lens_plane: bool = True
    """Gestrichelte senkrechte Linsenebene einzeichnen."""
    virtual_ray_extension: float = 1.0
    """Verlängerungsfaktor für virtuelle Strahlen."""

    # --- Maßpfeile (Annotationen) ---
    show_annot_g: bool = False
    show_annot_b: bool = False
    show_annot_f: bool = False
    show_annot_G: bool = False
    show_annot_B: bool = False

    # --- Globale Optionen ---
    font_family: str = "Fira"
