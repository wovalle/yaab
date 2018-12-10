import { Message } from 'telegram-typings';

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
  kickUser(userId: Number, chatId: Number, until: Date): Promise<void>;
  getMentionFromId(id: Number, name: string): string;
}
