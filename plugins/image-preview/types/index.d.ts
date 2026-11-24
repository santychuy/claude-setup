/** A run of one line of a reply: plain text, or the text of an image path. */
export type Segment = { text: string; path?: string }

/** The image path the pointer is over with Option held, and where. */
export type Hover = { requestId: string; line: string; path: string; row: number }

declare module 'claude-code' {
  interface PluginState {
    'image-preview': { hover: Hover | null }
  }
}
