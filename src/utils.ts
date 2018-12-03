export const getUnixTimeFromDate = (date: Date) =>
  Math.round(date.getTime() / 1000);

export const asyncForEach = async (array: Array<any>, cb: Function) => {
  for (let index = 0; index < array.length; index++) {
    await cb(array[index], index, array);
  }
};
