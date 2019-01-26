import { IHttp } from '../Http';
import { PlainMessage } from '../models';
import { Update } from 'telegram-typings';

export default class PermanentStore {
  constructor(
    private http: IHttp,
    private url: string,
    private username: string,
    private password: string
  ) {}

  private buildUrl = (path: string) => `${this.url}/${path}`;

  process = async (collection: string, data: any) => {
    const url = this.buildUrl(collection);
    try {
      await this.http.post(url, data, {
        auth: {
          username: this.username,
          password: this.password,
        },
      });
    } catch (err) {
      console.error('Error Store:', err);
    }
  };

  processMessage = async (message: PlainMessage) =>
    this.process('messages', message);

  processUpdate = async (update: Update) => this.process('updates', update);
}
