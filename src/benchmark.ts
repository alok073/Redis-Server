import { randomBytes } from 'crypto';
import { createClient } from 'redis';
import { RedisServer } from './redisServer';

const numberOfConcurrentClients = 10;
const totalNoOfTimesOperations = 100;
const sizeOfKeyInBytes = 1024;
const host = 'redis://127.0.0.1:6379';

const randomString = () => randomBytes(sizeOfKeyInBytes).toString('ascii');

/**
 * This function creates a Client, connects it to the server and returns two functions namely benchmark and teardown.
 * + benchmark: Returns a promise that performs three Redis operations - set, get, and delete.
 * + teardown: Returns a promise that disconnects the Redis client.
 *
 * @async
 * @returns {unknown}
 */
async function createJob() {
  const client = createClient({
    url: host
  });
  await client.connect();

  const str = randomString();

  return {
    benchmark() {
      return Promise.all([
        client.set(str, str),
        client.get(str)
      ]);
    },
    teardown() {
      return client.disconnect();
    }
  };
}

const main = async () => {
  const server = new RedisServer();
  server.startServer();
  const { benchmark, teardown } = await createJob();

  async function run(totalNoOfTimesOperationToBePerformed: number) {
    return new Promise<void>((res) => {
      let operationsCompleted = 0;
      let operationsInProgress = 0;

      async function run() {
        ++operationsInProgress;
        ++operationsCompleted;

        await benchmark();
        --operationsInProgress;

        if (operationsCompleted < totalNoOfTimesOperationToBePerformed) {
          run();
        } else if (operationsInProgress === 0) {
          res();
        }
      }

      const toInitiate = Math.min(numberOfConcurrentClients, totalNoOfTimesOperationToBePerformed);

      // Calling run and not waiting for it creates concurrency
      for (let i = 0; i < toInitiate; i++) {
        run();
      }
    });
  }

  // warmup
  await run(Math.min(totalNoOfTimesOperations * 0.1, 10_000));

  // benchmark
  const benchmarkStart = process.hrtime.bigint();
  await run(totalNoOfTimesOperations);
  const benchmarkNanoseconds = process.hrtime.bigint() - benchmarkStart;

  const json = {
    totalNoOfTimesOperations: totalNoOfTimesOperations,
    numberOfConcurrentClients: numberOfConcurrentClients,
    operationsPerSecond: (totalNoOfTimesOperations / Number(benchmarkNanoseconds)) * 1_000_000_000
  };

  console.table(json);
  await teardown();
  await server.stopServer();
};

main();
