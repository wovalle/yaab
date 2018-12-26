import { Handler, ICommandHandler } from 'tsmediator';
import Container from 'typedi';

import TelegramService from '../../services/telegram/TelegramService';
import { BotCommands } from '../../selectors';
import I18nProvider from '../../I18nProvider';
import { ParseMode } from '../../services/telegram';
import { PlainMessage, Chat } from '../../models';
import { BaseFirestoreRepository } from '../../fireorm';
import { ChatRepositoryToken } from '../..';
import { addHours } from 'date-fns';
import { Db } from '../../db';
import { UserRole } from '../../types';

interface IListInactivePayload {
  plainMessage: PlainMessage;
}

// TODO: implement custom repositories to implement inactive users
// TODO: send pm summary with users tagged, bots and protected
@Handler(BotCommands.list_inactives)
export class ListInactiveHandler
  implements ICommandHandler<IListInactivePayload, void> {
  private telegramService: TelegramService;
  private i18n: I18nProvider;
  private chatRepository: BaseFirestoreRepository<Chat>;
  private getCurrentDate: () => Date;

  constructor() {
    this.telegramService = Container.get(TelegramService);
    this.i18n = Container.get(I18nProvider);
    this.chatRepository = Container.get(ChatRepositoryToken);
    this.getCurrentDate = Container.get('getCurrentDate');
  }

  async Handle(payload: IListInactivePayload) {
    const pm = payload.plainMessage;
    const commandText = pm.text.split(' ');
    const hours = Number.parseInt(commandText[1]);

    if (commandText.length !== 2 || Number.isNaN(hours)) {
      const errorId = 'commands.errors.invalid';
      await this.telegramService.sendChat(pm.chat_id, this.i18n.t(errorId), {
        reply_to_message_id: pm.message_id,
      });
      return;
    }

    const sinceDate = addHours(this.getCurrentDate(), -hours);

    //TODO: This will be done inside a custom repository but for now, here is it

    const chat = await this.chatRepository.findById(`${pm.chat_id}`);
    const inactiveUsers = await chat.users
      .whereLessOrEqualThan('last_message', sinceDate)
      .find();

    const nullUsers = await chat.users
      .whereEqualTo('last_message', null)
      .find();

    const users = inactiveUsers
      .concat(nullUsers)
      .filter(u => !u.is_bot)
      .filter(u => !u.protected)
      .filter(u => !['kicked', 'left', 'creator'].includes(u.status))
      .filter(u => u.role !== UserRole.admin);

    if (!users.length) {
      const errorId = 'commands.list_inactive.empty';
      await this.telegramService.sendChat(
        pm.chat_id,
        this.i18n.t(errorId, { hours }),
        {
          parse_mode: ParseMode.Markdown,
          reply_to_message_id: pm.message_id,
        }
      );
      return;
    }

    const mentions = users
      .map(u => this.telegramService.getMentionFromId(u.id, u.first_name))
      .join(', ');

    await this.telegramService.sendChat(
      pm.chat_id,
      this.i18n.t('commands.list_inactive.successful', { hours, mentions }),
      { parse_mode: ParseMode.Markdown }
    );
  }

  // tslint:disable-next-line:no-empty
  Validate(payload: IListInactivePayload): void {}
  // tslint:disable-next-line:no-empty
  Log(): void {}
}
