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
      p('- Qué es /benditocrush o Crush Mode?') +
      p('Es una funcionalidad de @benditobot que te permite agregar a usuario como "crush" y enviarle mensajes privados (anónimos 🤫)') +
      p() +
      p('- Cómo le hablo a mi crush?') +
      p('Si no lo has agregado, puedes agregarlo usando /addcrush.') +
      p('Para enviarle mensajes anónimos a tu crush, envíame mensajes y yo se los envío 😏') +
      p() +
      p('- Por qué tengo que elegir un nick cada vez que envío un mensaje?') +
      p('No tienes. Si le das reply (responder) a cualquier mensaje que te envíe un crush, yo se lo devuelvo a quién lo envió.') +
      p() +
      p('- Si agrego a alguien como crush, el puede ver quien yo soy?') +
      p('Nopity nop. Solo tú ves que tu crush te habla, el no ve quién le escribe (más que el nick anónimo de la conversación)') +
      p() +
      p('- Cómo mando un nude?') +
      p('No puedes por el momento 🥺, tamo trabajando pa eso') +
      p() +
      p('**===Commands===**') +
      p('/start - Permite a @benditobot poder interactuar contigo.') +
      p('/help - Preguntas frecuentes y ayuda sobre los comandos.') +
      p('/addcrush - Agrega a una persona como crush 😉') +
      p('/blockcrush - Bloquea los mensajes de un crush 😉') +
      p('/unblockcrush - Desbloquea los mensajes de un crush 😉') +
      p('/enablecrush - Habilita Crush Mode, puedes mandar y recibir mensajes anónimos') +
      p('/disablecrush - Deshabilita Crush Mode, ya no puedes mandar o recibir mensajes anónimos') +
      p('/listcrush - Lista todos tus crushs') +
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
