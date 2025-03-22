import { FC } from 'react';

const MockLatexPreview: FC<{ content: string }> = ({ content }) => (
  <div data-testid="mock-latex-preview">{content}</div>
);

export default MockLatexPreview;