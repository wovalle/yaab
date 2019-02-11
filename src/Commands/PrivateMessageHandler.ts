import { Handler, ICommandHandler } from 'tsmediator';
import Container from 'typedi';

import TelegramService from '../services/telegram/TelegramService';
import { BotCommands } from '../selectors';
import I18nProvider from '../I18nProvider';
import { ITelegramHandlerPayload } from '../types';
import { CrushRelationshipRepository } from '../Repositories';
import { CrushRelationshipRepositoryToken } from '..';

@Handler(BotCommands.private_message)
export class PrivateMessageHandler
  implements ICommandHandler<ITelegramHandlerPayload, void> {
  private telegramService: TelegramService;
  private i18n: I18nProvider;
  private crushRelationshipRepository: CrushRelationshipRepository;

  private activators = {
    pickUser: 'pick_user',
    replyFromCrush: 'rfc',
    replyToCrush: 'rtc',
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
    // if 1 crush, just send msg
    // is_reply

    /*
      on writing check crushes and the people who I'm crush of
      present the list
      when writing crushes, |tc| Crush say:
      when responding |fc| Fulanito(tg://234234) says:
    */

    if (command.activator === this.activators.pickUser) {
      const [crush_id, user_nickname] = pm.callback_data.split('|');
      await this.sendMessage(pm.reply_text, crush_id, user_nickname);
      await this.telegramService.deleteMessage(pm.chat_id, pm.message_id);
      return Promise.resolve();
    }

    if (command.activator === this.activators.replyFromCrush) {
      const nickname = pm.reply_text.split(' ')[1].slice(0, -1);
      const crushRelationship = await this.crushRelationshipRepository
        .whereEqualTo('user_nickname', nickname)
        .find();

      const { user_id: userId } = crushRelationship[0];
      const mention = this.telegramService.getMentionFromId(
        pm.from_id,
        pm.from_first_name,
        pm.from_last_name
      );

      const sanitized = [`\\[`, `\\]`, '`', '_', '\\*'].reduce(
        (acc, cur) => acc.replace(new RegExp(cur, 'ig'), ''),
        pm.text
      );

      return this.telegramService
        .buildMessage(sanitized)
        .to(userId)
        .prepend(
          this.i18n.t('commands.anon_message.crush_says', { mention, nickname })
        )
        .withActivator(this.activators.replyToCrush)
        .asMarkDown()
        .send();
    }

    if (command.activator === this.activators.replyToCrush) {
      const nick = /{(.*?)}/.exec(pm.reply_text)[1];

      if (!nick) {
        return Promise.reject(new Error('Invalid Username'));
      }

      const crushRelationship = await this.crushRelationshipRepository
        .whereEqualTo('user_nickname', nick)
        .find();

      if (!crushRelationship) {
        return Promise.reject(new Error('Invalid Relationship'));
      }

      await this.sendMessage(pm.text, crushRelationship[0].crush_id, nick);
      return Promise.resolve();
    }

    const myCrushes = await this.crushRelationshipRepository
      .whereEqualTo('user_id', pm.from_id)
      .find();

    const crushesOfMine = await this.crushRelationshipRepository
      .whereEqualTo('crush_id', pm.from_id)
      .find();

    const myCrushesDetails = await Promise.all(
      myCrushes.map(c =>
        this.telegramService.getChatMember(c.crush_id, c.chat_id)
      )
    );

    const myCrushesKeyboard = myCrushesDetails.map(({ user: u }) => {
      let text = u.first_name;
      text = u.username ? `${text} (${u.username})` : '';

      const crush = myCrushes.find(c => c.crush_id === `${u.id}`);
      const callback_data = `${crush.crush_id}|${crush.user_nickname}`;

      return { text, callback_data };
    });

    const crushesOfMineKeyboard = crushesOfMine.map(u => {
      const text = u.user_nickname;
      const callback_data = `${u.user_id}|${u.user_nickname}`;
      return { text, callback_data };
    });

    const usersKeyboard = [...myCrushesKeyboard, ...crushesOfMineKeyboard];

    return this.telegramService
      .buildMessage(this.i18n.t('commands.anon_message.pick_user'))
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
      .withActivator(this.activators.replyFromCrush)
      .send();
  }
}
