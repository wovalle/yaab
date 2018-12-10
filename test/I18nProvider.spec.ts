import I18nProvider from '../src/I18nProvider';
import { expect } from 'chai';

describe('I18nProvider', () => {
  it('should provide i18n', () => {
    const i18n = new I18nProvider({ path: 'hello {{a}}' });
    expect(i18n.t('path', { a: 'world' })).to.equal('hello world');
  });
  it('should provide i18n without params', () => {
    const i18n = new I18nProvider({ path: 'hello world' });
    expect(i18n.t('path')).to.equal('hello world');
  });
});
