import fethh from './fethh.js';

// const URL = 'https://jsonplaceholder.typicode.com/posts';
// const URL = 'http://httpstat.us/200';
// const URL = 'http://httpstat.us/500';

/**
 * WISH LIST
 * 6. upload progress
 * 7. download progress
 *
 * NAILED IT!!
 * timeout
 * simpler HTTP verbs fethh.post(URL)
 * API factory
 * retries
 * lazy evaluation
 * preprocess/postprocess
 * simplified body data flow
 * abort support
 * idiomatic errors
 */

const API = fethh.create({
  baseUrl: 'https://jsonplaceholder.typicode.com',
  modifyRequest(init) {
    // ex. Add Auth header to every request
    init.headers.Authorization = 'Bearer token123';
    return init;
  },
  modifyResponse(response) {
    // ex. Add response/error handling for every request
    // return response;
    return { data: 'poop' };
  },
  mode: 'cors',
  credentials: 'include',
});

try {
  const request = API.post('/posts', {
    json: {
      a: 1,
    },
  });

  const { data } = await request;
  console.log({ data });
} catch (error) {
  console.log({ error });
}
