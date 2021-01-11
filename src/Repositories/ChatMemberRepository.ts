import { BaseFirestoreRepository, CustomRepository } from "fireorm";
import { ChatMember } from "../models/ChatMember";
import { UserRole } from "../types";
import { IChatMemberSubCollection as IChatMemberRepository } from "../models";

@CustomRepository(ChatMember)
class ChatMemberRepository
  extends BaseFirestoreRepository<ChatMember>
  implements IChatMemberRepository {
  async getInactive(since: Date): Promise<ChatMember[]> {
    const inactiveUsers = await this.whereLessOrEqualThan(
      "last_message",
      since
    ).find();

    const nullUsers = await this.whereEqualTo("last_message", null).find();

    return inactiveUsers
      .concat(nullUsers)
      .filter((u) => !u.is_bot)
      .filter((u) => !u.protected)
      .filter((u) => !["kicked", "left", "creator"].includes(u.status))
      .filter((u) => u.role !== UserRole.admin);
  }

  async findByName(name: string): Promise<ChatMember[]> {
    if (!name) {
      return Promise.resolve([]);
    }

    const keywords = name.trim().toLowerCase().split(" ");

    const promises = keywords.map((k) =>
      this.whereArrayContains("search_keywords", k).find()
    );

    return Promise.all(promises).then((p) =>
      p.reduce((cur, acc) => cur.concat(acc), [])
    );
  }

  async findByUsername(username: string): Promise<ChatMember> {
    const users = await this.whereEqualTo("username", username).find();
    return users.length ? users[0] : null;
  }

  async updateStat(user: ChatMember, currentDate: Date) {
    user.last_message = currentDate;
    user.status = "active";
    return this.update(user);
  }
}

export default ChatMemberRepository;
