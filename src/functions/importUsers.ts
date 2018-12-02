// NOTE: This is not intended to be an external function
import { User } from 'telegram-typings';
import { Db } from '../db.js';

export default async (
  db: Db,
  groupId: Number,
  users: User[]
): Promise<void> => {
  await db.insertUsersInGroup(users, groupId);
};
