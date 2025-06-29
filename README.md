# Crypto Trading Bot Frontend

## Frontend Development Instruction Evolution

**Initial Issue (v1):** Generic frontend instructions led to production issues including mock data contamination, improper initialization sequences, navigation overlaps, and missing error handling.

**Problems Encountered:** 
- Mock data generation in error handlers instead of clean empty states
- Missing `init()` method calls causing navigation failures  
- Page overlap due to improper container clearing
- Excessive API polling causing 404 spam

**Improvements (v2):** Added explicit guidelines for proper initialization patterns, empty-state-first design, clean error handling with zero values, and responsible API integration practices.

**Result:** Instructions now enforce production-ready patterns that prevent common frontend architecture mistakes.