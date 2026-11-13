# States (load with any screen that shows data)

A screen is not done until these are designed. Design them at the same fidelity as the full state.

| State | Design |
|---|---|
| Loading, first time | Skeleton in the shape of the real layout (same row heights, same hero box). No full-screen spinner. |
| Loading, refresh | Keep content; a thin progress indicator or pull-to-refresh. |
| Empty, first use | What will be here + the one action that fills it. A small illustration is fine; centred. |
| Empty, filtered | "Tidak ada hasil untuk 'kopi'" + clear filters. |
| Error, recoverable | Inline, near what failed, with retry. Keep cached content visible. |
| Error, blocking | Full-screen only when nothing can be shown; say what happened and what to do. |
| Offline | Show cached data with its age; disable network actions with a reason; queue what can wait. |
| Partial | Some sections loaded, some failed: each section owns its state. |
| Long content | The longest realistic name, a 2-line title, a big number (Rp 1.250.000.000), 0 and 1 items. |
| Permission denied | Explain the feature, link to system settings, continue without it. |
| Success | Confirm briefly (snackbar or inline), then get out of the way. |

Skeletons and progress respect reduced motion (implementation: modern-web-guidance `motion`,
`progress`, `spinner`).
