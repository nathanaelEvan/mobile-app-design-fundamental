# Search

**Job:** find one thing.

**Anatomy**
1. Search field at the top, focused on open, with a clear button; back leaves search.
2. Before typing: recent searches (removable) and a few suggestions or categories as chips.
3. While typing: results update with a short debounce; matched text highlighted by weight, not
   colour.
4. Results in the list row format of the item type; filters as chips under the field.

**Fails:** a search screen that opens empty; results in a different row style than the rest of the
app; filters hidden in a dialog.

**States:** no results (say what was searched, suggest a fix or a broader query), loading (keep the
previous results dimmed, not a spinner), offline (search cached items, say so).
