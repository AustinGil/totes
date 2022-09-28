class FethhError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = 'FethhError';
  }
}

class LazyPromise extends Promise {
  constructor(function_) {
    super(() => {});
    if (typeof function_ !== 'function') {
      throw new TypeError(`Promise resolver is not a function`);
    }
    this._fn = function_;
  }
  // eslint-disable-next-line unicorn/no-thenable
  then() {
    this.promise = this.promise || new Promise(this._fn);
    return this.promise.then.apply(this.promise, arguments);
  }
}

/**
 * @param {Parameters<typeof fetch>[0]} input
 * @param {Parameters<typeof fetch>[1]} [init]
 */
function fethh(input, init = {}) {
  const controller = new AbortController();
  if (!init.signal) {
    init.signal = controller.signal;
  }

  // Create custom return Promise with custom properties
  /** @type {Promise<Response & { data: any }> & { abort: typeof controller.abort }} */
  const promise = new LazyPromise((resolve, reject) => {
    fetch(input, init)
      .then((response) => {
        // In the event of bad requests, throw custom error with access to response object
        if (!response.ok) {
          // TODO: How to handle 300s?
          throw new FethhError(`${response.status} ${response.statusText}`, {
            cause: response,
          });
        }

        // Grab response.json for JSON, otherwise use response.text
        let method = 'text';
        if (response.headers.get('content-type').includes('application/json')) {
          method = 'json';
        }
        // Append data property to response object with results
        return response[method]().then((data) => {
          response.data = data;
          return response;
        });
      })
      .then((response) => {
        // setTimeout(() => resolve(response), 300);
        resolve(response);
      })
      .catch(reject);
  });

  promise.abort = () => controller.abort();
  return promise;
}

export default fethh;
