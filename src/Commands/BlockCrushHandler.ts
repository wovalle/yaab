import { Handler, ICommandHandler } from 'tsmediator';
import Container from 'typedi';

import TelegramService from '../services/telegram/TelegramService';
import { BotCommands, getUserChatFromMember } from '../selectors';
import I18nProvider from '../I18nProvider';
import { ITelegramHandlerPayload } from '../types';
import { CrushRelationshipRepositoryToken } from '..';
import { CrushRelationshipRepository } from '../Repositories';

@Handler(BotCommands.block_crush)
export class BlockCrushHandler
  implements ICommandHandler<ITelegramHandlerPayload, void> {
  private telegramService: TelegramService;
  private i18n: I18nProvider;
  private crushRelationshipRepository: CrushRelationshipRepository;

  private activators = {
    pickUser: 'p',
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
    const { plainMessage: pm, chat, command } = payload;

    if (command.activator === this.activators.pickUser) {
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

      relationship.crush_status = 'blocked';
      await this.crushRelationshipRepository.update(relationship);

      return this.telegramService
        .buildMessage(this.i18n.t('commands.block_crush.done'))
        .to(pm.chat_id)
        .send();
    }

    const [myCrushes, crushesOfMine] = await Promise.all([
      this.crushRelationshipRepository.getMyCrushes(pm.from_id),
      this.crushRelationshipRepository.getCrushesOfMine(pm.from_id),
    ]);

    const myCrushesDetails = await Promise.all(
      myCrushes.map(c =>
        this.telegramService.getChatMember(c.crush_id, c.chat_id)
      )
    );

    const myCrushesKeyboard = myCrushesDetails.map(({ user: u }) => {
      let text = u.first_name;
      text = u.username ? `${text} (${u.username})` : text;

      const crush = myCrushes.find(c => c.crush_id === `${u.id}`);
      const callback_data = `${crush.user_nickname}|${crush.crush_id}`;

      return { text, callback_data };
    });

    const crushesOfMineKeyboard = crushesOfMine.map(u => {
      const text = u.user_nickname;
      const callback_data = `${text}|${u.user_id}`;
      return { text, callback_data };
    });

    const usersKeyboard = [
      ...myCrushesKeyboard,
      ...crushesOfMineKeyboard,
    ].concat({
      text: this.i18n.t('literals.cancel'),
      callback_data: 'cancel',
    });

    return this.telegramService
      .buildMessage(this.i18n.t('commands.block_crush.list'))
      .to(pm.chat_id)
      .withActivator(this.activators.pickUser)
      .withKeyboard(usersKeyboard)
      .forceReply()
      .send();
  }
}
