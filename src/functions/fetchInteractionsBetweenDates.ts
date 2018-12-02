import { Db } from '../db';

interface IFetchInteractionBetweenDatesResponse {
  [key: string]: {
    id: number;
    firstName: string;
    lastName: string;
    messageCount: number;
    lastMessageOn: Date;
  };
}

export default async (
  db: Db,
  groupId: Number,
  dateFrom: Date,
  dateTo: Date
): Promise<IFetchInteractionBetweenDatesResponse> => {
  const messages = await db.retreiveMessagesInRange(groupId, dateFrom, dateTo);
  const users = await db.retreiveUsersFromGroup(groupId);

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

  const usersHash = users.reduce((acc, cur) => {
    if (hash[cur.id]) acc[cur.id] = hash[cur.id];
    else {
      acc[cur.id] = {
        id: cur.id,
        firstName: cur.first_name,
        lastName: cur.last_name,
        messageCount: 0,
        lastMessageOn: null,
      };
    }
    return acc;
  }, {});

  return usersHash;
};
