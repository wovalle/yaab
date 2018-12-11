import { Db } from '../db';
import { ITelegramService } from '../services/telegram';
import { getUserChatFromMember } from '../selectors';
import { ChatUser } from '../models';

interface IUserInteraction {
  id: number;
  firstName: string;
  lastName: string;
  messageCount: number;
  lastMessageOn: Date;
}

export type IFetchInteractionBetweenDatesResponse = {
  users: IUserInteraction[];
  createdUsers: ChatUser[];
};

export default async (
  db: Db,
  service: ITelegramService,
  groupId: Number,
  dateFrom: Date,
  dateTo: Date
): Promise<IFetchInteractionBetweenDatesResponse> => {
  const messages = await db.retreiveMessagesInRange(groupId, dateFrom, dateTo);
  const groupMembers = await db.retreiveUsersFromGroup(groupId);

  const hash = messages.reduce((acc, cur) => {
    acc[cur.from_id] = {
      id: cur.from_id,
      first_name: cur.from_first_name,
      last_name: cur.from_last_name,
      username: cur.from_username,
      messageCount: ((acc[cur.from_id] || {}).messageCount || 0) + 1,
      last_message: cur.date,
    };
    return acc;
  }, {});

  const usersWithMsgsNotInGroup = Object.entries(hash)
    .map(u => Number(u[0]))
    .filter(uid => !groupMembers.find(gmu => gmu.id === uid));

  console.info('Total new users: ', usersWithMsgsNotInGroup);
  console.info('Inserting new users');

  const createdUsers = [];
  for (const uid of usersWithMsgsNotInGroup) {
    const tgUser = await service.getChatMember(uid, groupId);
    const chatUser = getUserChatFromMember(tgUser);
    chatUser.last_message = hash[uid].last_message;
    createdUsers.push(chatUser);
    await db.saveChatUser(groupId, chatUser, new Date());
  }

  const users = groupMembers.map(u => {
    return hash[u.id]
      ? hash[u.id]
      : {
          id: u.id,
          first_name: u.first_name,
          last_name: u.last_name,
          message_count: 0,
          last_message: null,
        };
  });

  return { users, createdUsers };
};
