import { Handler, ICommandHandler } from 'tsmediator';
import Container from 'typedi';
import * as faker from 'faker';

import TelegramService from '../services/telegram/TelegramService';
import { BotCommands } from '../selectors';
import I18nProvider from '../I18nProvider';
import { ITelegramHandlerPayload } from '../types';
import { CrushRelationshipRepository, ChatRepository } from '../Repositories';
import { CrushRelationshipRepositoryToken, ChatRepositoryToken } from '..';
import { CrushRelationship } from '../models/CrushRelationship';

@Handler(BotCommands.add_crush)
export class AddCrushHandler
  implements ICommandHandler<ITelegramHandlerPayload, void> {
  private telegramService: TelegramService;
  private i18n: I18nProvider;
  private crushRelationshipRepository: CrushRelationshipRepository;
  private crushGroupId: string;
  private chatRepository: ChatRepository;

  private activators = {
    search: 'crush_search',
    usersFound: 'crush_found',
    cancel: 'cancel',
  };

  constructor() {
    this.telegramService = Container.get(TelegramService);
    this.i18n = Container.get(I18nProvider);
    this.crushRelationshipRepository = Container.get(
      CrushRelationshipRepositoryToken
    );
    this.crushGroupId = Container.get('fixedCrushGroup');
    this.chatRepository = Container.get(ChatRepositoryToken);
  }

  async Handle(payload: ITelegramHandlerPayload) {
    if (payload.command.type === 'bot_command') {
      return this.telegramService
        .buildMessage(this.i18n.t('commands.add_crush.search'))
        .to(payload.plainMessage.chat_id)
        .replyTo(payload.plainMessage.message_id)
        .withActivator(this.activators.search)
        .forceReply()
        .send();
    } else if (payload.command.activator === this.activators.search) {
      const name = payload.plainMessage.text;
      const fixedChat = await this.chatRepository.findById(this.crushGroupId);
      const users = await fixedChat.users.findByName(name);

      if (!users.length) {
        return this.telegramService
          .buildMessage(this.i18n.t('commands.add_crush.not_found', { name }))
          .to(payload.plainMessage.chat_id)
          .withActivator(this.activators.search)
          .replyTo(payload.plainMessage.message_id)
          .forceReply()
          .send();
      }

      const usersKeyboard = users
        .map((u) => ({
          text: u.getFullNameWithUser(),
          callback_data: u.id,
        }))
        .concat({
          text: this.i18n.t('literals.cancel'),
          callback_data: 'cancel',
        });

      return this.telegramService
        .buildMessage(this.i18n.t('commands.add_crush.users_found'))
        .to(payload.plainMessage.chat_id)
        .withActivator(this.activators.usersFound)
        .withKeyboard(usersKeyboard)
        .forceReply()
        .send();
    } else if (payload.command.activator === this.activators.usersFound) {
      await this.telegramService.deleteMessage(
        payload.plainMessage.chat_id,
        payload.plainMessage.message_id
      );

      if (payload.command.callback_data === this.activators.cancel) {
        return Promise.resolve();
      }

      const fixedChat = await this.chatRepository.findById(this.crushGroupId);
      const user = await fixedChat.users.findById(
        payload.command.callback_data
      );

      if (user.crush_status !== 'enabled') {
        const mention = this.telegramService.getMentionFromId(
          user.id,
          user.first_name,
          user.last_name
        );

        await this.telegramService
          .buildMessage(
            this.i18n.t('commands.add_crush.crush_disabled_single', { mention })
          )
          .to(payload.plainMessage.from_id)
          .asMarkDown()
          .send();

        await this.telegramService
          .buildMessage(
            this.i18n.t('commands.add_crush.crush_disabled_group', { mention })
          )
          .to(fixedChat.id)
          .asMarkDown()
          .send();

        await this.telegramService.deleteMessage(
          payload.plainMessage.chat_id,
          payload.plainMessage.message_id
        );

        return Promise.resolve();
      }

      const existingCrushRelationship = await this.crushRelationshipRepository
        .whereEqualTo('chat_id', this.crushGroupId)
        .whereEqualTo('user_id', payload.plainMessage.from_id)
        .whereEqualTo('crush_id', payload.plainMessage.callback_data)
        .find();

      if (existingCrushRelationship.length) {
        const { user_nickname: nick } = existingCrushRelationship[0];
        return this.telegramService
          .buildMessage(this.i18n.t('commands.add_crush.duplicated', { nick }))
          .to(payload.plainMessage.chat_id)
          .send();
      }

      const crushRelationship = new CrushRelationship();
      const nickname = faker.internet.userName();
      crushRelationship.chat_id = this.crushGroupId;
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
