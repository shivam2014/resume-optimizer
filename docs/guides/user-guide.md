# Resume Optimizer User Guide

## Overview
The Resume Optimizer is an AI-powered tool that helps improve your resume by analyzing and optimizing its content for better job application success.

## Getting Started

### Prerequisites
- Active API key for the service
- Resume in text or PDF format
- Modern web browser

### API Key Setup
1. Navigate to Settings
2. Click on "API Key Configuration"
3. Enter your API key
4. Click Save

## Features

### Resume Analysis
- Content optimization suggestions
- Keyword analysis
- ATS compatibility check
- Industry-specific recommendations

### LaTeX Templates
The Resume Optimizer supports dynamic LaTeX template previews and customization:

#### Template Preview Carousel
- Interactive preview of available LaTeX templates
- Real-time visualization of your content in different formats
- Responsive design with touch/swipe support
- Quick template comparison and selection

#### Live LaTeX Rendering
- Real-time preview of LaTeX content
- Custom styling support for each template
- Error handling and validation
- Mobile-friendly responsive display

#### Template Selection and Customization
- One-click template switching
- Custom style application
- Template-specific formatting options
- Source attribution and documentation

#### Style Management
- Template-specific CSS styling
- Dynamic style loading
- Custom font support
- Responsive scaling for different screen sizes

### Comparison View
Compare your original resume with the optimized version side by side.

### Format Support
- Plain text (.txt)
- PDF documents
- Word documents (.docx)

## Best Practices
1. Keep formatting simple and ATS-friendly
2. Include relevant keywords from the job description
3. Use clear section headings
4. Proofread before and after optimization

## Security
- API keys are stored securely in your browser
- Documents are processed locally when possible
- Sensitive information is encrypted during transmission

## Troubleshooting

### Common Issues
1. **API Key Error**
   - Verify the API key is entered correctly
   - Check if the key has expired
   - Ensure you have sufficient credits

2. **File Upload Issues**
   - Check file size (max 5MB)
   - Ensure file format is supported
   - Try converting PDF to text if issues persist

3. **Optimization Not Working**
   - Clear browser cache
   - Check internet connection
   - Verify API key status

## Support
For additional help or bug reports, please visit our GitHub repository's issues section.

## Development

### Testing Coverage
The Resume Optimizer maintains comprehensive test coverage for all components:

#### Test Suite Overview
- Jest + React Testing Library setup
- Integration with Next.js testing patterns
- Snapshot testing for UI components
- Unit tests for utility functions

#### Component Testing
##### ClientLatexPreview
- Server/client rendering verification
- LaTeX content rendering validation
- Error handling and fallback states
- Custom styling integration tests

##### TemplatePreviewCarousel
- Template loading and display
- Carousel navigation functionality
- Template selection events
- Responsive behavior testing
- Style management verification

#### Test Execution Guidelines
1. Run complete test suite: `npm test`
2. Watch mode for development: `npm test:watch`
3. Coverage report generation: `npm test:coverage`
4. Component-specific tests: `npm test <component-name>`