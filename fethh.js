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

const factory = (function create(defaults = {}) {
  /**
   * @param {Parameters<typeof fetch>[0]} url
   * @param {Parameters<typeof fetch>[1] & {
   * data?: string | object,
   * json?: string | object,
   * timeout?: number
   * retry?: number
   * retryWait?: number
   * retryExponential?: boolean,
   * modifyRequest?: (init: Parameters<typeof fethh>[1]) => Parameters<typeof fethh>[1]
   * modifyResponse?: (response: ReturnType<fethh>) => any
   * }} [init]
   */
  function fethh(url, init = {}) {
    if (defaults.baseUrl) {
      url = new URL(url, defaults.baseUrl);
    }
    init = {
      ...defaults,
      ...init,
    };
    const controller = new AbortController();
    if (!init.signal) {
      init.signal = controller.signal;
    }
    init.headers = init.headers || {};

    // Create custom return Promise with custom properties
    /** @type {Promise<Response & { data: any }> & { abort: typeof controller.abort }} */
    const promise = new LazyPromise(async (resolve, reject) => {
      try {
        if (init.timeout != undefined) {
          setTimeout(() => {
            reject(new FethhError('HTTP request exceeded timeout limit.'));
          }, init.timeout);
        }

        if (
          !init.body &&
          ['POST', 'PATCH', 'PUT'].includes(init.method?.toUpperCase())
        ) {
          if (init.json) {
            init.headers['content-type'] = 'application/json';
            init.body = JSON.stringify(init.json);
          }
          init.body = new URLSearchParams(init.data);
        }

        if (init.modifyRequest) {
          init = init.modifyRequest(init);
        }

        let response = await fetch(url, init);
        // In the event of bad requests
        if (!response.ok) {
          const retry = init.retry;
          // Check if we need to retry request more times
          if (retry) {
            init.retryWait = init.retryWait || 500;
            console.log('retrying', retry, init.retryWait);
            await new Promise((r) => setTimeout(r, init.retryWait));

            const exponential =
              init.retryExponential != undefined ? init.retryExponential : true;
            init.retryWait = exponential ? init.retryWait * 2 : init.retryWait;
            return resolve(
              fethh(url, {
                ...init,
                retry: retry - 1,
              })
            );
          } else {
            // throw custom error with access to response object
            // TODO: How to handle 300s?
            throw new FethhError(`${response.status} ${response.statusText}`, {
              cause: response,
            });
          }
        }

        // Grab response.json for JSON, otherwise use response.text
        let bodyType = 'text';
        if (
          response.headers.get('content-type')?.includes('application/json')
        ) {
          bodyType = 'json';
        }

        // Append data property to response object with results
        const data = await response[bodyType]();
        response.data = data;

        if (init.modifyResponse) {
          response = init.modifyResponse(response);
        }

        resolve(response);
      } catch (error) {
        reject(error);
      }
    });

    promise.abort = () => controller.abort();
    return promise;
  }

  /** @typedef {(url: Parameters<typeof fethh>[0], init: Parameters<typeof fethh>[1]) => ReturnType<fethh>} FethhMethod */
  /** @type {FethhMethod} */
  fethh.get = (url, init) => fethh(url, { ...init, method: 'get' });
  /** @type {FethhMethod} */
  fethh.post = (url, init) => fethh(url, { ...init, method: 'post' });
  /** @type {FethhMethod} */
  fethh.put = (url, init) => fethh(url, { ...init, method: 'put' });
  /** @type {FethhMethod} */
  fethh.patch = (url, init) => fethh(url, { ...init, method: 'patch' });
  /** @type {FethhMethod} */
  fethh.delete = (url, init) => fethh(url, { ...init, method: 'delete' });

  fethh.create = create;

  return fethh;
})();

// fethh.create = (defaultInit) => {
//   return (url, init) => fethh(url, { ...defaultInit, ...init });
// };

export default factory;
