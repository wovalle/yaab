// NOTE: This is not intended to be an external function
import { Db } from '../db.js';
import { ChatUser } from '../models.js';

export default async (
  db: Db,
  groupId: Number,
  users: ChatUser[]
): Promise<void> => {
  await db.insertUsersInGroup(users, groupId);
};
