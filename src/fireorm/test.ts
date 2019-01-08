import * as admin from 'firebase-admin';
import BaseFirestoreRepository, {
  getRepository,
} from './BaseFirestoreRepository';
import { IRepository, IQueryBuilder, ISubCollection } from './types';
import { EventType, EventData, PlainMedia, UserRole } from '../types';
import Collection from './Decorators/Collection';
import SubCollection from './Decorators/SubCollection';
import { PlainMessage } from '../models/PlainMessage';
import { error } from 'util';
import { ChatMember } from '../models';

const serviceAccount = require('./creds.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://yaab-88ea8.firebaseio.com',
});

const firestore = admin.firestore();
firestore.settings({
  timestampsInSnapshots: true,
});

@Collection('chats')
class Chat {
  id: string;
  @SubCollection(PlainMessage)
  readonly messages?: ISubCollection<PlainMessage>;
  @SubCollection(ChatMember)
  readonly users?: ISubCollection<ChatMember>;
}

// class ChatRepository extends BaseFirestoreRepository<Chat> {}
// const chatRepository = new ChatRepository(firestore, 'chats');
const chatRepository = getRepository(Chat, firestore);

const foo = async () => {
  // const colls = await firestore.listCollections();
  // console.log('lecolls', colls.map(c => c.id));
  // const benditoChat = await chatRepository.findById('-1001376022771');
  const benditoChat = await chatRepository.findById(`${-1001376022771}`);
  console.log(benditoChat);
  const date = new Date('2018-12-27T02:32:41.850Z');
  const message = await benditoChat.messages
    .whereEqualTo('update_id', 140671219)
    .whereGreaterOrEqualThan('date', date)
    .find();
  const inactiveUsers = await benditoChat.users
    .whereLessOrEqualThan('last_message', date)
    .find();
  const nullUsers = await benditoChat.users
    .whereEqualTo('last_message', null)
    .find();
  const users = inactiveUsers
    .concat(nullUsers)
    .filter(u => !u.is_bot)
    .filter(u => !u.protected)
    .filter(u => !['kicked', 'left', 'creator'].includes(u.status))
    .filter(u => u.role !== UserRole.admin);
  console.log({ users });
  // End of repeated code
};

foo().catch(e => console.error(e));
