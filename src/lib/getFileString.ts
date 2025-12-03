import { FileSystem } from "@effect/platform";
import { Effect } from "effect";

export const getFileString = Effect.fn("getFileString")(function*(
  path: string,
) {
  const fs = yield* FileSystem.FileSystem;
  return yield* fs.readFileString(path, "utf8").pipe(
    Effect.tap(() =>
      Effect.log(`Read file`).pipe(
        Effect.annotateLogs({
          path,
        }),
      ),
    ),
  );
});
