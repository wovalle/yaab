import { ListInactiveHandler } from '../src/Commands/ListInactiveHandler';
import { ITelegramHandlerPayload } from '../src/types';
import { getBotCommand, getPlainMessage } from '../src/selectors';
import { Update, Message, ChatMember } from 'telegram-typings';
import {
  PlainMessage,
  Chat,
  ChatMember as ChatMemberModel,
} from '../src/models';
import I18nProvider, { ITranslationParams } from '../src/I18nProvider';
import {
  ITelegramService,
  ISendMessageOpts,
  MessageBuilderProps,
} from '../src/services/telegram';
import {
  IRepository,
  IQueryExecutor,
  IQueryBuilder,
  IFireOrmQueryLine,
  IFirestoreVal,
} from 'fireorm';
import Container from 'typedi';

const fakeUpdate: Update = {
  update_id: 999997,
  message: {
    message_id: 9999996,
    from: {
      id: 999998,
      is_bot: false,
      first_name: 'fake',
      last_name: 'User',
      username: 'fakeuser',
      language_code: 'en',
    },
    chat: {
      id: 999999,
      title: 'Fake group',
      type: 'supergroup',
    },
    date: new Date().getTime() / 1000,
    text: 'weird flex',
  },
};

const getFakeUpdate = (overwrite: Partial<Update>) => ({
  ...fakeUpdate,
  overwrite,
});

const getFakePlainMessage = (overwrite: Partial<PlainMessage>) => ({
  ...getPlainMessage(fakeUpdate),
  overwrite,
});

const getFakePayload = (
  overwrite: Partial<PlainMessage>,
  userFrom: ChatMemberModel,
  chat: Chat
): ITelegramHandlerPayload => {
  const plainMessage = getFakePlainMessage(overwrite);
  const command = getBotCommand(plainMessage);
  return { plainMessage, command, userFrom, chat };
};

const FakePayloadGenerator = (userFrom: ChatMemberModel, chat: Chat) => {
  return (overwrite: Partial<PlainMessage>) => {
    return getFakePayload(overwrite, userFrom, chat);
  };
};

class FakeTelegram implements ITelegramService {
  sendChat(
    chatId: string,
    message: string,
    opts?: ISendMessageOpts
  ): Promise<Message> {
    throw new Error('Method not implemented.');
  }
  sendReply(
    chatId: string,
    replyMessageId: string,
    message: string,
    opts?: ISendMessageOpts
  ): Promise<Message> {
    throw new Error('Method not implemented.');
  }
  kickUser(userId: string, chatId: string, until: Date): Promise<void> {
    throw new Error('Method not implemented.');
  }
  getChatMember(userId: string, chatId: string): Promise<ChatMember> {
    throw new Error('Method not implemented.');
  }
  getMentionFromId(id: string, name: string, lastName?: string): string {
    throw new Error('Method not implemented.');
  }
  sendRawMessage(props: MessageBuilderProps): Promise<Message> {
    throw new Error('Method not implemented.');
  }
}

class FakeI18n extends I18nProvider {
  t(id: string, params?: ITranslationParams) {
    return id;
  }
}

// TODO: Stop doing this yourself and use an mocking library
class FakeChatRepository
  implements IRepository<Chat>, IQueryBuilder<Chat>, IQueryExecutor<Chat> {
  execute(queries: IFireOrmQueryLine[]): Promise<Chat[]> {
    throw new Error('Method not implemented.');
  }
  whereEqualTo(
    prop: 'id' | 'messages' | 'users',
    val: IFirestoreVal
  ): IQueryBuilder<Chat> {
    throw new Error('Method not implemented.');
  }
  whereGreaterThan(
    prop: 'id' | 'messages' | 'users',
    val: IFirestoreVal
  ): IQueryBuilder<Chat> {
    throw new Error('Method not implemented.');
  }
  whereGreaterOrEqualThan(
    prop: 'id' | 'messages' | 'users',
    val: IFirestoreVal
  ): IQueryBuilder<Chat> {
    throw new Error('Method not implemented.');
  }
  whereLessThan(
    prop: 'id' | 'messages' | 'users',
    val: IFirestoreVal
  ): IQueryBuilder<Chat> {
    throw new Error('Method not implemented.');
  }
  whereLessOrEqualThan(
    prop: 'id' | 'messages' | 'users',
    val: IFirestoreVal
  ): IQueryBuilder<Chat> {
    throw new Error('Method not implemented.');
  }
  whereArrayContains(
    prop: 'id' | 'messages' | 'users',
    val: IFirestoreVal
  ): IQueryBuilder<Chat> {
    throw new Error('Method not implemented.');
  }
  find(): Promise<Chat[]> {
    throw new Error('Method not implemented.');
  }
  findById(id: string): Promise<Chat> {
    throw new Error('Method not implemented.');
  }
  create(item: Chat): Promise<Chat> {
    throw new Error('Method not implemented.');
  }
  update(item: Chat): Promise<Chat> {
    throw new Error('Method not implemented.');
  }
  delete(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

class FakeChatMemberRepository
  implements
    IRepository<ChatMemberModel>,
    IQueryBuilder<ChatMemberModel>,
    IQueryExecutor<ChatMemberModel> {
  execute(queries: IFireOrmQueryLine[]): Promise<ChatMemberModel[]> {
    throw new Error('Method not implemented.');
  }
  whereEqualTo(
    prop:
      | 'id'
      | 'is_bot'
      | 'first_name'
      | 'last_name'
      | 'username'
      | 'last_message'
      | 'role'
      | 'status'
      | 'protected'
      | 'crush_status'
      | 'search_keywords',
    val: IFirestoreVal
  ): IQueryBuilder<ChatMemberModel> {
    throw new Error('Method not implemented.');
  }
  whereGreaterThan(
    prop:
      | 'id'
      | 'is_bot'
      | 'first_name'
      | 'last_name'
      | 'username'
      | 'last_message'
      | 'role'
      | 'status'
      | 'protected'
      | 'crush_status'
      | 'search_keywords',
    val: IFirestoreVal
  ): IQueryBuilder<ChatMemberModel> {
    throw new Error('Method not implemented.');
  }
  whereGreaterOrEqualThan(
    prop:
      | 'id'
      | 'is_bot'
      | 'first_name'
      | 'last_name'
      | 'username'
      | 'last_message'
      | 'role'
      | 'status'
      | 'protected'
      | 'crush_status'
      | 'search_keywords',
    val: IFirestoreVal
  ): IQueryBuilder<ChatMemberModel> {
    throw new Error('Method not implemented.');
  }
  whereLessThan(
    prop:
      | 'id'
      | 'is_bot'
      | 'first_name'
      | 'last_name'
      | 'username'
      | 'last_message'
      | 'role'
      | 'status'
      | 'protected'
      | 'crush_status'
      | 'search_keywords',
    val: IFirestoreVal
  ): IQueryBuilder<ChatMemberModel> {
    throw new Error('Method not implemented.');
  }
  whereLessOrEqualThan(
    prop:
      | 'id'
      | 'is_bot'
      | 'first_name'
      | 'last_name'
      | 'username'
      | 'last_message'
      | 'role'
      | 'status'
      | 'protected'
      | 'crush_status'
      | 'search_keywords',
    val: IFirestoreVal
  ): IQueryBuilder<ChatMemberModel> {
    throw new Error('Method not implemented.');
  }
  whereArrayContains(
    prop:
      | 'id'
      | 'is_bot'
      | 'first_name'
      | 'last_name'
      | 'username'
      | 'last_message'
      | 'role'
      | 'status'
      | 'protected'
      | 'crush_status'
      | 'search_keywords',
    val: IFirestoreVal
  ): IQueryBuilder<ChatMemberModel> {
    throw new Error('Method not implemented.');
  }
  find(): Promise<ChatMemberModel[]> {
    throw new Error('Method not implemented.');
  }
  findById(id: string): Promise<ChatMemberModel> {
    throw new Error('Method not implemented.');
  }
  create(item: ChatMemberModel): Promise<ChatMemberModel> {
    throw new Error('Method not implemented.');
  }
  update(item: ChatMemberModel): Promise<ChatMemberModel> {
    throw new Error('Method not implemented.');
  }
  delete(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

describe('Commands | ListInactive', () => {
  let handler = null;
  let payloadGenerator = null;

  beforeEach(async () => {
    handler = new ListInactiveHandler();

    const telegramService = new FakeTelegram();
    const i18n = new FakeI18n({});
    const chatRepository = new FakeChatRepository();
    const chatMemberRepository = new FakeChatMemberRepository();
    const chat = await chatRepository.findById('42');
    const userFrom = await chatMemberRepository.findById('14');

    payloadGenerator = FakePayloadGenerator(userFrom, chat);
  });
  it('should list inactive', () => {
    const payload = payloadGenerator({ text: '/thanos@benditobot 120' });
    handler.Handle(payload);
  });
  it('should list inactive with default time');
  it('should reject if the command is bad formatted');
  it('should handle no inactive users');
  it('should reject if the command is bad formatted');
  it('should reject if the command is bad formatted');
});
