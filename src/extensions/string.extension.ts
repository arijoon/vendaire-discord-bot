interface String {
   remove (pattern: any): string;
}

/** Retrieve a random element from the list */
Object.defineProperty(Array.prototype, 'remove', { value: function(pattern: any) {
    return this.replace(pattern, '');
}
});
