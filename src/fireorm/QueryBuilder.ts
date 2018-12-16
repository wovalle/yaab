import {
  IQueryBuilder,
  IFireOrmQueryLine,
  IFirestoreVal,
  FirestoreOperators,
  IQueryBuilderResult,
} from './types';

export default abstract class QueryBuilder<T> implements IQueryBuilder<T> {
  // TODO: validate prop is in T
  // TODO: validate not doing range fields in different fields

  protected queries: Array<IFireOrmQueryLine> = [];

  whereEqualTo(prop: string, val: IFirestoreVal): QueryBuilder<T> {
    this.queries.push({ prop, val, operator: FirestoreOperators.equal });
    return this;
  }

  whereGreaterThan(prop: string, val: IFirestoreVal): QueryBuilder<T> {
    this.queries.push({ prop, val, operator: FirestoreOperators.greaterThan });
    return this;
  }

  whereGreaterOrEqualThan(prop: string, val: IFirestoreVal): QueryBuilder<T> {
    this.queries.push({
      prop,
      val,
      operator: FirestoreOperators.greaterThanEqual,
    });
    return this;
  }

  whereLessThan(prop: string, val: IFirestoreVal): QueryBuilder<T> {
    this.queries.push({ prop, val, operator: FirestoreOperators.lessThan });
    return this;
  }

  whereLessOrEqualThan(prop: string, val: IFirestoreVal): QueryBuilder<T> {
    this.queries.push({
      prop,
      val,
      operator: FirestoreOperators.lessThanEqual,
    });
    return this;
  }

  whereArrayCointain(prop: string, val: IFirestoreVal): QueryBuilder<T> {
    this.queries.push({
      prop,
      val,
      operator: FirestoreOperators.arrayContains,
    });
    return this;
  }

  getQuery(): IQueryBuilderResult {
    return this.queries;
  }

  abstract find(): Promise<T[]>;
}
