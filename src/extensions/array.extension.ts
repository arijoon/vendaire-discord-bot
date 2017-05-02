interface Array<T> {
   crandom(): T;
   popRandom (): T;
}

/** Retrieve a random element from the list */
 Object.defineProperty(Array.prototype, 'crandom', { value: function() {

    let index = Math.floor(Math.random() * this.length);

    return this[index];
}
});

Object.defineProperty(Array.prototype, 'popRandom', { value: function() {

    let index = Math.floor(Math.random() * this.length);

    let result = this[index];
    this.splice(index, 1);

    return result;
}
});