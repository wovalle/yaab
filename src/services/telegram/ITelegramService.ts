import { Message, ChatMember } from 'telegram-typings';

export enum ParseMode {
  Markdown = 'Markdown',
  HTML = 'HTML',
}

export type IReplyKeyboardOptions = {
  text: string;
  callback_data: string;
};
export interface ISendMessageOpts {
  parse_mode?: ParseMode;
  reply_to_message_id?: string;
  force_reply?: boolean;
  keyboard?: [IReplyKeyboardOptions[]];
}

export interface ITelegramService {
  sendChat(
    chatId: string,
    message: string,
    opts?: ISendMessageOpts
  ): Promise<Message>;
  sendReply(
    chatId: string,
    replyMessageId: string,
    message: string,
    opts?: ISendMessageOpts
  );
  kickUser(userId: string, chatId: string, until: Date): Promise<void>;
  getChatMember(userId: string, chatId: string): Promise<ChatMember>;
  getMentionFromId(id: string, name: string, lastName?: string): string;
  sendReplyKeyboard(
    chatId: string,
    message: string,
    options: IReplyKeyboardOptions[],
    opts?: ISendMessageOpts
  );
}
