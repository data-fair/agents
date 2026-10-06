// Backfills each conversation's running credit total from its runs.
//
// WHY: what a conversation has cost used to be an aggregate over its runs, run on every attach and
// after every turn. It is now a total kept on the conversation by the write that closes each run, so
// a conversation from before needs its total set once — otherwise the first turn's increment would
// start it from zero and the chat would show a fraction of the real figure.
//
// Must run after conversations-are-not-autonomous.js: the runner orders a folder alphabetically, which
// is why this file is named so it sorts after that one: it reads the renamed collections.
//
// exec() MUST be idempotent (see @data-fair/lib-node/upgrade-scripts.js's UpgradeScript contract): it
// only touches conversations that have no total yet, and a re-run finds none.

/** @type {import('@data-fair/lib-node/upgrade-scripts.js').UpgradeScript} */
export default {
  description: 'set each conversation\'s running credit total from its runs',

  async exec (db, debug) {
    const conversations = db.collection('conversations')
    const runs = db.collection('runs')
    let updated = 0
    for await (const conversation of conversations.find({ credits: { $exists: false } }, { projection: { _id: 0, id: 1 } })) {
      const [total] = await runs.aggregate([
        { $match: { conversationId: conversation.id } },
        { $group: { _id: null, credits: { $sum: { $ifNull: ['$credits', 0] } } } }
      ]).toArray()
      await conversations.updateOne({ id: conversation.id, credits: { $exists: false } }, { $set: { credits: total?.credits ?? 0 } })
      updated++
    }
    debug(`set the credit total of ${updated} conversation(s)`)
  }
}
