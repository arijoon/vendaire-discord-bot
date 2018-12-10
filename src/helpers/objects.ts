/**
 * Merge objects deep, source values will overwrite target
 */
export function mergeDeep(target, source) {
  let output = Object.assign({}, target);
  if (this.isObject(target) && this.isObject(source)) {
    Object.keys(source).forEach(key => {
      if (this.isObject(source[key])) {
        if (!(key in target))
          Object.assign(output, { [key]: source[key] });
        else
          output[key] = this.mergeDeep(target[key], source[key]);
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

/**
 * Turn an array into an object for easy lookup
 */
export function fromArray(array) {
  const result = {};

  for(let item of array) {
    result[item] = true;
  }

  return result;
}

/**
 * Turn an array into an object and keys are generated using keySelector function
 */
export function mapFromArray(array, keySelector) {
  const result = {};

  for(let item of array) {
    result[keySelector(item)] = item;
  }

  return result;
}