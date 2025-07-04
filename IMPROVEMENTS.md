# Pyramid Poker - Improvements & Issues

## Issues Found - July 4, 2025

### Scoring System Needs Enhancement
- **Date**: July 4, 2025  
- **Context**: Cases 1-5 testing shows 4 Aces = 4 Eights = same score
- **Root Problem**: Using only `positionScore` (points if win) without probability
- **Proper Formula**: Expected Value = positionScore × P(win)
- **Current Impact**: Multiple "optimal" solutions with identical scores
- **Example**: 4 Aces should score higher than 4 Eights (higher win probability)
- **Priority**: HIGH - affects optimization accuracy

#### Interim Solution (Hand Strength Tiebreaker)
- Use hand ranking tuples to break ties between same hand types
- Royal Straight Flush > King-high Straight Flush  
- 4 Aces > 4 Kings > 4 Queens, etc.
- **File to modify**: `ScoringUtilities.js` or arrangement generators

#### Long-term Solution (Probability Integration)
- Calculate P(win) for each hand type and strength
- Multiply by position points for true expected value
- **Research needed**: Win probability calculations vs opponents

### Smart vs Brute Force Testing
- **Date**: July 4, 2025
- **Context**: Testing cases 1-5 comparison
- **Issue**: [What did you notice that needs fixing?]
- **Priority**: TBD
- **Status**: Not started

## Future Improvements

### Naming Refactor
- **Issue**: "arrangement" terminology is verbose
- **Better names**: one-wild-optimizer.js, one-wild-solver.js, etc.
- **Status**: Noted for future refactor

### Code Organization
- **Issue**: HandSorter could be integrated into HandDetector
- **Status**: Partially completed (auto-sorting added)

---
*Add new issues at the top for easy tracking*