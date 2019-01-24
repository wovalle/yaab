import { BaseFirestoreRepository, CustomRepository } from 'fireorm';
import { ChatMember } from '../models/ChatMember';
import { UserRole } from '../types';
import { IChatMemberSubCollection as IChatMemberRepository } from '../models';

@CustomRepository(ChatMember)
class ChatMemberRepository extends BaseFirestoreRepository<ChatMember>
  implements IChatMemberRepository {
  async getInactive(since: Date): Promise<ChatMember[]> {
    const inactiveUsers = await this.whereLessOrEqualThan(
      'last_message',
      since
    ).find();

    const nullUsers = await this.whereEqualTo('last_message', null).find();

    return inactiveUsers
      .concat(nullUsers)
      .filter(u => !u.is_bot)
      .filter(u => !u.protected)
      .filter(u => !['kicked', 'left', 'creator'].includes(u.status))
      .filter(u => u.role !== UserRole.admin);
  }
}

export default ChatMemberRepository;
