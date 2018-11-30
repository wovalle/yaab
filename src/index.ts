import * as functions from 'firebase-functions';
import { Update } from 'telegram-typings';
import { UpdateType, TypedUpdate } from './types';

import axios from 'axios';
import Db from './db';

const logger = console;
const db = Db.getInstance();

const getUpdateWithType = (update: Update): TypedUpdate => {
  let type: UpdateType;
  let id: string;
  if (update.message) {
    type = UpdateType.message;
    id = `${update.update_id}_${update.message.chat.id}`;
  } else if (update.edited_message) {
    type = UpdateType.edited_message;
    id = `${update.update_id}_${update.edited_message.chat.id}`;
  } else if (update.channel_post) {
    type = UpdateType.channel_post;
    id = `${update.update_id}_${update.channel_post.chat.id}`;
  } else if (update.edited_channel_post) {
    type = UpdateType.edited_channel_post;
    id = `${update.update_id}_${update.edited_channel_post.chat.id}`;
  } else if (update.inline_query) {
    type = UpdateType.inline_query;
    id = `${update.update_id}_${update.inline_query.id}`;
  } else if (update.chosen_inline_result) {
    type = UpdateType.chosen_inline_result;
    id = `${update.update_id}_${update.chosen_inline_result.result_id}`;
  } else if (update.callback_query) {
    type = UpdateType.callback_query;
    id = `${update.update_id}_${update.callback_query.id}`;
  } else if (update.shipping_query) {
    type = UpdateType.shipping_query;
    id = `${update.update_id}_${update.shipping_query.id}`;
  } else if (update.pre_checkout_query) {
    type = UpdateType.pre_checkout_query;
    id = `${update.update_id}_${update.pre_checkout_query.id}`;
  } else {
    type = UpdateType.unknown;
    id = `unknown_${new Date().getTime()}`;
  }

  return { type, id, ...update };
};

// Define message.type
// save raw
// save aggregation?

export const getUpdates = functions.https.onRequest(async (_, res) => {
  const url =
    'https://api.telegram.org/bot737157367:AAGvCvGCseV0YDKnO-UAkwfIRCATxnhxFXQ/getupdates';
  const opts = {
    allowed_updates: ['message'],
    limit: 100,
  };

  const response = await axios.post(url, opts);
  const updates: Update[] = response.data.result;

  if (!updates.length) {
    logger.info('Info: no updates');
    return res.send();
  }

  const typedUpdates = updates.map(getUpdateWithType);
  const messages = typedUpdates.filter(u => u.type === UpdateType.message);

  console.info('saving raw updates');
  await db.saveRawUpdates(typedUpdates);
  console.info('saving messages');
  await db.saveMessages(messages);

  return res.send();
});
