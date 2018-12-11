import { Db } from '../db';
import { ChatUser } from '../models';
import { addHours } from 'date-fns';

export type IFetchInactiveUsersWithinTimeframeResponse = {
  count: Number;
  users: ChatUser[];
};

export default async (
  db: Db,
  groupId: Number,
  hours: Number,
  currentDate: Date
): Promise<IFetchInactiveUsersWithinTimeframeResponse> => {
  const sinceDate = addHours(currentDate, -hours);
  const users = await db.getInactiveUsers(groupId, sinceDate);
  return { count: users.length, users };
};
