# Layout test: wide table and long code

Some prose before the table so the column width is visible. This paragraph is here to show the normal reading width of the document card.

| Evidence | Location | Notes | Status |
| --- | --- | --- | --- |
| The skill declares this exact output path: `workspace/docs/{date} - {name}/` with `HOW_TO_USE.md` and `ARCHITECTURE.md` | `.claude/skills/leadmagnet-packager/SKILL.md:41` | Generator, templates and sanitization step are all on disk | Proven |
| `ARCHITECTURE.md` lines 1 to 17 are byte-identical to the skill's template, including the blank line the template emits before substituting the components table | `leadmagnet-packager/templates/ARCHITECTURE.md` | Template output | Proven |
| The pack says what it is | `HOW_TO_USE.md:5` "with client names and internal notes removed" | Self-describing | Proven |
| It carries install instructions you would never need | `HOW_TO_USE.md:61` "Drop the `.claude/` folder into your project root" | Addressed to a stranger | Proven |

A small table that fits the column:

| Name | Value |
| --- | --- |
| Alpha | 1 |
| Beta | 2 |

```text
current-workspace/                                  932 files
├── CLAUDE.md                        [1]    GOVERNS    loaded at session start, the one real Claude Code config for this workspace
├── README.md                        [1]    NOT YOURS  my upload brief to you, describing what to look at and what to ignore entirely
├── STRUCTURE.md                     [1]    STALE      claims a layout this folder does not have any more, see section 2.3 for details
└── workspace/docs/
    └── 2026-08-05 - Jetpacked GTM Operating System/   [60]  EXPORT  the second workspace, a giveaway pack produced by the packager skill
```

```ts
export function serializeHtmlToMarkdown(html: string, baseUri?: string): string { if (!html || html === '<p></p>') { return ''; } activeBaseUri = baseUri || ''; }
```

Closing paragraph after the code blocks.
