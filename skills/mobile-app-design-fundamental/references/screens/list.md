# Feed / list

**Job:** browse many similar items and open one.

**Anatomy**
1. Top app bar with title; search icon or a search field when search is the main way in.
2. Optional filter chips (one row, scrolls horizontally, selected chips first).
3. Rows: leading (avatar/thumbnail/icon, 40 or 56), title (body-large), 1-2 supporting lines
   (body-medium, muted), trailing (label-large value, body-small time, or a chevron). Min height
   56 / 72 / 88.
4. Group by something meaningful (date: "Hari ini", "Kemarin") with section headers (title-small).
5. FAB or top-bar action for "add", not both.

**Budget:** one leading and one trailing element per row; 1px dividers or 8px gaps, not both;
no card per row unless rows are visual objects (photos, products).

**Fails:** card per row with shadows; an icon in a coloured circle on every row; truncating the
title to one line when the second line is the useful part; infinite scroll with no position cue.

**States:** empty (what will be here and how to add the first), loading (5-7 skeleton rows),
end of list, no results for a filter (offer to clear it), pull to refresh, error with retry.
