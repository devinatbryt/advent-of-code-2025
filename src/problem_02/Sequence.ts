import { Context, type Effect } from "effect";

interface SequenceImpl {
  is: (n: number) => Effect.Effect<boolean>;
}

export class Sequence extends Context.Tag("Sequence")<
  Sequence,
  SequenceImpl
>() { }
