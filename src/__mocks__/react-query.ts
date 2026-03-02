import React from 'react';

export class QueryClient {
  constructor() {}
  clear() {}
  getQueryData() {}
  setQueryData() {}
  invalidateQueries() {}
  prefetchQuery() {}
}

export function QueryClientProvider({ children }: { children: React.ReactNode }) {
  return React.createElement(React.Fragment, null, children);
}

export const useQuery = jest.fn(() => ({
  data: undefined,
  isLoading: false,
  isError: false,
  error: null,
  refetch: jest.fn(),
}));

export const useMutation = jest.fn(() => ({
  mutate: jest.fn(),
  mutateAsync: jest.fn(),
  isPending: false,
  isError: false,
  error: null,
  data: undefined,
}));

export const useQueryClient = jest.fn(() => ({
  invalidateQueries: jest.fn(),
  setQueryData: jest.fn(),
  getQueryData: jest.fn(),
}));
