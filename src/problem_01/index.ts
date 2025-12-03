import { defaultTeardown } from "@effect/platform/Runtime";
import { BunRuntime } from "@effect/platform-bun";
import { Effect, Schema } from "effect";
import { mainLayer } from "./mainLayer";

import * as Dial from "./Dial";
import * as DialWithFullRotationCounter from "./DialWithFullRotationCounter";

import { ArrayFromFallible, getFileString } from "../lib";
import { Instruction } from "./schema";

type Instructions = typeof Instructions.Type;
const Instructions = Schema.split("\n").pipe(
  Schema.transform(ArrayFromFallible(Instruction), {
    strict: false,
    encode: (a) => a,
    decode: (i) => i,
  }),
);

const calculateAllTurns = Effect.fn("followInstructions")(function*(
  dial: Dial.Dial,
  instructions: Instructions,
) {
  return yield* Effect.all(
    instructions.map((instruction) => dial.turn(instruction)),
  );
});

const findOccurencesOf = (targets: number[], turns: number[]) =>
  turns.filter((turn) => targets.includes(turn));

const partOne = Effect.fn("partOne")(function*({
  startingRotation,
  instructions,
}: {
  startingRotation: number;
  instructions: Instructions;
}) {
  const dial = yield* Dial.make(startingRotation);
  const allTurns = yield* calculateAllTurns(dial, instructions);
  const targetOccurences = findOccurencesOf([0], allTurns);
  yield* Effect.log(`Password: ${targetOccurences.length}`);
}, Effect.withLogSpan("[Part One]"));

const partTwo = Effect.fn("partTwo")(function*({
  startingRotation,
  instructions,
}: {
  startingRotation: number;
  instructions: Instructions;
}) {
  const dial = yield* DialWithFullRotationCounter.make(startingRotation);
  yield* calculateAllTurns(dial, instructions);
  const password = yield* dial.getFullRotationCount;
  yield* Effect.log(`Password: ${password}`);
}, Effect.withLogSpan("[Part Two]"));

const program = Effect.gen(function*() {
  const STARTING_ROTATION = 50;
  const content = yield* getFileString("./src/problem_01/input.txt");
  const instructions = yield* Schema.decode(Instructions)(content);
  yield* Effect.fork(
    partOne({
      startingRotation: STARTING_ROTATION,
      instructions,
    }),
  );
  yield* Effect.fork(
    partTwo({
      startingRotation: STARTING_ROTATION,
      instructions,
    }),
  );
}).pipe(Effect.provide(mainLayer));

BunRuntime.runMain({
  teardown: defaultTeardown,
})(program);
