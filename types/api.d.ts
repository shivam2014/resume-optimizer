export interface OptimizationResponse {
  result: {
    optimizedText: string;
    improvements: string[];
    score: number;
  };
}