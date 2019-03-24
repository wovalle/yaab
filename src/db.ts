import * as admin from 'firebase-admin';
import { ChatMember } from './models';
import { PlainMessage } from './models/PlainMessage';
import { UserRole, EventType } from './types';

let instance = null;

const cleanUndefined = obj => {
  Object.keys(obj).forEach(key => {
    if (obj[key] && typeof obj[key] === 'object') cleanUndefined(obj[key]);
    else if (obj[key] === undefined) obj[key] = null;
  });
  return obj;
};

const parseDates = obj => {
  Object.keys(obj).forEach(key => {
    if (obj[key] instanceof admin.firestore.Timestamp)
      obj[key] = obj[key].toDate();
    else if (obj[key] && typeof obj[key] === 'object') parseDates(obj[key]);
  });

  return obj;
};

export class Db {
  public _db: FirebaseFirestore.Firestore;

  constructor() {
    admin.initializeApp();
    this._db = admin.firestore();
  }

  retreiveMessagesInRange(
    groupId: string,
    from: Date,
    to: Date
  ): Promise<PlainMessage[]> {
    return this._db
      .collection('chats')
      .doc(`${groupId}`)
      .collection('messages')
      .where('date', '>=', from)
      .where('date', '<=', to)
      .get()
      .then(snap => snap.docs.map(d => parseDates(d.data())));
  }

  retreiveUsersFromGroup(groupId: string) {
    return this._db
      .collection('chats')
      .doc(`${groupId}`)
      .collection('users')
      .get()
      .then(snap => snap.docs.map(d => parseDates(d.data()) as ChatMember));
  }

  getUserFromGroup(groupId: string, userId: string): Promise<ChatMember> {
    const chatRef = this._db.collection(`chats`).doc(`${groupId}`);
    const userRef = chatRef.collection('users').doc(`${userId}`);

    return userRef
      .get()
      .then(snap => (snap.exists ? (snap.data() as ChatMember) : null));
  }

  getProtectedUsers(groupId: Number): Promise<ChatMember[]> {
    const chatRef = this._db.collection(`chats`).doc(`${groupId}`);
    const userRef = chatRef.collection('users');

    return userRef
      .where('protected', '==', true)
      .get()
      .then(snap => snap.docs.map(d => parseDates(d.data()) as ChatMember));
  }

  async getInactiveUsers(groupId: Number, since: Date): Promise<ChatMember[]> {
    const chatRef = this._db.collection(`chats`).doc(`${groupId}`);
    const userRef = chatRef.collection('users');

    const inactives = await userRef
      .where('last_message', '<=', since)
      .get()
      .then(snap => snap.docs.map(d => parseDates(d.data()) as ChatMember));

    const nullUsers = await userRef
      .where('last_message', '==', null)
      .get()
      .then(snap => snap.docs.map(d => parseDates(d.data() as ChatMember)));

    return inactives
      .concat(nullUsers)
      .filter(u => !u.is_bot)
      .filter(u => !u.protected)
      .filter(u => !['kicked', 'left', 'creator'].includes(u.status))
      .filter(u => u.role !== UserRole.admin);
  }

  async saveChatUser(chatId: string, user: ChatMember, today: Date) {
    const batch = this._db.batch();

    const chatRef = this._db.collection('chats').doc(`${chatId}`);
    const userRef = chatRef.collection('users').doc(`${user.id}`);
    const internalEventRef = chatRef.collection('internal_events');
    const internalEventDoc = internalEventRef.doc();

    const event = {
      event: 'user_updated',
      ref: { user },
      date: today,
    };

    batch.set(userRef, cleanUndefined(user));
    batch.set(internalEventDoc, cleanUndefined(event));
    return batch.commit();
  }

  async updateChatUser(chatId: string, user: ChatMember) {
    const chatRef = this._db.collection('chats').doc(`${chatId}`);
    const userRef = chatRef.collection('users').doc(`${user.id}`);

    return userRef.update(user);
  }

  async setProtectedUser(
    chatId: string,
    userId: string,
    today: Date,
    _protected: boolean
  ) {
    const batch = this._db.batch();

    const chatRef = this._db.collection('chats').doc(`${chatId}`);
    const userRef = chatRef.collection('users').doc(`${userId}`);
    const internalEventRef = chatRef.collection('internal_events');
    const internalEventDoc = internalEventRef.doc();

    const event = {
      event: 'user_protected',
      ref: { userId },
      date: today,
    };

    batch.update(userRef, { protected: _protected });
    batch.set(internalEventDoc, event);
    return batch.commit();
  }

  async saveChatStat(message: PlainMessage, user: ChatMember, today: Date) {
    const batch = this._db.batch();

    const chatRef = this._db.collection(`chats`).doc(`${message.chat_id}`);
    const userRef = chatRef.collection('users').doc(`${message.from_id}`);

    batch.update(userRef, { last_message: today, status: 'active' });

    if (message.event_type === EventType.new_chat_members) {
      const events = message.event_data as Array<any>;
      if (events.length) {
        events.forEach(e => {
          if (!e.id) {
            return;
          }

          const eventUser = chatRef.collection('users').doc(`${e.id}`);
          batch.update(eventUser, { last_message: today, status: 'active' });
        });
      }
    }
    return batch.commit();
  }

  async insertUsersInGroup(usersToImport: ChatMember[], groupId: Number) {
    if (!usersToImport.length) return null;

    const batch = this._db.batch();
    const batch_id = Date.now();
    const groupRef = this._db.collection(`chats`).doc(`${groupId}`);
    const internalEventRef = groupRef.collection('internal_events');

    const existingUsers = await groupRef
      .collection('users')
      .get()
      .then(snap => snap.docs.map(d => parseDates(d.data() as ChatMember)));

    for (const user of usersToImport) {
      if (!existingUsers.some(u => u.id === user.id)) {
        const userRef = groupRef.collection('users').doc(`${user.id}`);
        batch.set(userRef, user);
      }
    }

    const usersEventDoc = internalEventRef.doc();

    const usersAddedData = {
      event: 'users_imported',
      count: usersToImport.length,
      ref: { batch_id, usersToImport },
      date: new Date(),
    };

    batch.set(usersEventDoc, usersAddedData);
    return batch.commit();
  }
}

const getInstance: () => Db = () => {
  if (!instance) {
    instance = new Db();
  }

  return instance;
};

export default {
  getInstance,
};
