interface Array<T> {
   random(): T;
}

/** Retrieve a random element from the list */
Array.prototype.random = function() {
    let index = Math.floor(Math.random()*this.length);
    return this[index];
}