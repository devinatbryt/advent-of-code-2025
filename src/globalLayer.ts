import { BunFileSystem } from "@effect/platform-bun";
import { Layer, Logger, LogLevel } from "effect";

export const globalLayer = Layer.mergeAll(BunFileSystem.layer).pipe(
  Layer.provide(
    Logger.replace(
      Logger.prettyLoggerDefault,
      Logger.filterLogLevel(
        Logger.prettyLoggerDefault,
        (level) => level !== LogLevel.Warning,
      ),
    ),
  ),
);
