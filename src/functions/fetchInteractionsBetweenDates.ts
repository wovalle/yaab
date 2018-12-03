import { Db } from '../db';
interface IUserInteraction {
  id: number;
  firstName: string;
  lastName: string;
  messageCount: number;
  lastMessageOn: Date;
}

export type IFetchInteractionBetweenDatesResponse = IUserInteraction[];

export default async (
  db: Db,
  groupId: Number,
  dateFrom: Date,
  dateTo: Date
): Promise<IFetchInteractionBetweenDatesResponse> => {
  const messages = await db.retreiveMessagesInRange(groupId, dateFrom, dateTo);
  const groupMembers = await db.retreiveUsersFromGroup(groupId);

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

  const users = groupMembers.map(u => {
    return hash[u.id]
      ? hash[u.id]
      : {
          id: u.id,
          firstName: u.first_name,
          lastName: u.last_name,
          messageCount: 0,
          lastMessageOn: null,
        };
  });

  return users;
};
