interface String {
   remove (pattern: any): string;
}

/** Retrieve a random element from the list */
String.prototype.remove = function(pattern: any) {
    return this.replace(pattern, '');
}
