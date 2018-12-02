import * as functions from 'firebase-functions';
import processTelegramUpdates from './functions/processTelegramUpdates';
import importUsers from './functions/importUsers';

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

export const importUsersInternalFn = functions.https.onRequest(
  async (req, res) => {
    const { users, groupId } = req.body;

    if (!users || !users.length) {
      return res.status(400).send('users parameter is required');
    }

    if (!groupId) {
      return res.status(400).send('groupId parameter is required');
    }

    try {
      await importUsers(db, groupId, users);
      return res.send({ ok: true, usersAdded: users.length });
    } catch (error) {
      logger.error(error);
      return res.status(500).send({ ok: false });
    }
  }
);
