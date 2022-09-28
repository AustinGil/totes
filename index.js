import fethh from './fethh.js';

// const URL = 'https://jsonplaceholder.typicode.com/posts';
const URL = 'http://httpstat.us/200';
// const URL = 'http://httpstat.us/500';

/**
 * WISH LIST
 * 2. timeout
 * 3. simpler HTTP verbs fethh.post(URL)
 * 5. retries
 * 6. upload progress
 * 7. download progress
 *
 * NAILED IT!!
 * lazy evaluation
 * simplified body data flow
 * abort support
 * idiomatic errors
 */

try {
  const request = fethh(URL, {
    method: 'POST',
    retry: {
      count: 4,
      wait: 500,
      exponential: true,
    },
  });
  // request.abort();
  console.log(request);

  const { data } = await request;
  console.log({ data });
} catch (error) {
  console.log(error);
}
