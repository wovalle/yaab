import {
  IQueryBuilder,
  IFireOrmQueryLine,
  IFirestoreVal,
  FirestoreOperators,
  IQueryBuilderResult,
} from './types';
import { WhereFilterOp, QuerySnapshot } from '@google-cloud/firestore';

export default class QueryBuilder<T> implements IQueryBuilder<T> {
  // TODO: validate prop is in T
  // TODO: validate not doing range fields in different fields
  constructor(
    protected db: FirebaseFirestore.Firestore,
    protected colName: string
  ) {}

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

  // TODO: this isn't the place for this
  private extractTFromColSnap(q: QuerySnapshot): T[] {
    return q.docs.map(d => d.data() as T);
  }

  find(): Promise<T[]> {
    return this.queries
      .reduce((acc, cur) => {
        const op = cur.operator as WhereFilterOp;
        return acc.where(cur.prop, op, cur.val);
      }, this.db.collection(this.colName))
      .get()
      .then(this.extractTFromColSnap);
  }
}
