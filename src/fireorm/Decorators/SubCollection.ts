import { getMetadataStorage } from '../MetadataStorage';

// TODO: Investigate about using constructor to filter to skip passing collection name
// TODO: make subCollectionName optional and deduct if null
export default function SubCollection(
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
