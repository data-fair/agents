/**
 * Optional dev containers (dev/dev.json "optional", a compose profile each): the API only wires the
 * ones running when it starts. A test that needs one skips when it is down, so the default local env
 * and the @smoke set only need the core containers; CI starts every profile and runs them all.
 */
export const serviceUp = (portVar: 'EVENTS_PORT') =>
  fetch(`http://localhost:${process.env[portVar]}`).then(() => true, () => false)

export const NEEDS_EVENTS = 'needs the events service: "npx --no df-dev up events", then "npx --no df-dev restart api"'
