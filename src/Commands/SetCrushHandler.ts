import { Handler, ICommandHandler } from 'tsmediator';
import Container from 'typedi';

import TelegramService from '../services/telegram/TelegramService';
import { BotCommands } from '../selectors';
import I18nProvider from '../I18nProvider';
import { ITelegramHandlerPayload } from '../types';
import { ChatRepository } from '../Repositories';
import { ChatRepositoryToken } from '..';

@Handler(BotCommands.enable_crush_mode)
@Handler(BotCommands.disable_crush_mode)
export class SetCrushHandler
  implements ICommandHandler<ITelegramHandlerPayload, void> {
  private telegramService: TelegramService;
  private i18n: I18nProvider;
  private chatRepository: ChatRepository;
  private crushGroupId: string;

  constructor() {
    this.telegramService = Container.get(TelegramService);
    this.i18n = Container.get(I18nProvider);
    this.chatRepository = Container.get(ChatRepositoryToken);
    this.crushGroupId = Container.get('fixedCrushGroup');
  }

  async Handle(payload: ITelegramHandlerPayload) {
    const { command, messageFrom } = payload;

    const newStatus =
      command.details.key === BotCommands.enable_crush_mode
        ? 'enabled'
        : 'blocked';

    const fixedChat = await this.chatRepository.findById(this.crushGroupId);
    const user = await fixedChat.users.findById(messageFrom.id);

    user.crush_status = newStatus;

    await fixedChat.users.update(user);

    return this.telegramService
      .buildMessage(this.i18n.t(`commands.set_crush_mode.${newStatus}`))
      .to(messageFrom.id)
      .send();
  }
}
