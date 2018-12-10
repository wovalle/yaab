export enum Role {
  user = 'user',
  admin = 'admin',
}

export interface ChatUser {
  id: Number;
  first_name: string;
  last_name?: string;
  username?: string;
  last_message: Date;
  role: Role;
  warnings: []; // TODO: Define model
}
