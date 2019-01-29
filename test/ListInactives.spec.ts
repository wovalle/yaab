// import { ListInactiveHandler } from '../src/Commands/ListInactiveHandler';
// import { ITelegramHandlerPayload } from '../src/types';
// import { getBotCommand, getPlainMessage } from '../src/selectors';
// import { Update } from 'telegram-typings';
// import { PlainMessage } from '../src/models';

// import sinon from 'sinon';
// import chai from 'chai';
// import sinonChai from 'sinon-chai';
// chai.use(sinonChai);
// const expect = chai.expect;

// import TelegramService from '../src/services/telegram/TelegramService';
// import I18nProvider from '../src/I18nProvider';

// const fakeUpdate: Update = {
//   update_id: 999997,
//   message: {
//     message_id: 9999996,
//     from: {
//       id: 999998,
//       is_bot: false,
//       first_name: 'fake',
//       last_name: 'User',
//       username: 'fakeuser',
//       language_code: 'en',
//     },
//     chat: {
//       id: 999999,
//       title: 'Fake group',
//       type: 'supergroup',
//     },
//     date: new Date().getTime() / 1000,
//     text: 'weird flex',
//   },
// };

// const getFakeUpdate = (overwrite: Partial<Update>) => ({
//   ...fakeUpdate,
//   overwrite,
// });

// const getFakePlainMessage = (overwrite: Partial<PlainMessage>) => ({
//   ...getPlainMessage(fakeUpdate),
//   overwrite,
// });

// const getFakePayload = (
//   overwrite: Partial<PlainMessage>
// ): ITelegramHandlerPayload => {
//   const plainMessage = getFakePlainMessage(overwrite);
//   const command = getBotCommand(plainMessage);
//   return { plainMessage, command };
// };

// describe('Commands | ListInactive', () => {
//   let handler = null;
//   let payload = null;

//   beforeEach(() => {
//     handler = new ListInactiveHandler();

//     const telegramService = sinon.createStubInstance(TelegramService);
//     const i18n = sinon.createStubInstance(I18nProvider);
//     const chatRepository = sinon.createStubInstance(ChatRepos);
//     const a = telegram.sendChat('');
//   });
//   it('should list inactive', () => {
//     const Handler = getFakePayload({ text: '/thanos@benditobot 120' });
//     handler.Handle(payload);
//   });
//   it('should list inactive with default time');
//   it('should reject if the command is bad formatted');
//   it('should handle no inactive users');
//   it('should reject if the command is bad formatted');
//   it('should reject if the command is bad formatted');
// });
