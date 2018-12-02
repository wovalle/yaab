import { Db } from '../db';

interface IFetchMessagesByDateResponse {
  messageCount: number;
  usersCount: number;
  detail: {
    [key: string]: {
      id: number;
      firstName: string;
      lastName: string;
      messageCount: number;
      lastMessageOn: Date;
    };
  };
}

export default async (
  db: Db,
  groupId: Number,
  dateFrom: Date,
  dateTo: Date
): Promise<IFetchMessagesByDateResponse> => {
  const messages = await db.retreiveMessagesInRange(groupId, dateFrom, dateTo);

  const hash = messages.reduce((acc, cur) => {
    acc[cur.from_id] = {
      id: cur.from_id,
      firstName: cur.from_first_name,
      lastName: cur.from_last_name,
      messageCount: ((acc[cur.from_id] || {}).messageCount || 0) + 1,
      lastMessageOn: cur.date,
    };
    return acc;
  }, {});

  return {
    messageCount: messages.length,
    usersCount: Object.keys(hash).length,
    detail: hash,
  };
};
