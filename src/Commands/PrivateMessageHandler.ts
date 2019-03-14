import { Handler, ICommandHandler } from 'tsmediator';
import Container from 'typedi';

import TelegramService from '../services/telegram/TelegramService';
import { BotCommands } from '../selectors';
import I18nProvider from '../I18nProvider';
import { ITelegramHandlerPayload } from '../types';
import { CrushRelationshipRepository } from '../Repositories';
import { CrushRelationshipRepositoryToken } from '..';
import { PlainMessage } from '../models';

interface ICallbackExtraData {
  id: string;
  nick: string;
}

@Handler(BotCommands.private_message)
export class PrivateMessageHandler
  implements ICommandHandler<ITelegramHandlerPayload, void> {
  private telegramService: TelegramService;
  private i18n: I18nProvider;
  private crushRelationshipRepository: CrushRelationshipRepository;

  private activators = {
    pickUser: 'pick_user',
    fromCrush: 'rfc',
    toCrush: 'rtc',
  };

  constructor() {
    this.telegramService = Container.get(TelegramService);
    this.i18n = Container.get(I18nProvider);
    this.crushRelationshipRepository = Container.get(
      CrushRelationshipRepositoryToken
    );
  }

  async handleToCrush(pm: PlainMessage, callbackData?: ICallbackExtraData) {
    const nick = callbackData
      ? callbackData.nick
      : /{(.*?)}/.exec(pm.reply_text)[1];

    if (!nick) {
      return Promise.reject(new Error('Invalid Username'));
    }

    const messageText = callbackData ? pm.reply_text : pm.text;

    const crushRelationship = await this.crushRelationshipRepository
      .whereEqualTo('user_nickname', nick)
      .find();

    if (!crushRelationship) {
      return Promise.reject(new Error('Invalid Relationship'));
    }

    return this.telegramService
      .buildMessage(messageText)
      .to(crushRelationship[0].crush_id)
      .prepend(this.i18n.t('commands.anon_message.user_says', { user: nick }))
      .withActivator(this.activators.fromCrush)
      .send();
  }

  async handleFromCrush(pm: PlainMessage, callbackData?: ICallbackExtraData) {
    const nick = callbackData
      ? callbackData.nick
      : pm.reply_text.split(' ')[1].slice(0, -1);

    const messageText = callbackData ? pm.reply_text : pm.text;
    // TODO: custom repository, findByNick
    const crushRelationship = await this.crushRelationshipRepository
      .whereEqualTo('user_nickname', nick)
      .find();

    const { user_id: userId } = crushRelationship[0];
    const mention = this.telegramService.getMentionFromId(
      pm.from_id,
      pm.from_first_name,
      pm.from_last_name
    );

    const sanitized = [`\\[`, `\\]`, '`', '_', '\\*'].reduce(
      (acc, cur) => acc.replace(new RegExp(cur, 'ig'), ''),
      messageText
    );

    return this.telegramService
      .buildMessage(sanitized)
      .to(userId)
      .prepend(
        this.i18n.t('commands.anon_message.crush_says', { mention, nick })
      )
      .withActivator(this.activators.toCrush)
      .asMarkDown()
      .send();
  }

  async handleKeyboard(pm: PlainMessage) {
    // TODO: move to repository
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
      const callback_data = `${crush.crush_id}|${crush.user_nickname}|${
        this.activators.fromCrush
      }`;

      return { text, callback_data };
    });

    const crushesOfMineKeyboard = crushesOfMine.map(u => {
      const text = u.user_nickname;
      const callback_data = `${u.user_id}|${u.user_nickname}|${
        this.activators.toCrush
      }`;
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

  async Handle(payload: ITelegramHandlerPayload) {
    const { plainMessage: pm, command } = payload;
    let callbackExtraData = null;
    let activator = command.activator;

    // TODO: handle message types (vn, vdn, image, video, music, location)
    if (activator === this.activators.pickUser) {
      const [id, nick, cbActivator] = pm.callback_data.split('|');
      callbackExtraData = { id, nick };
      activator = cbActivator;
      await this.telegramService.deleteMessage(pm.chat_id, pm.message_id);
    }

    if (activator === this.activators.fromCrush) {
      return this.handleFromCrush(pm, callbackExtraData);
    }

    if (activator === this.activators.toCrush) {
      return this.handleToCrush(pm, callbackExtraData);
    }

    return this.handleKeyboard(pm);
  }
}
