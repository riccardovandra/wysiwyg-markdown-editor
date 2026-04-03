# Mermaid Test

This file tests mermaid diagram rendering.

## Simple Flowchart

```mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Do Something]
    B -->|No| D[Do Something Else]
    C --> E[End]
    D --> E
```

## Some text after

This text should appear after the diagram.
