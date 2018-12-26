import { Db } from '../db';
import { ChatMember } from '../models';
import { addHours } from 'date-fns';

export type IFetchInactiveUsersWithinTimeframeResponse = {
  count: Number;
  users: ChatMember[];
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
