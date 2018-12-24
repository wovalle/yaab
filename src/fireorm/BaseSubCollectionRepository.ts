// tslint:disable-next-line:no-import-side-effect
import 'reflect-metadata';
import { IRepository, IFirestoreVal, IQueryBuilder } from './types';
import QueryBuilder from './SubCollectionQueryBuilder';
import { Firestore, DocumentSnapshot } from '@google-cloud/firestore';

export default abstract class BaseSubCollectionRepository<
  T extends { id: string }
> implements IRepository<T>, IQueryBuilder<T> {
  // TODO: v1 inherit CollectionRepository and SubCollectionRepository from AbstractRepository
  // TODO: merge CollectionRepository with SubCollectionRepository and deduct changes from metadata

  constructor(
    protected db: Firestore,
    protected colName: string,
    protected docId: string,
    protected subColName: string
  ) {}

  private extractTFromDocSnap = (doc: DocumentSnapshot): T => {
    return doc.exists ? this.parseTimestamp(doc.data() as T) : null;
  };

  private parseTimestamp = (obj: T): T => {
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'object' && 'toDate' in obj[key]) {
        obj[key] = obj[key].toDate();
      } else if (typeof obj[key] === 'object') {
        this.parseTimestamp(obj[key]);
      }
    });

    return obj;
  };

  findById(id: string): Promise<T> {
    return this.db
      .collection(this.colName)
      .doc(this.docId)
      .collection(this.subColName)
      .doc(id)
      .get()
      .then(this.extractTFromDocSnap);
  }

  create(item: T): Promise<T> {
    // TODO: Double operation here. Should construct T myself with ref.id?

    return this.db
      .collection(this.colName)
      .doc(this.docId)
      .collection(this.subColName)
      .add(item)
      .then(ref => ref.get())
      .then(this.extractTFromDocSnap);
  }

  async update(item: T): Promise<T> {
    // TODO: handle errors
    await this.db
      .collection(this.colName)
      .doc(this.docId)
      .collection(this.subColName)
      .doc(item.id)
      .update(item);
    return item;
  }

  async delete(id: string): Promise<void> {
    // TODO: handle errors
    await this.db
      .collection(this.colName)
      .doc(this.docId)
      .collection(this.subColName)
      .doc(id)
      .delete();
  }

  find(): Promise<T[]> {
    return new QueryBuilder<T>(
      this.db,
      this.colName,
      this.docId,
      this.subColName
    ).find();
  }

  whereEqualTo(prop: keyof T, val: IFirestoreVal): QueryBuilder<T> {
    return new QueryBuilder<T>(
      this.db,
      this.colName,
      this.docId,
      this.subColName
    ).whereEqualTo(prop, val);
  }

  whereGreaterThan(prop: keyof T, val: IFirestoreVal): QueryBuilder<T> {
    return new QueryBuilder<T>(
      this.db,
      this.colName,
      this.docId,
      this.subColName
    ).whereGreaterThan(prop, val);
  }

  whereGreaterOrEqualThan(prop: keyof T, val: IFirestoreVal): QueryBuilder<T> {
    return new QueryBuilder<T>(
      this.db,
      this.colName,
      this.docId,
      this.subColName
    ).whereGreaterOrEqualThan(prop, val);
  }

  whereLessThan(prop: keyof T, val: IFirestoreVal): QueryBuilder<T> {
    return new QueryBuilder<T>(
      this.db,
      this.colName,
      this.docId,
      this.subColName
    ).whereLessThan(prop, val);
  }

  whereLessOrEqualThan(prop: keyof T, val: IFirestoreVal): QueryBuilder<T> {
    return new QueryBuilder<T>(
      this.db,
      this.colName,
      this.docId,
      this.subColName
    ).whereLessOrEqualThan(prop, val);
  }

  whereArrayCointain(prop: keyof T, val: IFirestoreVal): QueryBuilder<T> {
    return new QueryBuilder<T>(
      this.db,
      this.colName,
      this.docId,
      this.subColName
    ).whereArrayCointain(prop, val);
  }
}
