import {
  Array as A,
  Effect,
  Match,
  Schema,
  Layer,
  identity,
  Ref,
} from "effect";
import { BunRuntime } from "@effect/platform-bun";
import { getFileString, NewLineToArrayFromFallible } from "../lib";
import { Range } from "./schema";
import { globalLayer } from "../globalLayer";
import { Sequence } from "./Sequence";

type Ranges = typeof Ranges.Type;
const Ranges = NewLineToArrayFromFallible(Range);

const getRanges = Effect.fn("getRanges")(function*(path: string) {
  const content = yield* getFileString(path);
  return yield* Schema.decode(Ranges)(content);
});

type Options = {
  fileName: string;
};

const repeatsExactlyTwice = Match.type<number>().pipe(
  Match.when(Match.number, (n) => {
    const s = n.toString();
    const halfLength = Math.floor(s.length / 2);
    if (s.length % 2 !== 0) return false;
    return s.substring(0, halfLength) === s.substring(halfLength);
  }),
  Match.exhaustive,
);

const isRepeatedPattern = Match.type<number>().pipe(
  Match.when(Match.number, (value) => {
    const s = String(value);
    const n = s.length;

    if (n <= 1) return false; // single digit can't be "at least twice"

    // Build prefix-function (KMP "pi" array)
    const pi = new Array<number>(n).fill(0);

    for (let i = 1; i < n; i++) {
      let j = pi[i - 1] as number;

      // Move j back while mismatch and j > 0
      while (j > 0 && s[i] !== s[j]) {
        j = pi[j - 1] as number;
      }

      if (s[i] === s[j]) {
        j++;
      }

      pi[i] = j;
    }

    const lps = pi[n - 1] as number; // longest proper prefix which is also a suffix
    if (lps === 0) return false; // no border → no repetition

    const period = n - lps;

    // Valid “repeated block” only if length is an exact multiple of the period
    if (n % period !== 0) return false;

    const times = n / period;
    if (times < 2) return false; // require "at least twice"

    return true;
  }),
  Match.exhaustive,
);

const findRepeatingNumbers = ([start, end]: Range) =>
  Effect.gen(function*() {
    const sequence = yield* Sequence;
    const values = A.range(start, end);
    const results = yield* Ref.make<number[]>([]);

    yield* Effect.forEach(
      values,
      (value) =>
        Effect.gen(function*() {
          if (yield* sequence.is(value)) {
            yield* Ref.update(results, (current) => A.append(current, value));
          }
        }),
      {
        concurrency: 10,
      },
    );

    return yield* results.get;
  }).pipe(
    Effect.tap((results) =>
      Effect.log(`Found repeating sequence in range ${start}-${end}`).pipe(
        Effect.annotateLogs({
          results,
        }),
      ),
    ),
  );

const calculateSum = A.reduce(0, (sum, id: number) => sum + id);

const getAllInvalidIds = (ranges: Ranges) =>
  Effect.all(
    ranges.map((range) => findRepeatingNumbers(range)),
    {
      concurrency: 5,
    },
  ).pipe(Effect.andThen((results) => A.flatMap(results, identity)));

const calculateSumOfInvalidIds = (ranges: Ranges) =>
  Effect.gen(function*() {
    const invalidIds = yield* getAllInvalidIds(ranges);
    const sum = calculateSum(invalidIds);
    return sum;
  });

const partOne = (ranges: Ranges) =>
  Effect.gen(function*() {
    const sum = yield* calculateSumOfInvalidIds(ranges);
    yield* Effect.log(`Part 1: Sum of invalid IDs: ${sum}`);
  }).pipe(
    Effect.provide(
      Layer.succeed(
        Sequence,
        Sequence.of({
          is: (n: number) => Effect.sync(() => repeatsExactlyTwice(n)),
        }),
      ),
    ),
    Effect.withLogSpan(`[partOne]`),
  );

const partTwo = (ranges: Ranges) =>
  Effect.gen(function*() {
    const sum = yield* calculateSumOfInvalidIds(ranges);
    yield* Effect.log(`Part 1: Sum of invalid IDs: ${sum}`);
  }).pipe(
    Effect.provide(
      Layer.succeed(
        Sequence,
        Sequence.of({
          is: (n: number) => Effect.sync(() => isRepeatedPattern(n)),
        }),
      ),
    ),
    Effect.withLogSpan(`[partTwo]`),
  );

const main = ({ fileName }: Options) =>
  Effect.gen(function*() {
    const baseDir = "./src/problem_02/";
    const ranges = yield* getRanges(`${baseDir}${fileName}`);

    const fiberOne = yield* partOne(ranges).pipe(Effect.fork);
    const fiberTwo = yield* partTwo(ranges).pipe(Effect.fork);
    yield* Effect.all([fiberOne.await, fiberTwo.await], {
      concurrency: "unbounded",
    });
  }).pipe(Effect.provide(globalLayer));

main({
  fileName: "input.txt",
}).pipe(BunRuntime.runMain());
