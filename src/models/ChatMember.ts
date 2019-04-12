import { UserRole } from '../types';

export class ChatMember {
  id: string;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  last_message: Date;
  role: UserRole;
  status: string; // “creator”, “administrator”, “member”, “restricted”, “left” or “kicked”
  protected: boolean;
  crush_status: 'enabled' | 'disabled' | 'blocked';
  search_keywords: string[];

  getFullName() {
    return this.last_name
      ? `${this.first_name} ${this.last_name}`
      : this.first_name;
  }

  getFullNameWithUser() {
    return this.username
      ? `${this.getFullName()} (${this.username})`
      : this.getFullName();
  }
}
