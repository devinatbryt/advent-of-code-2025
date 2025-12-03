import { Schema } from "effect";

export type Instruction = typeof Instruction.Type;
export const Instruction = Schema.Union(
  Schema.TemplateLiteral("L", Schema.Number),
  Schema.TemplateLiteral("R", Schema.Number),
).pipe(
  Schema.transform(
    Schema.Struct({
      direction: Schema.Literal("L", "R"),
      amount: Schema.Int,
    }),
    {
      decode: (i) => ({
        direction: i.substring(0, 1) as "L" | "R",
        amount: parseInt(i.substring(1), 10),
      }),
      encode: (i) => `${i.direction}${i.amount}` as `L${number}` | `R${number}`,
    },
  ),
);
