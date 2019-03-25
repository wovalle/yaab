import { Handler, ICommandHandler } from 'tsmediator';
import Container from 'typedi';

import TelegramService from '../services/telegram/TelegramService';
import { BotCommands } from '../selectors';
import I18nProvider from '../I18nProvider';
import { ITelegramHandlerPayload } from '../types';
import { CrushRelationshipRepositoryToken } from '..';
import { CrushRelationshipRepository } from '../Repositories';

@Handler(BotCommands.block_crush)
@Handler(BotCommands.unblock_crush)
export class BlockCrushHandler
  implements ICommandHandler<ITelegramHandlerPayload, void> {
  private telegramService: TelegramService;
  private i18n: I18nProvider;
  private crushRelationshipRepository: CrushRelationshipRepository;

  private activators = {
    blockUser: 'bp',
    unblockUser: 'up',
    cancel: 'cancel',
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
    const commandKey = command.details.key;

    if (
      [this.activators.blockUser, this.activators.unblockUser].includes(
        command.activator
      )
    ) {
      await this.telegramService.deleteMessage(pm.chat_id, pm.message_id);

      if (command.callback_data === this.activators.cancel) {
        return Promise.resolve();
      }

      const [nick] = command.callback_data.split('|');

      const relationship = await this.crushRelationshipRepository.getByNick(
        nick
      );

      if (!relationship) {
        throw new Error('Could not find crush');
      }

      relationship.crush_status =
        commandKey === BotCommands.block_crush ? 'blocked' : 'active';

      await this.crushRelationshipRepository.update(relationship);

      return this.telegramService
        .buildMessage(this.i18n.t(`commands.${commandKey}.done`))
        .to(pm.chat_id)
        .send();
    }

    const status =
      commandKey === BotCommands.block_crush ? 'active' : 'blocked';

    const crushers = await this.crushRelationshipRepository.getCrushesOfMine(
      pm.from_id,
      status
    );

    const crushesOfMineKeyboard = crushers.map(u => {
      const text = u.user_nickname;
      const callback_data = `${text}|${u.user_id}`;
      return { text, callback_data };
    });

    const usersKeyboard = [...crushesOfMineKeyboard].concat({
      text: this.i18n.t('literals.cancel'),
      callback_data: 'cancel',
    });

    const activator =
      commandKey === BotCommands.block_crush
        ? this.activators.blockUser
        : this.activators.unblockUser;

    return this.telegramService
      .buildMessage(this.i18n.t(`commands.${commandKey}.list`))
      .to(pm.chat_id)
      .withActivator(activator)
      .withKeyboard(usersKeyboard)
      .forceReply()
      .send();
  }
}
