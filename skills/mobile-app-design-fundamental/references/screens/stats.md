# Stats

**Job:** show a metric over time and what it means.

**Anatomy**
1. Period control at the top (segmented: Minggu / Bulan / Tahun).
2. Hero number (display-small, tabular) with its comparison ("+12% dari minggu lalu", compared
   like for like: an unfinished week is not compared to a finished one).
3. One chart: bars for counts per period, line for a continuous trend. Labels on the axis only where
   needed; the selected point shows its value.
4. Breakdown as a list (category, value, share), sorted by size.

**Rules:** colour encodes one thing; never colour alone (add labels or patterns); one number format.
Chart implementation: the project's chart library or modern-web-guidance for custom drawing.

**Fails:** four charts on one screen; a pie chart with eight slices; red for a decrease that is good
(spending down); a 3D or gradient chart.

**States:** not enough data yet (say how much more is needed), no data in the period, loading
(skeleton of the chart's box).
