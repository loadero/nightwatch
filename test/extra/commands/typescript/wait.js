// NOTE: this file represents a compiled version of `wait.ts` generated by `tsc`.

module.exports.command = function(timeout = 0) {
  return this
    .perform(() => console.log(`Waiting ${timeout}ms`))
    .pause(timeout);
};
