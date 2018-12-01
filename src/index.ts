import * as functions from 'firebase-functions';
import axios from 'axios';
import { Update } from 'telegram-typings';

import Db from './db';
import { UpdateType } from './types';
import { getUpdateWithType, getPlainMessage } from './selectors';

const logger = console;
const db = Db.getInstance();

const telegramKey = functions.config().telegram.key;
const url = `https://api.telegram.org/bot${telegramKey}/getupdates`;

export const getUpdates = functions.https.onRequest(async (_, res) => {
  const opts = {
    allowed_updates: ['message'],
    limit: 100,
  };

  const response = await axios.post(url, opts);
  const updates: Update[] = response.data.result.slice(-1);

  if (!updates.length) {
    logger.info('Info: no updates');
    return res.send();
  }

  const typedUpdates = updates.map(getUpdateWithType);
  const plainMessages = typedUpdates
    .filter(u => u.type === UpdateType.message)
    .map(getPlainMessage);

  console.info('saving raw updates');
  await db.saveRawUpdates(typedUpdates);
  console.info('saving messages');
  await db.saveMessages(plainMessages);

  return res.send();
});
