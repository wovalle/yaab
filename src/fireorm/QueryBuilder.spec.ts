import QueryBuilder from './QueryBuilder';
import { expect } from 'chai';

describe('QueryBuilder', () => {
  class Entity {
    prop: string;
  }

  let qb: QueryBuilder<Entity> = null;
  beforeEach(() => {
    qb = new QueryBuilder(null, '');
  });

  // TODO: write remaining tests
  it('must build query', () => {
    const query = qb.whereEqualTo('prop', 1).getQuery();
    expect(query).to.eql([{ prop: 'prop', operator: '==', val: 1 }]);
  });
});
