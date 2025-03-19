declare module 'latex.js' {
  export class HtmlGenerator {
    constructor(options: {
      hyphenate?: boolean;
      styleSheet?: string[];
    });
    stylesAndScripts(): string;
    documentFragment: {
      innerHTML: string;
    };
  }

  export function parse(
    content: string,
    options: { generator: HtmlGenerator }
  ): void;
}