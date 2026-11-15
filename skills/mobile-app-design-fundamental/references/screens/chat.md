# Chat / AI conversation

**Job:** a conversation, with the composer always reachable.

**Anatomy**
1. Top app bar: the other party (avatar + name + status) or the assistant's name.
2. Messages: own on the right (brand-subtle fill), others on the left (surface-02), max width ~80%
   of the screen, grouped by sender with a timestamp per group, date separators.
3. Composer pinned at the bottom above the keyboard and inset: text field that grows to ~5 lines,
   attach, send (disabled until there is text).
4. For AI: streaming text, a stop button while generating, copy and retry on each answer.
   - **Suggested prompts** only on an empty conversation: 2-4 starters that show what to ask.
   - **Quick replies** on an active turn: short answers to the assistant's last question. They
     never hand over what the person is meant to work out (a tutor's quick replies are "Aku belum
     paham", "Kasih petunjuk", not the answer).
   - **Sources**: an answer grounded in documents cites them (a chip per source, "Buku hal. 42")
     that opens the source in a sheet.
5. Live region: one `role="status"` region announces only the assistant's new replies (once each,
   when complete) and "<name> sedang mengetik"; the person's own messages and the whole list are
   not announced.

**Fails:** bubbles with heavy shadows; every message with its own timestamp; the composer scrolling
away; a send button that looks enabled with no text.

**States:** sending, sent, failed (retry on the message), typing indicator, empty conversation,
offline (queue messages), very long message, code or table in an answer.
