import { Effect, identity, ParseResult, Schema } from "effect";
import { isNotNullable } from "effect/Predicate";

export const NullableOrFromFallible = <A, I, R>(
  self: Schema.Schema<A, I, R>,
  options?: { readonly logPrefix?: string },
) =>
  Schema.NullOr(self).annotations({
    decodingFallback: (issue) =>
      Effect.logWarning(
        `[${options?.logPrefix ?? "NullableOrFromFallible"}] ${ParseResult.TreeFormatter.formatIssueSync(issue)}`,
      ).pipe(Effect.as(null)),
  });

export const ArrayFromFallible = <A, I, R>(self: Schema.Schema<A, I, R>) =>
  Schema.Array(
    NullableOrFromFallible(self, { logPrefix: "ArrayFromFallible" }),
  ).pipe(
    Schema.transform(Schema.typeSchema(Schema.Array(self)), {
      decode: (i) => i.filter(isNotNullable),
      encode: identity,
      strict: true,
    }),
  );
