// NOTE: This is not intended to be an external function
import { ChatMember } from '../models/index';
import Container from 'typedi';
import { ChatRepositoryToken } from '../index';
import { getUserChat } from '../selectors';

interface IImportUsers {
  existingUsers: Array<ChatMember>;
  importedUsers: Array<ChatMember>;
}

export default async (
  groupId: Number,
  users: ChatMember[]
): Promise<IImportUsers> => {
  if (!users.length) return null;

  const chatRepository = Container.get(ChatRepositoryToken);

  const group = await chatRepository.findById(`${groupId}`);

  if (!group) {
    return Promise.reject(new Error('Invalid group'));
  }

  const existingUsers = [];
  const importedUsers = [];

  for (const userToImport of users) {
    const user = await group.users.findById(`${userToImport.id}`);

    if (user) {
      console.log(
        `User ${user.id}: ${user.first_name} ${user.last_name} not imported`
      );
      existingUsers.push(user);
    } else {
      const fullUser = getUserChat({
        ...userToImport,
      });

      await group.users.create(fullUser);
      console.log(
        `User ${userToImport.id}: ${userToImport.first_name} ${
          userToImport.last_name
        } imported`
      );
      importedUsers.push(userToImport);
    }
  }

  return { existingUsers, importedUsers };
};
