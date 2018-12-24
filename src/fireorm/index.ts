// tslint:disable-next-line:no-import-side-effect
import 'reflect-metadata';

export const storage = {
  getGlobal: (): any => global,
};

interface MetadataElement {
  target: Function;
}

export interface CollectionMetadata extends MetadataElement {
  collection: string;
}

export interface SubCollectionMetadata extends MetadataElement {
  collection: string;
  subcollection: string;
  attribute: string;
  entity: Function;
}

// TODO: create repository metadata storage
export class MetadataStorage {
  readonly collections: CollectionMetadata[] = [];
  readonly subCollections: SubCollectionMetadata[] = [];
}

export const getMetadataStorage = (): MetadataStorage => {
  const global = storage.getGlobal();

  if (!global.metadataStorage) global.metadataStorage = new MetadataStorage();

  return global.metadataStorage;
};

// TODO: Investigate about using constructor to filter to skip passing collection name
// TODO: make subCollectionName optional and deduct if null
export function SubCollection(
  entity: Function,
  subcollection: string,
  collection: string
): Function {
  return function(target: any, propertyKey: string) {
    getMetadataStorage().subCollections.push({
      attribute: propertyKey,
      entity,
      collection,
      subcollection,
      target: target.constructor,
    });
  };
}

// TODO: make collectionName optional and deduct if null
export function Collection(collection: string): Function {
  return function(target: any, propertyKey: string) {
    getMetadataStorage().collections.push({
      collection,
      target: target.constructor,
    });
  };
}
