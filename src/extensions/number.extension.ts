interface Number {
    clamp(min: number, max: number);
}

/** Clamp a number in range */
Object.defineProperty(Array.prototype, 'clamp', { value: function(min, max) {
  return Math.min(Math.max(this, min), max);
}
});

