import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import ResumeOptimizer from '../../components/resume-optimizer';

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock toast
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

jest.mock('@/hooks/use-mobile', () => ({
  useMobile: () => false,
}));

describe('ResumeOptimizer', () => {
  const RESUME_STORAGE_KEY = 'resume-optimizer-state';
  const API_KEYS_STORAGE_KEY = 'resume-optimizer-api-keys';

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  const uploadFile = async () => {
    const file = new File(['test resume content'], 'resume.txt', { type: 'text/plain' });
    const fileInput = screen.getByTestId('file-upload-input');
    
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    // Wait for upload success message
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Resume uploaded',
        description: `File "${file.name}" has been uploaded successfully.`
      });
    });

    return file;
  };

  const navigateToJobDescription = async () => {
    await uploadFile();

    // Reset toast mock after file upload
    mockToast.mockClear();

    // Wait for "Continue to Job Description" button to be enabled
    await waitFor(() => {
      const continueButton = screen.getByRole('button', { name: /continue to job description/i });
      expect(continueButton).not.toBeDisabled();
      return continueButton;
    });

    // Click the button to move to job description
    const continueButton = screen.getByRole('button', { name: /continue to job description/i });
    await act(async () => {
      fireEvent.click(continueButton);
    });

    // Wait for job description panel to be active
    await waitFor(() => {
      expect(screen.getByTestId('job-description-input')).toBeVisible();
    });
  };

  it('loads saved resume state from localStorage on mount', async () => {
    const savedState = {
      fileName: 'test.txt',
      fileSize: 100,
      resumeText: 'Test resume content',
      jobDescription: 'Test job description',
      extractedResume: 'Extracted content',
      optimizedResume: 'Optimized content',
      editedResume: 'Edited content',
      latexContent: 'LaTeX content',
      lastUpdated: Date.now(),
    };

    localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(savedState));
    render(<ResumeOptimizer />);

    // Should have Results tab enabled with saved state
    await waitFor(() => {
      const resultsTab = screen.getByRole('tab', { name: /results/i });
      expect(resultsTab).not.toBeDisabled();
    });
  });

  it('handles file upload and updates state', async () => {
    render(<ResumeOptimizer />);
    
    // Initially continue button should be disabled
    const continueButton = screen.getByRole('button', { name: /continue to job description/i });
    expect(continueButton).toBeDisabled();
    
    await uploadFile();

    // Continue button should now be enabled
    await waitFor(() => {
      expect(continueButton).not.toBeDisabled();
    });

    // Verify localStorage update
    const savedState = JSON.parse(localStorage.getItem(RESUME_STORAGE_KEY) || '{}');
    expect(savedState.fileName).toBe('resume.txt');
    expect(savedState.resumeText).toBe('test resume content');
  });

  it('shows error when optimizing without job description', async () => {
    render(<ResumeOptimizer />);
    await navigateToJobDescription();

    // Click optimize without entering job description
    const optimizeButton = screen.getByRole('button', { name: /optimize resume/i });

    await act(async () => {
      fireEvent.click(optimizeButton);
    });

    // Should show missing information error with exact message
    expect(mockToast).toHaveBeenCalledWith({
      title: "Missing information",
      description: "Please provide both a resume and job description.",
      variant: "destructive",
    });
  });

  it('requires API key for optimization', async () => {
    render(<ResumeOptimizer />);
    await navigateToJobDescription();

    // Enter job description
    const jobDescInput = screen.getByTestId('job-description-input');
    await act(async () => {
      fireEvent.change(jobDescInput, { target: { value: 'Test job description' } });
    });

    // Click optimize
    const optimizeButton = screen.getByRole('button', { name: /optimize resume/i });
    await act(async () => {
      fireEvent.click(optimizeButton);
    });

    // Should show API key error with exact message
    expect(mockToast).toHaveBeenCalledWith({
      title: "API key required",
      description: expect.stringContaining("Please configure your"),
      variant: "destructive",
    });
  });

  it('handles optimization process with valid API key', async () => {
    localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify({
      mistral: 'test-api-key',
      optimizationPrompt: 'test prompt'
    }));

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        result: {
          optimizedText: 'Optimized resume content',
          extractedText: 'Extracted content',
          latexContent: 'LaTeX content',
          improvements: ['Improvement 1'],
          score: 85
        }
      })
    }) as jest.Mock;

    render(<ResumeOptimizer />);
    await navigateToJobDescription();

    // Enter job description
    const jobDescInput = screen.getByTestId('job-description-input');
    await act(async () => {
      fireEvent.change(jobDescInput, { target: { value: 'Test job description' } });
    });

    // Click optimize
    const optimizeButton = screen.getByRole('button', { name: /optimize resume/i });
    await act(async () => {
      fireEvent.click(optimizeButton);
    });

    // Should show success message
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Optimization complete",
        description: "Your resume has been optimized successfully.",
      });
    });

    // Results tab should be enabled
    await waitFor(() => {
      const resultsTab = screen.getByRole('tab', { name: /results/i });
      expect(resultsTab).not.toBeDisabled();
    });
  });

  it('cleans up expired localStorage data on unmount', async () => {
    const oldState = {
      fileName: 'test.txt',
      fileSize: 100,
      resumeText: 'Test content',
      jobDescription: 'Old job description',
      lastUpdated: Date.now() - (25 * 60 * 60 * 1000) // 25 hours old
    };

    localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(oldState));

    const { unmount } = render(<ResumeOptimizer />);

    await act(async () => {
      unmount();
    });

    expect(localStorage.getItem(RESUME_STORAGE_KEY)).toBeNull();
  });
});
