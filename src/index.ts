import * as functions from 'firebase-functions';
import processTelegramUpdates from './functions/processTelegramUpdates';

import Db from './db';

const logger = console;
const db = Db.getInstance();

const telegramKey = functions.config().telegram.key;
const url = `https://api.telegram.org/bot${telegramKey}/getupdates`;

export const processTelegramUpdatesFn = functions.https.onRequest(
  async (_, res) => {
    try {
      const updates = await processTelegramUpdates(db, logger, url);
      return res.send({ ok: true, updates: updates.length });
    } catch (error) {
      logger.error(error);
      return res.status(500).send({ ok: false });
    }
  }
);
