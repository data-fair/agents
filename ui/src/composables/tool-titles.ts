/**
 * Human labels for tool chips, remembered once seen.
 *
 * Titles come from the live tool registry, and a page's tools are unregistered
 * when it unmounts — so a chip already sitting in the scrollback would silently
 * turn back into its raw `snake_case` name, rewriting what the person read
 * minutes ago. A judged run caught it: the five wizard chips read "Choisir le
 * type de jeu de données" while on the wizard and `select_dataset_type` from the
 * next turn onwards, to a person whose whole persona is that interfaces tire
 * them.
 *
 * The memo only ever fills in: a title that was true when the call was made
 * stays true afterwards, because the call did happen on that page.
 */
export function createToolTitleMemo (lookup: (toolName: string) => string | undefined) {
  const seen = new Map<string, string>()
  return (toolName: string): string => {
    const live = lookup(toolName)
    if (live) seen.set(toolName, live)
    return seen.get(toolName) ?? toolName
  }
}
