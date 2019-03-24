import { Handler, ICommandHandler } from 'tsmediator';
import Container from 'typedi';

import TelegramService from '../services/telegram/TelegramService';
import { BotCommands } from '../selectors';
import I18nProvider from '../I18nProvider';
import { ITelegramHandlerPayload } from '../types';

@Handler(BotCommands.help)
export class HelpHandler
  implements ICommandHandler<ITelegramHandlerPayload, void> {
  private telegramService: TelegramService;
  private i18n: I18nProvider;

  constructor() {
    this.telegramService = Container.get(TelegramService);
    this.i18n = Container.get(I18nProvider);
  }

  async Handle(payload: ITelegramHandlerPayload) {
    const p = (t: string = '', end: boolean = true) =>
      `${t}${end ? '\n' : ' '}`;
    // prettier-ignore
    const message =
      p('**===FAQ===**') +
            
      p('- Qué coño es BenditoCrush?') +
      p('BenditoCrush es una funcionalidad de @benditobot que te permite agregar uno o varios usuarios', false) +
      p('como "crush" y poder hablarles de forma anónima.') +
      p() +
      p('- Tato pero cómo uso BenditoCrush con @benditobot?') +
      p('Primero debes hablarle a @benditobot por privado y escribir /start ', false) +
      p('para que el bot te registre como usuario y puedes usar sus funcionalidades.') +
      p('Luego puedes usar el comando /addcrush para buscar a las personas por nombre o username.', false) +
      p('Una vez agregado, lo que le escribas al bot será reenviado de forma anónima a tu crush') +
      p() +
      p('- Por qué tengo que elegir un crush cada vez que envío un mensaje?') +
      p('No tienes. Si le das reply a cualquier mensaje que te envíen, yo se lo reenvío de forma anónima.') +
      p() +
      p('- Si agrego a alguien como crush, el puede ver quien yo soy?') +
      p('Nopity nop. Solo tú ves que tu crush te habla, el no ve quién le escribe (más que el nick anónimo de la conversación)') +
      p() +
      p('- Cómo mando un nude?') +
      p('No puedes por el momento 🥺, tamo trabajando pa eso') +
      p() +
      p('**===Commands===**') +
      p(
        '/addcrush - Agrega a un usuario del grupo como crush. Esto te permite tirarle Dms anónimos 😏'
      ) +
      p('/mutecrush - Mutea un usuario') +
      p(
        '/disablecrush - Deshabilita que otras personas puedan agregarte como crush'
      ) +
      p(
        '/enablecrush - Habilita que otras personas puedan agregarte como crush'
      ) +
      p('/listcrush - Lista a todos los crush') +
      p() +
      p('**===Admin Commands===**') +
      p(
        '/lobrechadore {num} - Lista a todas las personas que tienen {num} horas inactivos (sin enviar mensajes) en un grupo. Por defecto {num} es 120 horas.'
      ) +
      p(
        '/thanos {num} - Remueve del grupo a todas las personas que tienen {num} horas inactivos (sin enviar mensajes) en un grupo'
      ) +
      p(
        '/delomio {id} - Agrega al usuario con {id} a la lista de usuarios protegidos (aka no pueden ser removidos del grupo con /thanos). Si es usado como reply a un mensaje, el id del usuario que escribió el mensaje al que se le está dando reply será usado.'
      ) +
      p(
        '/baraja {id} - Remueve al usuario con {id} de la lista de usuarios protegidos (aka no pueden ser removidos del grupo con /thanos). Si es usado como reply a un mensaje, el id del usuario que escribió el mensaje al que se le está dando reply será usado.'
      );
    p('/lodichoso- Lista a todos los usuarios protegidos');

    await this.telegramService
      .buildMessage(message)
      .to(payload.plainMessage.chat_id)
      .asMarkDown()
      .send();
  }
}
