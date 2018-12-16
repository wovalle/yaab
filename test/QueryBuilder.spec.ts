import QueryBuilder from '../src/dbcontext/QueryBuilder';
import { expect } from 'chai';

describe('QueryBuilder', () => {
  let qb: QueryBuilder = null;
  beforeEach(() => {
    qb = new QueryBuilder();
  });

  // TODO: write remaining tests

  it('must build query', () => {
    const query = qb.whereEqualTo('prop', 1).getQuery();
    expect(query).to.eql([{ prop: 'prop', operator: '==', val: 1 }]);
  });
});
