import ts from "typescript";

export type HintRequest =
  & ts.LineAndCharacter
  & {
    file: string;
    code: string;
    tabSize: number;
  }
  & (
    | {
      type: "click";
      meta?: boolean;
    }
    | {
      type: "hover";
    }
  );

export interface HintResponse {
  occurrences?: {
    isWriteAccess?: boolean;
    range: ts.LineAndCharacter;
    width: number;
  }[];
  definition?: ts.LineAndCharacter;
  quickInfo?: {
    info: ts.SymbolDisplayPart[] | string;
    range: ts.LineAndCharacter;
    width: number;
  };
}
