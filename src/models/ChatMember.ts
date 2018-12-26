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
  protected?: boolean;
  warnings: []; // TODO: Define model
}
