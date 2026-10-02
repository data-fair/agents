/**
 * The ONE type for a stored message's parts.
 *
 * It is the AI SDK's own discriminated union, which was already the authoritative definition — the
 * client has imported it all along as `UIMessagePart<UIDataTypes, UITools>`. What was wrong is that
 * three other representations of the same value existed beside it:
 *
 *  - the JSON schema described a loose object with a few optional known keys
 *  - the server used `UIPart = { type: string, [key: string]: unknown }`, an open bag
 *  - the wire used `unknown[]`
 *
 * Nothing was gained by any of them, and the `parts as any` casts in the executor were not
 * incidental: they were where the open bag had to be forced into the generated schema type. Naming
 * the SDK union once, here, removes the parallel definitions and the casts together.
 *
 * Why the SDK's and not one of ours: these parts ARE the SDK's message model. `convertToModelMessages`
 * consumes them, `safeValidateUIMessages` validates them, and the stream produces them. A parallel
 * definition could only ever be a lagging copy of this one.
 */
import type { UIMessagePart, UIDataTypes, UITools } from 'ai'

export type MessagePart = UIMessagePart<UIDataTypes, UITools>

/**
 * A text part, which is the only shape this codebase constructs by hand.
 *
 * Narrowed so `withAppendedText` and the refusal paths get a checked literal rather than a widened
 * member of the union — a `{ type: 'text' }` with a misspelled payload field would otherwise still
 * typecheck as a `MessagePart`.
 */
export type TextPart = Extract<MessagePart, { type: 'text' }>

export const textPart = (text: string): TextPart => ({ type: 'text', text })

/** The text of a message, which is every text part joined. */
export const partsText = (parts: readonly MessagePart[] = []): string =>
  parts.filter((part): part is TextPart => part.type === 'text').map(part => part.text).join('')
