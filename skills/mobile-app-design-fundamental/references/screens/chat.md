# Chat / AI conversation

**Job:** a conversation, with the composer always reachable.

**Anatomy**
1. Top app bar: the other party (avatar + name + status) or the assistant's name.
2. Messages: own on the right (brand-subtle fill), others on the left (surface-02), max width ~80%
   of the screen, grouped by sender with a timestamp per group, date separators.
3. Composer pinned at the bottom above the keyboard and inset: text field that grows to ~5 lines,
   attach, send (disabled until there is text).
4. For AI: streaming text, a stop button while generating, copy and retry on each answer, suggested
   prompts only on an empty conversation.

**Fails:** bubbles with heavy shadows; every message with its own timestamp; the composer scrolling
away; a send button that looks enabled with no text.

**States:** sending, sent, failed (retry on the message), typing indicator, empty conversation,
offline (queue messages), very long message, code or table in an answer.
