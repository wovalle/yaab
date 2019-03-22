import { Handler, ICommandHandler } from 'tsmediator';
import Container from 'typedi';

import TelegramService from '../services/telegram/TelegramService';
import { BotCommands } from '../selectors';
import I18nProvider from '../I18nProvider';
import { ITelegramHandlerPayload } from '../types';
import { CrushRelationshipRepositoryToken } from '..';
import { CrushRelationshipRepository } from '../Repositories';

@Handler(BotCommands.list_crush)
export class ListCrushHandler
  implements ICommandHandler<ITelegramHandlerPayload, void> {
  private telegramService: TelegramService;
  private i18n: I18nProvider;
  private crushRelationshipRepository: CrushRelationshipRepository;

  constructor() {
    this.telegramService = Container.get(TelegramService);
    this.i18n = Container.get(I18nProvider);
    this.crushRelationshipRepository = Container.get(
      CrushRelationshipRepositoryToken
    );
  }

  async Handle(payload: ITelegramHandlerPayload) {
    const { plainMessage: pm } = payload;

    const [myCrushes, crushesOfMine] = await Promise.all([
      this.crushRelationshipRepository.getMyCrushes(pm.from_id),
      this.crushRelationshipRepository.getCrushesOfMine(pm.from_id),
    ]);

    const crushesDetails = await Promise.all(
      myCrushes.map(c =>
        this.telegramService.getChatMember(c.crush_id, c.chat_id)
      )
    );

    const crushes = crushesDetails
      .map(e => {
        const rel = myCrushes.find(c => c.crush_id === `${e.user.id}`);
        const extra = rel.crush_status === 'blocked' ? ' [blocked]' : '';
        return `${e.user.first_name} ${e.user.last_name} (${
          rel.user_nickname
        }) ${extra}`;
      })
      .join('\n');

    const crushers = crushesOfMine
      .map(e => {
        const extra = e.crush_status === 'blocked' ? ' [blocked]' : '';
        return `${e.user_nickname} ${extra}`;
      })
      .join('\n');

    return this.telegramService
      .buildMessage(
        this.i18n.t('commands.list_crush.successful', { crushers, crushes })
      )
      .to(pm.chat_id)
      .send();
  }
}
