export class Message {
  id: string;
  date: Date;
  text: string;
}

export class User {
  id: string;
  firstName: string;
  lastName?: string;
  birthDate: Date;
}

const users = new Array<User>();
users.push({
  id: 'jen',
  firstName: 'Jen',
  lastName: 'Barber',
  birthDate: new Date(1978, 3 - 1, 9),
});

users.push({
  id: 'moss',
  firstName: 'Maurice',
  lastName: 'Moss',
  birthDate: new Date(1977, 6 - 1, 12),
});

users.push({
  id: 'roy',
  firstName: 'Roy',
  birthDate: new Date(1979, 10 - 1, 9),
});

const colFixture = users.reduce((acc, cur) => {
  acc[cur.id] = cur;
  return acc;
}, {});

export const fixtureData = {
  __collection__: {
    users: {
      __doc__: colFixture,
    },
  },
};
