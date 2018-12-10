import { get } from 'lodash';

export interface ITranslationProvider {
  t(id: string, params?: any): string;
}
interface ITranslationParams {
  [id: string]: string;
}

export default class I18nProvider implements ITranslationProvider {
  constructor(private translations: any) {}
  t(id: string, params: ITranslationParams = {}) {
    const entries = Object.entries(params);
    const str = get(this.translations, id, id);
    return entries.reduce(
      (acc, cur) => acc.replace(`{{${cur[0]}}}`, cur[1]),
      str
    );
  }
}
