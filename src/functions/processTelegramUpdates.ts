import { Db } from '../db';
import { Logger } from '../logger';
import axios from 'axios'; //TODO: IHttp

import { Update } from 'telegram-typings';
import { TypedUpdate, UpdateType } from '../types';
import { getUpdateWithType, getPlainMessage } from '../selectors';

export default async (
  db: Db,
  logger: Logger,
  serviceUrl: string
): Promise<Array<TypedUpdate>> => {
  const currentOffset = await db.getOffset();

  const opts = {
    allowed_updates: ['message'],
    limit: 100,
    offset: currentOffset.val,
  };

  const response = await axios.post(serviceUrl, opts);
  const updates: Update[] = response.data.result;

  if (!updates.length) {
    logger.info('Info: no updates.');
    return [];
  }

  logger.info(`Info: Processing ${updates.length} updates`);
  const typedUpdates = updates.map(getUpdateWithType);
  const plainMessages = typedUpdates
    .filter(u => u.type === UpdateType.message)
    .map(getPlainMessage);

  logger.info('Info: saving raw updates');
  await db.saveRawUpdates(typedUpdates);
  logger.info('Info: saving messages');
  await db.saveMessages(plainMessages);

  return typedUpdates;
};
