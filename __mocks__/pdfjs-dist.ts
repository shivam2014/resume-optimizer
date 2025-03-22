export const getDocument = jest.fn().mockImplementation(() => ({
  promise: Promise.resolve({
    getPage: jest.fn().mockImplementation(() => ({
      getTextContent: jest.fn().mockResolvedValue({
        items: [{ str: 'mocked pdf content' }],
      }),
    })),
    numPages: 1,
  }),
}));

export const GlobalWorkerOptions = {
  workerSrc: '',
};