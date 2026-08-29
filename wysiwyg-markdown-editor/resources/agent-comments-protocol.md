# Applying reviewer comments in markdown files

Comments are stored inline in the `.md` file using CriticMarkup:

- `{==highlighted text==}{>>note<<}`: the note refers to the highlighted text.
- `{==text==}{>>note<<}{>>Claude: reply<<}`: a thread. Notes starting with `Claude:` are agent replies.
- `{>>note<<}` with no highlight: refers to the paragraph, list item, or code block it sits in or directly after.

Procedure:

1. Find open comments: `grep -n '{>>' <file>`. Ignore matches inside code fences or backticks.
2. For each comment, read the note and the highlighted text. Apply the requested change to the highlighted text (or to the block the note points at). Keep the surrounding formatting intact.
3. When a comment is done, delete the whole comment: remove the `{==` and `==}` markers around the text and every `{>>...<<}` note. The text itself stays. The editor records resolved comments in a history file automatically; do not write history yourself.
4. If a comment cannot be applied or needs a decision, leave it in place and append a reply directly after its last note: `{>>Claude: <question or reason><<}`.
5. Do not add, remove, or reorder anything the comments did not ask for. Never edit comment syntax inside code blocks.
6. Finish with a short list: what changed for each comment, and which comments are still open with your reply.
