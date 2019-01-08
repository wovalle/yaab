import { Handler, ICommandHandler } from 'tsmediator';
import Container from 'typedi';

import TelegramService from '../services/telegram/TelegramService';
import { BotCommands } from '../selectors';
import I18nProvider from '../I18nProvider';
import { ParseMode } from '../services/telegram';
import { Chat } from '../models';
import { BaseFirestoreRepository } from '../fireorm';
import { ChatRepositoryToken } from '..';
import { ITelegramHandlerPayload } from '../types';

// TODO: send pm summary with users tagged, bots and protected
@Handler(BotCommands.list_protected)
export class ListProtectedHandler
  implements ICommandHandler<ITelegramHandlerPayload, void> {
  private telegramService: TelegramService;
  private i18n: I18nProvider;
  private chatRepository: BaseFirestoreRepository<Chat>;

  constructor() {
    this.telegramService = Container.get(TelegramService);
    this.i18n = Container.get(I18nProvider);
    this.chatRepository = Container.get(ChatRepositoryToken);
  }

  async Handle(payload: ITelegramHandlerPayload) {
    const pm = payload.plainMessage;

    const chat = await this.chatRepository.findById(`${pm.chat_id}`);
    const users = await chat.users.whereEqualTo('protected', true).find();

    const mentions = users
      .map(u =>
        this.telegramService.getMentionFromId(u.id, u.first_name, u.last_name)
      )
      .join(', ');

    await this.telegramService.sendChat(
      pm.chat_id,
      this.i18n.t('commands.list_protected.successful', { mentions }),
      { parse_mode: ParseMode.Markdown }
    );
  }
}
