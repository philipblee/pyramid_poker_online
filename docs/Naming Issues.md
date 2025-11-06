# Naming Issues Documentation - Hand Evaluation System

## 🚨 Current Problems

### **1. "rank" Used for Multiple Concepts**
- `handEvaluation.rank` = Hand type code (1-16) 
- `card.rank` = Card face value (A, K, Q, J, 10, etc.)
- `hand.rank` = Primary card rank in hand-detector
- **Problem:** Same word, completely different meanings

### **2. Redundant Data Storage**
```javascript
// hand-detector.js stores same data twice:
{
    handType: "Four of a Kind",           // ← Redundant
    handStrength: {
        name: "Four of a Kind"            // ← Same data!
    }
}
```

### **3. Misleading Property Names**
- `handStrength` in hand-detector → Really should be `handEvaluation`
- `hand_rank` in evaluateHand → Really should be `handStrength` (tie-breaking array)
- `rank` in evaluateHand → Really should be `handType` (numeric code)

## ✅ Proposed Clean Naming System

### **evaluateHand.js Output:**
```javascript
const handEvaluation = {
    handType: 8,                        // Numeric hand type code (1-16)
    handStrength: [8, 14, 13, ...],     // Tie-breaking array  
    name: "Four of a Kind"              // Human-readable description
}
```

### **hand-detector.js Storage:**
```javascript
{
    handEvaluation: handEvaluation,     // Complete evaluation object
    // Remove redundant handType field entirely
}
```

### **Access Patterns:**
```javascript
hand.handEvaluation.handType        // 8 (was hand.handStrength.rank)
hand.handEvaluation.handStrength    // [8, 14, 13, ...] (was hand.handStrength.hand_rank)
hand.handEvaluation.name            // "Four of a Kind" (was hand.handType or hand.handStrength.name)
```

## 📋 Files That Need Updates

### **Core Evaluation:**
- `evaluate-hand.js` - Rename properties in return objects
- `evaluate-hand-new.js` - Rename properties in return objects  
- `incomplete-hand-evaluator.js` - Update return objects

### **Hand Detection:**
- `hand-detector.js` - Rename handStrength → handEvaluation, remove redundant handType

### **Arrangement System:**
- `find-best-setup-no-wild.js` - Update property access
- `hand-sorter.js` - Update comparison logic

### **Utilities:**
- `scoring-utilities.js` - Update property access
- `hand-utilities.js` - Update property access

## 🎯 Benefits After Refactor

1. **Clear Semantics:** Each name means one thing only
2. **No Redundancy:** Single source of truth for each piece of data  
3. **Intuitive Access:** `hand.handEvaluation.handType` is self-documenting
4. **Future-Proof:** New developers won't be confused by naming

## ⚠️ Migration Strategy (When Ready)

1. **Phase 1:** Update evaluateHand.js return objects
2. **Phase 2:** Update hand-detector.js storage
3. **Phase 3:** Update all consuming scripts
4. **Phase 4:** Remove redundant fields
5. **Phase 5:** Test thoroughly

## 🔍 Quick Reference

| **Current** | **Should Be** | **Reason** |
|-------------|---------------|------------|
| `handEvaluation.rank` | `handEvaluation.handType` | Clearer it's the type code |
| `handEvaluation.hand_rank` | `handEvaluation.handStrength` | Clearer it's for tie-breaking |
| `hand.handStrength` | `hand.handEvaluation` | It's the full evaluation, not just strength |
| `hand.handType` | *Remove* | Redundant with handEvaluation.name |

---
**Date:** November 6, 2025  
**Status:** Documented - Ready for Future Implementation
