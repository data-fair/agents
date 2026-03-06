import { z } from 'zod'

export const filtersSchema = z.record(
  z.string().regex(/^.+_(search|eq|in|gte?|lte?|n?exists)$/, {
    message: 'Filter key must follow pattern: column_key + suffix (_eq, _search, _in, _gte, _gt, _lte, _lt, _exists, _nexists)'
  }),
  z.string()
).optional().describe('Precise filters on specific columns. This applies to each row individually. Each filter key must be: column_key + suffix. Available suffixes: _eq (strictly equal, case-sensitive), _in (value must be in the list, case-sensitive, values separated by a comma), _search (full-text search within that column, case-insensitive and flexible matching), _gte (greater than or equal), _gt (greater than), _lte (less than or equal), _lt (less than), _exists (exists), and _nexists (does not exist). Use column keys from describe_dataset. Example: { "nom_search": "Jean", "age_lte": "30", "ville_eq": "Paris", "code_in": "A,B,C" } searches for people whose names contain "Jean", who are 30 years old or younger, who live in Paris, and whose code is A, B, or C.')
