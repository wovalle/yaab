// NOTE: This is not intended to be an external function
import { Db } from '../db.js';
import { ChatMember } from '../models/index.js';

export default async (
  db: Db,
  groupId: Number,
  users: ChatMember[]
): Promise<void> => {
  await db.insertUsersInGroup(users, groupId);
};
