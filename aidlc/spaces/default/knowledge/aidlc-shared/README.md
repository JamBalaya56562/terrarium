# terrarium — shared knowledge

Team and domain knowledge for terrarium, read by every AI-DLC agent
(`knowledge/aidlc-shared/`) and by people. Start with the design.

| File | What it holds |
| ---- | ------------- |
| [design.md](design.md) | Goal, decisions, non-goals, architecture, open questions, prior art |
| [portability.md](portability.md) | Whether the approach scales past one tool: failing crates per target, the patches, what remains |
| [build-and-deploy.md](build-and-deploy.md) | Windows build environment, building any aube commit, the Pages workflow |
| [milestones.md](milestones.md) | Milestones and what was done when |
| [measurements.md](measurements.md) | Sizes and timings of debug and release builds |
| [research/cheerpx-oss.md](research/cheerpx-oss.md) | Research notes on an open-source CheerpX-style route (nothing decided) |

Durable rules distilled from these notes (tech stack, decisions,
non-goals) live in [`../../memory/project.md`](../../memory/project.md),
which AI-DLC loads into every stage.
