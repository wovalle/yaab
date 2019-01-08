import { getMetadataStorage } from '../MetadataStorage';
import { plural } from 'pluralize';

// TODO: make collectionName optional and deduct if null
export default function Collection(name?: string): Function {
  return function(target: any, propertyKey: string) {
    getMetadataStorage().collections.push({
      name: name || plural(propertyKey),
      target,
    });
  };
}
