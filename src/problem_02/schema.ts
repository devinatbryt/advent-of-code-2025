import { ParseResult, Schema } from "effect";

export type Range = typeof Range.Type;
export const Range = Schema.TemplateLiteral(
  Schema.Number,
  `-`,
  Schema.Number,
).pipe(
  Schema.transformOrFail(Schema.Tuple(Schema.Int, Schema.Int), {
    strict: false,
    decode: (a, _options, ast, raw) =>
      ParseResult.try({
        try: () => {
          const [from, to] = a.split("-");
          return [Number(from), Number(to)];
        },
        catch: (_e) =>
          new ParseResult.Type(
            ast,
            raw,
            `Invalid range "${raw}". Expected format: "from-to"`,
          ),
      }),
    encode: (i) => ParseResult.succeed(`${i[0]}-${i[1]}`),
  }),
);
