// tslint:disable-next-line:no-import-side-effect
import 'reflect-metadata';
import { IRepository, IFirestoreVal, IQueryBuilder } from './types';
import QueryBuilder from './QueryBuilder';
import { Firestore, DocumentSnapshot } from '@google-cloud/firestore';
import { getMetadataStorage } from '.';
import BaseSubCollectionRepository from './BaseSubCollectionRepository';

// TODO: pub/sub for realtime updates

export default abstract class BaseFirestoreRepository<T extends { id: string }>
  implements IRepository<T>, IQueryBuilder<T> {
  // TODO: Ordering
  // TODO: limit
  // TODO: open transactions? (probably in uof)
  // TODO: colname = classname unless param is passed
  // TODO: @createdOnField, @updatedOnField
  // TODO: well defined types, investigate

  constructor(protected db: Firestore, protected colName: string) {}

  private extractTFromDocSnap = (doc: DocumentSnapshot): T => {
    if (!doc.exists) {
      return null;
    }

    const entity = this.parseTimestamp(doc.data() as T);

    const subcollections = getMetadataStorage().subCollections.filter(
      sc => sc.collection === this.colName
    );

    subcollections.forEach(subCol => {
      // tslint:disable-next-line:no-shadowed-variable
      const T = subCol.entity;
      Object.assign(entity, {
        [subCol.attribute]: new BaseSubCollectionRepository2<T>(
          this.db,
          this.colName,
          doc.id,
          subCol.subcollection
        ),
      });
    });

    return entity;
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
      .doc(id)
      .get()
      .then(this.extractTFromDocSnap);
  }

  create(item: T): Promise<T> {
    // TODO: Double operation here. Should construct T myself with ref.id?

    return this.db
      .collection(this.colName)
      .add(item)
      .then(ref => ref.get())
      .then(this.extractTFromDocSnap);
  }

  async update(item: T): Promise<T> {
    // TODO: handle errors
    await this.db
      .collection(this.colName)
      .doc(item.id)
      .update(item);
    return item;
  }

  async delete(id: string): Promise<void> {
    // TODO: handle errors
    await this.db
      .collection(this.colName)
      .doc(id)
      .delete();
  }

  find(): Promise<T[]> {
    return new QueryBuilder<T>(this.db, this.colName).find();
  }

  whereEqualTo(prop: keyof T, val: IFirestoreVal): QueryBuilder<T> {
    return new QueryBuilder<T>(this.db, this.colName).whereEqualTo(prop, val);
  }

  whereGreaterThan(prop: keyof T, val: IFirestoreVal): QueryBuilder<T> {
    return new QueryBuilder<T>(this.db, this.colName).whereGreaterThan(
      prop,
      val
    );
  }

  whereGreaterOrEqualThan(prop: keyof T, val: IFirestoreVal): QueryBuilder<T> {
    return new QueryBuilder<T>(this.db, this.colName).whereGreaterOrEqualThan(
      prop,
      val
    );
  }

  whereLessThan(prop: keyof T, val: IFirestoreVal): QueryBuilder<T> {
    return new QueryBuilder<T>(this.db, this.colName).whereLessThan(prop, val);
  }

  whereLessOrEqualThan(prop: keyof T, val: IFirestoreVal): QueryBuilder<T> {
    return new QueryBuilder<T>(this.db, this.colName).whereLessOrEqualThan(
      prop,
      val
    );
  }

  whereArrayCointain(prop: keyof T, val: IFirestoreVal): QueryBuilder<T> {
    return new QueryBuilder<T>(this.db, this.colName).whereArrayCointain(
      prop,
      val
    );
  }
}

class BaseCollectionRepository<
  T extends { id: string }
> extends BaseFirestoreRepository<T> {}

class BaseSubCollectionRepository2<
  T extends { id: string }
> extends BaseSubCollectionRepository<T> {}
