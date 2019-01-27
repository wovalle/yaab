import { Handler, ICommandHandler } from 'tsmediator';
import Container from 'typedi';

import TelegramService from '../services/telegram/TelegramService';
import { BotCommands } from '../selectors';
import I18nProvider from '../I18nProvider';
import { ParseMode } from '../services/telegram';
import { ChatRepositoryToken } from '..';
import { addHours } from 'date-fns';
import { ITelegramHandlerPayload } from '../types';
import { ChatRepository } from '../Repositories';

// TODO: send pm summary with users tagged, bots and protected
@Handler(BotCommands.list_inactives)
export class ListInactiveHandler
  implements ICommandHandler<ITelegramHandlerPayload, void> {
  private telegramService: TelegramService;
  private i18n: I18nProvider;
  private chatRepository: ChatRepository;
  private getCurrentDate: () => Date;

  constructor() {
    this.telegramService = Container.get(TelegramService);
    this.i18n = Container.get(I18nProvider);
    this.chatRepository = Container.get(ChatRepositoryToken);
    this.getCurrentDate = Container.get('getCurrentDate');
  }

  async Handle(payload: ITelegramHandlerPayload) {
    const pm = payload.plainMessage;
    const commandText = pm.text.split(' ');
    let hours = Number.parseInt(commandText[1]);
    const isHoursANumber = Number.isInteger(hours);

    if (commandText.length === 2 && !isHoursANumber) {
      const errorId = 'commands.errors.invalid';
      return this.telegramService.sendChat(pm.chat_id, this.i18n.t(errorId), {
        reply_to_message_id: pm.message_id,
      });
    } else if (commandText.length === 1) {
      hours = 5 * 24; // TODO: update capabilities
    }

    const inactiveSince = addHours(this.getCurrentDate(), -hours);
    const chat = await this.chatRepository.findById(`${pm.chat_id}`);
    const users = await chat.users.getInactive(inactiveSince);

    if (!users.length) {
      const errorId = 'commands.list_inactive.empty';
      return this.telegramService.sendChat(
        pm.chat_id,
        this.i18n.t(errorId, { hours }),
        {
          parse_mode: ParseMode.Markdown,
          reply_to_message_id: pm.message_id,
        }
      );
    }

    const mentions = users
      .map(u => this.telegramService.getMentionFromId(u.id, u.first_name))
      .join(', ');

    return this.telegramService.sendChat(
      pm.chat_id,
      this.i18n.t('commands.list_inactive.successful', { hours, mentions }),
      { parse_mode: ParseMode.Markdown }
    );
  }
}
