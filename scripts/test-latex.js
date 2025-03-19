const { parse, HtmlGenerator } = require('latex.js');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

// Set up JSDOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

async function testLatexSetup() {
  try {
    // Test with simple content
    const testContent = `
\\documentclass{article}
\\begin{document}
Simple test content
\\end{document}`;
    
    // Try parsing
    const generator = new HtmlGenerator({ hyphenate: false });
    parse(testContent, { generator });
    
    console.log('LaTeX.js setup test: SUCCESS');
  } catch (error) {
    console.error('LaTeX.js setup test: FAILED');
    console.error(error);
  }
}

testLatexSetup();