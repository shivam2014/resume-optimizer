import { NextRequest, NextResponse } from 'next/server';
import { POST } from '@/app/api/optimize/route';
import { processResume } from '@/lib/resume-service';

jest.mock('@/lib/resume-service', () => ({
  processResume: jest.fn().mockResolvedValue({
    optimizedContent: 'Optimized resume content',
    scores: { relevance: 0.8 }
  })
}));

jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url, init) => ({
    url,
    json: async () => init?.body ? JSON.parse(init.body) : {},
    method: init?.method || 'GET',
    headers: new Headers(init?.headers || {}),
    clone: function() { return this; },
  })),
  NextResponse: {
    json: jest.fn().mockImplementation((data, init) => ({
      ...data,
      ...init,
    })),
  },
}));

describe('Resume Optimization API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/optimize', {
      method: 'POST',
      body: JSON.stringify(body),
    }) as unknown as NextRequest;
  };

  it('successfully processes a resume', async () => {
    const mockBody = {
      resumeText: 'test resume',
      jobDescription: 'test job',
      provider: 'mistral',
      apiKey: 'test-key',
    };

    const request = createMockRequest(mockBody);
    const response = await POST(request);

    expect(response).toBeDefined();
    expect(processResume).toHaveBeenCalledWith(mockBody);
    expect(response).toHaveProperty('result');
  });

  it('returns 400 when required fields are missing', async () => {
    const mockBody = {
      resumeText: 'test resume',
      // missing required fields
    };

    const request = createMockRequest(mockBody);
    const response = await POST(request);

    expect(response).toHaveProperty('status', 400);
    expect(response).toHaveProperty('error', 'Missing required fields');
  });

  it('returns 500 when processing fails', async () => {
    const mockBody = {
      resumeText: 'test resume',
      jobDescription: 'test job',
      provider: 'mistral',
      apiKey: 'test-key',
    };

    (processResume as jest.Mock).mockRejectedValueOnce(new Error('Processing failed'));

    const request = createMockRequest(mockBody);
    const response = await POST(request);

    expect(response).toHaveProperty('status', 500);
    expect(response).toHaveProperty('error', 'Processing failed');
  });
});