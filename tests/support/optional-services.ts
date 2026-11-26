/**
 * Optional dev containers (a compose profile each): the API only wires the ones whose port variable is
 * set when it starts. A test that needs one skips when it is down, so the default local env
 * and the @smoke set only need the core containers; CI starts every profile and runs them all.
 */
export const serviceUp = (portVar: 'EVENTS_PORT') =>
  fetch(`http://localhost:${process.env[portVar]}`).then(() => true, () => false)

export const NEEDS_EVENTS = 'needs the events service: "npm run dev-deps -- --profile events", then restart the API'
