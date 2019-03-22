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
    const p = (t: string = '') => `${t}\n`;
    // prettier-ignore
    const message =
      p('**===FAQ===**') +
      p('- Cómo le hablo a mi crush?') +
      p('Si no lo has agregado, puedes agregarlo como /addcrush.') +
      p('Para enviarle mensajes anónimos a tu crush, envíame mensajes y yo se los envío 😏') +
      p() +
      p('- Por qué tengo que elegir un nick cada vez que envío un mensaje?') +
      p('No tienes. Si le das reply a cualquier mensaje que te envíen, yo me encargo de hacerselo llegar') +
      p() +
      p('- Si agrego a alguien como crush, el puede ver quien yo soy?') +
      p('Nopity nop.') +
      p() +
      p('- Cómo mando un nude?') +
      p('No puedes por el momento 🥺, tamo trabajando pa eso') +
      p() +
      p('**===Commands===**') +
      p('/addcrush - Agrega a un usuario del grupo como crush. Esto te permite tirarle Dms anónimos 😏') +
      p('/mutecrush - Mutea un usuario') +
      p('/disablecrush - Deshabilita que otras personas puedan agregarte como crush') +
      p('/enablecrush - Habilita que otras personas puedan agregarte como crush') +
      p('/listcrush - Lista a todos los crush') +
      p() +
      p('**===Admin Commands===**') +
      p('/lobrechadore {num} - Lista a todas las personas que tienen {num} horas inactivos (sin enviar mensajes) en un grupo. Por defecto {num} es 120 horas.') +
      p('/thanos {num} - Remueve del grupo a todas las personas que tienen {num} horas inactivos (sin enviar mensajes) en un grupo') +
      p('/delomio {id} - Agrega al usuario con {id} a la lista de usuarios protegidos (aka no pueden ser removidos del grupo con /thanos). Si es usado como reply a un mensaje, el id del usuario que escribió el mensaje al que se le está dando reply será usado.') +
      p('/baraja {id} - Remueve al usuario con {id} de la lista de usuarios protegidos (aka no pueden ser removidos del grupo con /thanos). Si es usado como reply a un mensaje, el id del usuario que escribió el mensaje al que se le está dando reply será usado.');
    p('/lodichoso- Lista a todos los usuarios protegidos');

    await this.telegramService
      .buildMessage(message)
      .to(payload.plainMessage.chat_id)
      .asMarkDown()
      .send();
  }
}
