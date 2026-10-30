# SPDX-License-Identifier: AGPL-3.0-or-later

from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
from enum import Enum

class DataMode(str, Enum):
    RAW = "Raw"
    PARAMETERS = "Parameters"
    FREQUENCY = "Frequency"

class StatistikType(str, Enum):
    BOXPLOT = "Boxplot"
    HISTOGRAMM = "Histogramm"
    SAEULENDIAGRAMM = "Säulendiagramm"
    SUMMENKURVE = "Summenkurve"
    VIOLIN = "Violin"

class Orientation(str, Enum):
    HORIZONTAL = "horizontal"
    VERTICAL = "vertical"

class DatasetParams(BaseModel):
    model_config = ConfigDict(extra="allow")
    min: float
    q1: float
    median: float
    q3: float
    max: float
    mean: Optional[float] = None
    std_dev: Optional[float] = None
    variance: Optional[float] = None

class DatasetConfig(BaseModel):
    model_config = ConfigDict(extra="allow")
    name: str = "Datensatz"
    data_mode: DataMode = DataMode.RAW
    raw_data: List[float] = Field(default_factory=list)
    raw_data_string: Optional[str] = ""
    freq_data_string: Optional[str] = ""
    bar_labels_string: Optional[str] = ""
    category_colors: Dict[str, str] = Field(default_factory=dict)
    params: Optional[DatasetParams] = None
    color: str = "black"
    show_outliers: bool = True

class BarWidthMode(str, Enum):
    CM = "cm"
    BOXES = "boxes"

class AxisConfig(BaseModel):
    model_config = ConfigDict(extra="allow")
    min: Optional[float] = None
    max: Optional[float] = None
    step: float = 1
    label: str = ""
    show_grid: bool = True
    grid_style: str = "kaestchen"
    tick_mode: str = "Automatisch"
    tick_list: str = ""
    majorticklabels: bool = True
    ticks_show: bool = True

class BoxplotOptions(BaseModel):
    model_config = ConfigDict(extra="allow")
    orientation: Orientation = Orientation.HORIZONTAL
    box_width: float = 1.0
    draw_mean: bool = False

class HistogramOptions(BaseModel):
    model_config = ConfigDict(extra="allow")
    bin_width: float = 1.0
    density: bool = False

class BarChartOptions(BaseModel):
    model_config = ConfigDict(extra="allow")
    orientation: Orientation = Orientation.VERTICAL
    width_mode: BarWidthMode = BarWidthMode.BOXES
    bar_width: float = 0.6
    bar_width_boxes: float = 2.0
    bar_gap_boxes: float = 1.0
    bar_gap: float = 0.5
    margin_boxes: float = 1.0
    show_grid: bool = True
    opacity: float = 75.0
    vertical_labels: bool = False
    show_values: bool = False

class SummenkurveOptions(BaseModel):
    model_config = ConfigDict(extra="allow")
    smooth: bool = False
    as_percent: bool = True

class ViolinOptions(BaseModel):
    model_config = ConfigDict(extra="allow")
    orientation: Orientation = Orientation.HORIZONTAL
    violin_width: float = 0.8
    bandwidth: float = 0.4
    show_inner_box: bool = True

class TitleConfig(BaseModel):
    model_config = ConfigDict(extra="allow")
    show: bool = False
    text: str = ""
    color: str = "#1e293b"
    font_size: str = "\\large"
    font_weight: str = "bold"
    align: str = "center"
    custom_style: Optional[str] = ""

class StatistikConfig(BaseModel):
    model_config = ConfigDict(extra="allow")
    type: StatistikType = StatistikType.BOXPLOT
    datasets: List[DatasetConfig] = Field(default_factory=lambda: [DatasetConfig()])
    x_axis: AxisConfig = Field(default_factory=AxisConfig)
    y_axis: AxisConfig = Field(default_factory=AxisConfig)
    boxplot_opts: BoxplotOptions = Field(default_factory=BoxplotOptions)
    histogram_opts: HistogramOptions = Field(default_factory=HistogramOptions)
    barchart_opts: BarChartOptions = Field(default_factory=BarChartOptions)
    summenkurve_opts: SummenkurveOptions = Field(default_factory=SummenkurveOptions)
    violin_opts: ViolinOptions = Field(default_factory=ViolinOptions)
    title_opts: TitleConfig = Field(default_factory=TitleConfig)
    font_family: str = "Fira"
    font_size: str = "normalsize"
    width_cm: float = 12.0
    height_cm: float = 8.0
