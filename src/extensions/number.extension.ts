interface Number {
    clamp(min: number, max: number);
}

/** Clamp a number in range */
Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
};

