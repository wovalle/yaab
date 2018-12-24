import { Collection, SubCollection } from './';
import { IRepository } from './types';

export class Message {
  id: string;
  date: Date;
  text: string;
}

@Collection('users')
export class User {
  id: string;
  firstName: string;
  lastName?: string;
  birthDate: Date;
  @SubCollection(Message, 'message', 'users')
  readonly messages?: IRepository<Message>;
}

const users = new Array<User>();
users.push({
  id: 'jen',
  firstName: 'Jen',
  lastName: 'Barber',
  birthDate: new Date('1978-03-09'),
});

users.push({
  id: 'moss',
  firstName: 'Maurice',
  lastName: 'Moss',
  birthDate: new Date('1977-06-12'),
});

users.push({
  id: 'roy',
  firstName: 'Roy',
  birthDate: new Date('1979-10-09'),
});

const colFixture = users.reduce((acc, cur) => {
  acc[cur.id] = cur;
  return acc;
}, {});

export const getFixture = () => ({
  __collection__: {
    users: {
      __doc__: colFixture,
    },
  },
});
