declare module 'latex.js' {
  export class LaTeX {
    constructor(options: {
      hyphenate?: boolean;
      mathjax?: {
        displayMath: [string, string][];
        inlineMath: [string, string][];
      };
    });
    
    render(
      content: string,
      options: {
        format: 'html';
        documentClass: string;
        packages: string[];
      }
    ): HTMLElement;
  }
}