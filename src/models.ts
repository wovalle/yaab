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
  first_name: string;
  last_name?: string;
  username?: string;
  last_message: Date;
  role: UserRole;
  status: UserStatus;
  warnings: []; // TODO: Define model
}
