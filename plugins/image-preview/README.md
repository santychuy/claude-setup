# Image Preview

A TypeScript mod that lets you preview PNG and JPEG files Claude mentions without leaving the terminal.

When a reply names an image file that exists (`shots/evidence.png`, `` `~/Desktop/photo.jpg` ``, `[before](./before.png)`), hold **Option** (Alt) and hover the path: a mini preview card floats above it with the file name, pixel size and picture. Move off the path or let go of Option and it disappears. **Cmd-click** still opens the file in your default app.

Why Option and not Cmd: terminals report only Shift, Option/Alt and Ctrl with mouse events, so Cmd never reaches Claude Code or its mods.

Paths are resolved against the session's working directory; `~/` and `file://` work. Paths inside code fences, remote `http(s)` URLs, files that don't exist and paths containing spaces are left alone. JPEGs are converted to PNG once (`sips` on macOS, ImageMagick `magick` elsewhere) under `$TMPDIR/claude-image-preview/`.

## Requirements

- The **fullscreen** terminal UI (`"tui": "fullscreen"`), where Claude Code tracks the pointer.
- A terminal that sends Option as Alt in mouse reports.
- A terminal Claude Code draws images in: kitty or Ghostty (Kitty graphics), Rex with the override below, or iTerm2 3.5+. Elsewhere the preview shows its alt text.
- **Rex:** Rex draws Kitty images, but it rejects the file-based query Claude Code uses to detect support, so Claude Code turns images off. Override the check before launching Claude:

  ```bash
  export CLAUDE_CODE_FORCE_TERMINAL_IMAGES=1
  ```

  To confirm detection, start with `claude --debug-file /tmp/cc.log` and look for `kittyGraphics=yes` on the `Terminal capabilities` line.

## Install

```bash
claude plugin marketplace add santychuy/claude-setup
claude plugin install image-preview@claude-setup --scope user
```

To try the checkout without installing it: `claude --plugin-dir ./plugins/image-preview`.

## Develop and verify

```bash
claude plugin validate plugins/image-preview
claude plugin test plugins/image-preview
npx --yes --package typescript tsc --project plugins/image-preview/tsconfig.json --noEmit
```

The type-check needs `.claude-plugin/types/`, which Claude Code writes the first time it loads the mod with `--plugin-dir`. The tests drive pointer events into a wrapped path line: no card without Option, a card over the path, none past it or after Option is released, plus skipping missing files, URLs and code fences.

Live check, tested in Claude Code 2.1.328 on Rex 0.1.0-preview.21: launch with `--plugin-dir`, ask Claude to reply with an image path, hold Option over the path, and confirm the card appears above it.

## Limits

- Cards fit within 40 columns by 12 rows, assuming terminal cells are twice as tall as wide.
- The card always floats above the path, so it is clipped when the path is at the very top of the screen.
- A line naming an image is drawn by the mod: its inline markdown is shown plain, it wraps by character, and dragging to select text does not start on it.
- Only replies are scanned, not tool output. On the main screen (non-fullscreen), nothing changes.

MIT; see the repository's [LICENSE](../../LICENSE).
