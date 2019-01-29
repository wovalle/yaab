import { Handler, ICommandHandler } from 'tsmediator';
import Container from 'typedi';

import TelegramService from '../services/telegram/TelegramService';
import { BotCommands } from '../selectors';
import I18nProvider from '../I18nProvider';
import { ParseMode } from '../services/telegram';
import { Chat } from '../models';
import { BaseFirestoreRepository } from 'fireorm';
import { ChatRepositoryToken } from '..';
import { addHours } from 'date-fns';
import { UserRole, ITelegramHandlerPayload } from '../types';

// TODO: send pm summary with users tagged, bots and protected
@Handler(BotCommands.remove_inactives)
export class RemoveInactivesHandler
  implements ICommandHandler<ITelegramHandlerPayload, void> {
  private telegramService: TelegramService;
  private i18n: I18nProvider;
  private getCurrentDate: () => Date;

  constructor() {
    this.telegramService = Container.get(TelegramService);
    this.i18n = Container.get(I18nProvider);
    this.getCurrentDate = Container.get('getCurrentDate');
  }

  async Handle(payload: ITelegramHandlerPayload) {
    const pm = payload.plainMessage;
    const chat = payload.chat;
    const commandText = pm.text.split(' ');
    let hours = Number.parseInt(commandText[1]);
    const isHoursANumber = Number.isInteger(hours);

    if (commandText.length === 2 && !isHoursANumber) {
      const errorId = 'commands.errors.invalid';
      return this.telegramService.sendReply(
        pm.chat_id,
        pm.message_id,
        this.i18n.t(errorId)
      );
    } else if (commandText.length === 1) {
      hours = 5 * 24; // TODO: update capabilities
    }

    const sinceDate = addHours(this.getCurrentDate(), -hours);
    const users = await chat.users.getInactive(sinceDate);

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

    const usersWithError = [];
    for (const u of users) {
      try {
        await this.telegramService.kickUser(
          u.id,
          pm.chat_id,
          addHours(this.getCurrentDate(), 12)
        );

        u.status = 'kicked';
        await chat.users.update(u);
      } catch (error) {
        console.error('Error while kicking user:', error);
        usersWithError.push(u);
      }
    }

    const usersKicked = users.filter(
      u => !usersWithError.some(uwe => uwe.id === u.id)
    );

    const mentions = usersKicked
      .map(u => this.telegramService.getMentionFromId(u.id, u.first_name))
      .join(', ');

    await this.telegramService.sendChat(
      pm.chat_id,
      this.i18n.t('commands.remove_inactives.successful', { mentions }),
      { parse_mode: ParseMode.Markdown }
    );

    return Promise.resolve();
  }
}
