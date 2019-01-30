import { Handler, ICommandHandler } from 'tsmediator';
import Container from 'typedi';
import * as faker from 'faker';

import TelegramService from '../services/telegram/TelegramService';
import { BotCommands } from '../selectors';
import I18nProvider from '../I18nProvider';
import { ITelegramHandlerPayload } from '../types';
import { CrushRelationshipRepository } from '../Repositories';
import { CrushRelationshipRepositoryToken } from '..';
import { CrushRelationship } from '../models/CrushRelationship';

@Handler(BotCommands.add_crush)
export class AddCrushHandler
  implements ICommandHandler<ITelegramHandlerPayload, void> {
  private telegramService: TelegramService;
  private i18n: I18nProvider;
  private crushRelationshipRepository: CrushRelationshipRepository;

  private activators = {
    search: 'crush_search',
    usersFound: 'crush_found',
  };

  constructor() {
    this.telegramService = Container.get(TelegramService);
    this.i18n = Container.get(I18nProvider);
    this.crushRelationshipRepository = Container.get(
      CrushRelationshipRepositoryToken
    );
  }

  async Handle(payload: ITelegramHandlerPayload) {
    if (payload.command.type === 'bot_command') {
      return this.telegramService
        .buildMessage(this.i18n.t('commands.addcrush.search'))
        .to(payload.plainMessage.chat_id)
        .replyTo(payload.plainMessage.message_id)
        .withActivator(this.activators.search)
        .forceReply()
        .send();
    } else if (payload.command.activator === this.activators.search) {
      // TODO: constant group id
      const { chat } = payload;

      const users = await chat.users.findByName(payload.plainMessage.text);

      if (!users.length) {
        return this.telegramService
          .buildMessage(this.i18n.t('commands.add_crush.not_found'))
          .to(payload.plainMessage.chat_id)
          .withActivator(this.activators.search)
          .replyTo(payload.plainMessage.message_id)
          .forceReply()
          .send();
      }

      const usersKeyboard = users.map(u => {
        let text = u.first_name;
        text = u.last_name ? `${text} ${u.last_name}` : '';
        text = u.username ? `${text} (${u.username})` : '';
        return { text, callback_data: u.id };
      });

      return this.telegramService
        .buildMessage(this.i18n.t('commands.add_crush.users_found'))
        .to(payload.plainMessage.chat_id)
        .withActivator(this.activators.usersFound)
        .withKeyboard(usersKeyboard)
        .forceReply()
        .send();
    } else if (payload.command.activator === this.activators.usersFound) {
      const chat = await payload.chat;
      const user = await chat.users.findById(payload.command.callback_data);

      if (user.crush_status === 'disabled') {
        // TODO: build getter
        let name = user.first_name;
        name = user.last_name ? name.concat(` ${user.last_name}`) : name;

        return this.telegramService
          .buildMessage(this.i18n.t('commands.add_crush.invalid', { name }))
          .to(payload.plainMessage.chat_id)
          .send();
      }

      const existingCrushRelationship = await this.crushRelationshipRepository
        .whereEqualTo('chat_id', payload.plainMessage.chat_id)
        .whereEqualTo('user_id', payload.plainMessage.from_id)
        .whereEqualTo('crush_id', payload.plainMessage.callback_data)
        .find();

      if (existingCrushRelationship.length) {
        return this.telegramService
          .buildMessage(this.i18n.t('commands.add_crush.duplicated'))
          .to(payload.plainMessage.chat_id)
          .send();
      }

      const crushRelationship = new CrushRelationship();
      const nickname = faker.internet.userName();
      crushRelationship.chat_id = payload.plainMessage.chat_id;
      crushRelationship.user_id = payload.plainMessage.from_id;
      crushRelationship.crush_id = payload.plainMessage.callback_data;
      crushRelationship.user_nickname = nickname;

      await this.crushRelationshipRepository.create(crushRelationship);

      await this.telegramService
        .buildMessage(
          this.i18n.t('commands.add_crush.successful', { nickname })
        )
        .to(payload.plainMessage.chat_id)
        .send();

      await this.telegramService
        .buildMessage(this.i18n.t('commands.add_crush.new_crush', { nickname }))
        .to(payload.plainMessage.callback_data)
        .send();
      return Promise.resolve();
    }

    return Promise.reject('Invalid Path');
  }
}
