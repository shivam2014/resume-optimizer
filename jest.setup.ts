import '@testing-library/jest-dom';
import 'whatwg-fetch';
import type { ImageProps } from 'next/image';

// Mock window.matchMedia
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
};

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage({
    src,
    alt = '',
    priority = false,
    loading,
    onLoadingComplete,
    width,
    height,
    style = {},
    ...props
  }: ImageProps) {
    // Handle different types of src
    let imgSrc = '';
    if (typeof src === 'string') {
      imgSrc = src;
    } else if (typeof src === 'object' && src !== null) {
      imgSrc = (src as { src?: string }).src || 
               (src as { default?: string }).default || '';
    }
    
    const mockProps = {
      src: imgSrc,
      alt,
      width: width || undefined,
      height: height || undefined,
      loading: loading as HTMLImageElement['loading'],
      'data-testid': 'mock-image',
      'data-nimg': '1',
      'data-priority': priority ? 'true' : undefined,
      style: {
        color: 'transparent',
        ...style,
      },
      ...props,
    };

    // Create and configure the mock element
    const mockElement = document.createElement('img');
    Object.assign(mockElement, mockProps);

    // Simulate image load completion
    if (onLoadingComplete) {
      setTimeout(() => {
        onLoadingComplete(mockElement);
      }, 0);
    }

    return mockElement;
  },
}));