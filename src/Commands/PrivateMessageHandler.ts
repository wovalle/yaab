import { Handler, ICommandHandler } from 'tsmediator';
import Container from 'typedi';

import TelegramService from '../services/telegram/TelegramService';
import { BotCommands } from '../selectors';
import I18nProvider from '../I18nProvider';
import { ITelegramHandlerPayload } from '../types';
import { CrushRelationshipRepository } from '../Repositories';
import { CrushRelationshipRepositoryToken } from '..';
import { CrushRelationship } from '../models';

@Handler(BotCommands.private_message)
export class PrivateMessageHandler
  implements ICommandHandler<ITelegramHandlerPayload, void> {
  private telegramService: TelegramService;
  private i18n: I18nProvider;
  private crushRelationshipRepository: CrushRelationshipRepository;

  private activators = {
    pickUser: 'pick_user',
  };

  constructor() {
    this.telegramService = Container.get(TelegramService);
    this.i18n = Container.get(I18nProvider);
    this.crushRelationshipRepository = Container.get(
      CrushRelationshipRepositoryToken
    );
  }

  async Handle(payload: ITelegramHandlerPayload) {
    const { plainMessage: pm, command } = payload;

    if (command.activator === this.activators.pickUser) {
      const [crush_id, user_nickname] = pm.callback_data.split('|');
      await this.sendMessage(pm.reply_text, crush_id, user_nickname);
      await this.telegramService.deleteMessage(pm.chat_id, pm.message_id);
      return;
    }
    // if is reply
    const crushes = await this.crushRelationshipRepository
      .whereEqualTo('user_id', pm.from_id)
      .find();

    // if 1 crush, just send msg
    const users = await Promise.all(
      crushes.map(c =>
        this.telegramService.getChatMember(c.crush_id, c.chat_id)
      )
    );

    const usersKeyboard = users.map(({ user: u }) => {
      let text = u.first_name;
      text = u.last_name ? `${text} ${u.last_name}` : '';
      text = u.username ? `${text} (${u.username})` : '';

      const crush = crushes.find(c => c.crush_id === `${u.id}`);
      const callback_data = `${crush.crush_id}|${crush.user_nickname}`;

      return { text, callback_data };
    });

    this.telegramService
      .buildMessage('commands.anon_message.pick_user')
      .to(pm.chat_id)
      .replyTo(pm.message_id)
      .withActivator(this.activators.pickUser)
      .withKeyboard(usersKeyboard)
      .send();
  }

  async sendMessage(text: string, to: string, user: string) {
    return this.telegramService
      .buildMessage(text)
      .to(to)
      .prepend(this.i18n.t('commands.anon_message.user_says', { user }))
      .send();
  }
}
