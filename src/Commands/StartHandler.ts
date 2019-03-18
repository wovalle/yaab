import { Handler, ICommandHandler } from 'tsmediator';
import Container from 'typedi';

import TelegramService from '../services/telegram/TelegramService';
import { BotCommands } from '../selectors';
import I18nProvider from '../I18nProvider';
import { ParseMode } from '../services/telegram';
import { ITelegramHandlerPayload } from '../types';
import { ChatRepository } from '../Repositories';
import { ChatRepositoryToken } from '..';

@Handler(BotCommands.start)
export class StartHandler
  implements ICommandHandler<ITelegramHandlerPayload, void> {
  private telegramService: TelegramService;
  private i18n: I18nProvider;
  private chatRepository: ChatRepository;

  constructor() {
    this.telegramService = Container.get(TelegramService);
    this.i18n = Container.get(I18nProvider);
    this.chatRepository = Container.get(ChatRepositoryToken);
  }

  async Handle(payload: ITelegramHandlerPayload) {
    const { userFrom } = payload;

    userFrom.crush_status = 'enabled';
    await this.chatRepository.update(userFrom);

    return this.telegramService.sendChat(
      payload.plainMessage.chat_id,
      this.i18n.t('commands.start.successful'),
      {
        parse_mode: ParseMode.Markdown,
      }
    );
  }
}
