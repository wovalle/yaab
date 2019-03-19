import { Handler, ICommandHandler } from 'tsmediator';
import Container from 'typedi';

import TelegramService from '../services/telegram/TelegramService';
import { BotCommands } from '../selectors';
import I18nProvider from '../I18nProvider';
import { ITelegramHandlerPayload } from '../types';
import { ChatRepository } from '../Repositories';
import { ChatRepositoryToken } from '..';

@Handler(BotCommands.start)
export class StartHandler
  implements ICommandHandler<ITelegramHandlerPayload, void> {
  private telegramService: TelegramService;
  private i18n: I18nProvider;
  private crushGroupId: string;
  private chatRepository: ChatRepository;

  constructor() {
    this.telegramService = Container.get(TelegramService);
    this.i18n = Container.get(I18nProvider);
    this.crushGroupId = Container.get('fixedCrushGroup');
    this.chatRepository = Container.get(ChatRepositoryToken);
  }

  async Handle(payload: ITelegramHandlerPayload) {
    const fixedChat = await this.chatRepository.findById(this.crushGroupId);
    const userFromChat = await fixedChat.users.findById(payload.messageFrom.id);

    if (!userFromChat) {
      await this.telegramService
        .buildMessage(this.i18n.t('commands.start.user_not_found'))
        .to(payload.plainMessage.chat_id)
        .asMarkDown()
        .send();

      return Promise.resolve();
    }

    userFromChat.crush_status = 'enabled';

    await fixedChat.users.update(userFromChat);

    return this.telegramService
      .buildMessage(this.i18n.t('commands.start.successful'))
      .to(payload.plainMessage.chat_id)
      .asMarkDown()
      .send();
  }
}
