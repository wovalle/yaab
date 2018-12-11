export enum UserRole {
  user = 'user',
  admin = 'admin',
}

export enum UserStatus {
  active = 'active',
  unsaved = 'unsaved',
}

export interface ChatUser {
  id: Number;
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
