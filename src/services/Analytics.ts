import mixpanel, { Mixpanel } from 'mixpanel';
import { PlainMessage } from '../models';
import { Update } from 'telegram-typings';

export default class Analytics {
  private mixpanel: Mixpanel;

  constructor(token: string) {
    this.mixpanel = mixpanel.init(token, { protocol: 'https' });
  }

  process = async (collection: string, distinct_id: string, data: any) => {
    this.mixpanel.track(collection, { distinct_id, ...data });
    console.log(data);
  };

  processMessage = async (message: PlainMessage) =>
    this.process('messages', message.from_id, message);

  processUpdate = async (update: Update) =>
    this.process('updates', `${update.message.from.id}`, update);
}
