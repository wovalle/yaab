export class User {
  id: string;
  firstName: string;
  lastName?: string;
  birthDate: Date;
}

const users = new Array<User>();
users.push({
  firstName: 'Jen',
  lastName: 'Barber',
  id: 'jen',
  birthDate: new Date(1978, 3 - 1, 9),
});

users.push({
  firstName: 'Maurice',
  lastName: 'Moss',
  id: 'moss',
  birthDate: new Date(1977, 6 - 1, 12),
});

users.push({
  firstName: 'roy',
  id: 'roy',
  birthDate: new Date(1979, 10 - 1, 9),
});

const colFixture = users.reduce((acc, cur) => {
  const { id, ...rest } = cur;
  acc[id] = rest;
  return acc;
}, {});

export const fixtureData = {
  __collection__: {
    users: {
      __doc__: colFixture,
    },
  },
};
