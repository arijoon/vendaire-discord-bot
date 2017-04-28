interface Array<T> {
   random(): T;
   popRandom (): T;
}

/** Retrieve a random element from the list */
Array.prototype.random = function() {

    let index = Math.floor(Math.random()*this.length);

    return this[index];
}

Array.prototype.popRandom = function() {

    let index = Math.floor(Math.random()*this.length);

    let result = this[index];
    this.splice(index, 1);

    return result;
}