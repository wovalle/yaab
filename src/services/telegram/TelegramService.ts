import { ITelegramService, ISendMessageOpts } from './ITelegramService';
import { Message, ChatMember } from 'telegram-typings';
import { getUnixTimeFromDate } from '../../utils';
import { IHttp } from '../../Http';

export default class TelegramService implements ITelegramService {
  constructor(private key: string, private http: IHttp) {}

  private buildUrl = (method: string) =>
    `https://api.telegram.org/bot${this.key}/${method}`;

  async sendChat(
    chatId: Number,
    message: string,
    opts?: ISendMessageOpts
  ): Promise<Message> {
    const url = this.buildUrl('sendMessage');
    const payload = {
      chat_id: chatId,
      text: message,
      ...opts,
    };

    const response = await this.http.post(url, payload);
    return response.result as Message;
  }

  async kickUser(
    userId: Number | string,
    chatId: Number,
    until: Date
  ): Promise<void> {
    const url = this.buildUrl('kickChatMember');
    const payload = {
      chat_id: chatId,
      user_id: userId,
      until_date: getUnixTimeFromDate(until),
    };

    await this.http.post(url, payload);
  }

  async getChatMember(
    userId: Number | string,
    chatId: Number
  ): Promise<ChatMember> {
    const url = this.buildUrl('getChatMember');
    const payload = {
      chat_id: chatId,
      user_id: userId,
    };

    const response = await this.http.post(url, payload);
    return response.result as ChatMember;
  }

  getMentionFromId(id: Number | string, name: string, lastName?: string) {
    const fullName = [name, lastName].join(' ');
    return `[${fullName}](tg://user?id=${id})`;
  }
}
