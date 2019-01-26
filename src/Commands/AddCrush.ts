import { Handler, ICommandHandler } from 'tsmediator';
import Container from 'typedi';

import TelegramService from '../services/telegram/TelegramService';
import { BotCommands } from '../selectors';
import I18nProvider from '../I18nProvider';
import { ITelegramHandlerPayload } from '../types';
import { ChatRepository } from '../Repositories';
import { ChatRepositoryToken } from '..';
import { ParseMode } from '../services/telegram';

@Handler(BotCommands.add_crush)
export class AddCrushHandler
  implements ICommandHandler<ITelegramHandlerPayload, void> {
  private telegramService: TelegramService;
  private i18n: I18nProvider;
  private chatRepository: ChatRepository;

  private activators = {
    search: 'crush_search',
    usernameNotFound: 'crush_uname_not_found',
    searchNotFound: 'crush_not_found',
    crushFound: 'crush_found',
  };

  constructor() {
    this.telegramService = Container.get(TelegramService);
    this.i18n = Container.get(I18nProvider);
    this.chatRepository = Container.get(ChatRepositoryToken);
  }

  withActivator(activator: string, label: string, opts?: any) {
    return `#${activator}: ${this.i18n.t(label, opts)}`;
  }

  async Handle(payload: ITelegramHandlerPayload) {
    if (payload.command.type === 'bot_command') {
      return this.telegramService.sendReply(
        payload.plainMessage.chat_id,
        payload.plainMessage.message_id,
        this.withActivator(this.activators.search, 'commands.addcrush.search'),
        {
          force_reply: true,
        }
      );
    } else if (payload.command.activator === this.activators.search) {
      // TODO: constant group id
      const chat = await this.chatRepository.findById(
        payload.plainMessage.chat_id
      );

      const users = await chat.users.findByName(payload.plainMessage.text);

      if (!users.length) {
        return this.telegramService.sendReply(
          payload.plainMessage.chat_id,
          payload.plainMessage.message_id,
          this.withActivator(
            this.activators.search,
            'commands.add_crush.not_found'
          ),
          {
            force_reply: true,
          }
        );
      }

      const usersKeyboard = users.map(u => {
        let text = u.first_name;
        text = u.last_name ? `${text} ${u.last_name}` : '';
        text = u.username ? `${text} (${u.last_name})` : '';
        return { text, callback_data: u.id };
      });

      return this.telegramService.sendReplyKeyboard(
        payload.plainMessage.chat_id,
        payload.plainMessage.message_id,
        usersKeyboard,
        {
          parse_mode: ParseMode.Markdown,
          force_reply: true,
        }
      );
    }

    return Promise.reject('Invalid Path');
  }
}
