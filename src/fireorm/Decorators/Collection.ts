import { getMetadataStorage } from '../MetadataStorage';

// TODO: make collectionName optional and deduct if null
export default function Collection(collection: string): Function {
  return function(target: any, propertyKey: string) {
    getMetadataStorage().collections.push({
      collection,
      target: target.constructor,
    });
  };
}
