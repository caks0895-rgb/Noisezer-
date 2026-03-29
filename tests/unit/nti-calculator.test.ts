import { calculateNTI, determineVerdict } from '../../lib/nti-engine/nti-calculator';
import { ScoreBreakdown } from '../../lib/nti-engine/types';

describe('NTI Calculator', () => {
  const mockOnChain: ScoreBreakdown = {
    score: 80,
    breakdown: {}
  };

  const mockOffChain: ScoreBreakdown = {
    score: 40,
    breakdown: {}
  };

  test('should calculate correct NTI score', () => {
    const nti = calculateNTI(mockOnChain, mockOffChain);
    expect(nti).toBe(200); // (80 / 40) * 100 = 200
  });

  test('should determine correct verdict', () => {
    expect(determineVerdict(90)).toBe('ALPHA_SIGNAL');
    expect(determineVerdict(50)).toBe('NEUTRAL');
    expect(determineVerdict(20)).toBe('BS_SIGNAL');
  });
});
