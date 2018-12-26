import { Message, User, ChatMember } from 'telegram-typings';

export enum ParseMode {
  Markdown = 'Markdown',
  HTML = 'HTML',
}

export interface ISendMessageOpts {
  parse_mode?: ParseMode;
  reply_to_message_id?: Number;
}

export interface ITelegramService {
  sendChat(
    chatId: Number,
    message: string,
    opts?: ISendMessageOpts
  ): Promise<Message>;
  kickUser(userId: Number | string, chatId: Number, until: Date): Promise<void>;
  getChatMember(userId: Number | string, chatId: Number): Promise<ChatMember>;
  getMentionFromId(
    id: Number | string,
    name: string,
    lastName?: string
  ): string;
}
