#!/bin/bash

# Script to help fix 'any' type usages
# This script identifies files with the most 'any' types and provides guidance

echo "🔍 Analyzing 'any' type usages..."
echo ""

# Get files with most 'any' types
echo "📊 Files with most 'any' types:"
echo ""

npm run lint 2>&1 | \
  grep "no-explicit-any" -B 1 | \
  grep "\.ts" | \
  sort | uniq -c | \
  sort -rn | \
  head -20 | \
  while read count file; do
    # Extract just the filename
    filename=$(echo "$file" | sed 's/.*EMSS-main\///' | sed 's/:.*//')
    echo "  $count issues - $filename"
  done

echo ""
echo "💡 Recommended fixes:"
echo ""
echo "1. Import type helpers:"
echo "   import type { JsonObject, DatabaseResult } from '@/lib/database/type-helpers'"
echo ""
echo "2. Replace common 'any' patterns:"
echo "   - Record<string, any> → JsonObject"
echo "   - any[] → JsonValue[] or specific type[]"
echo "   - Function parameters: any → unknown (then type guard)"
echo "   - Supabase results: any → use type helpers"
echo ""
echo "3. For complex objects, create interfaces:"
echo "   interface MyObject {"
echo "     field1: string"
echo "     field2: number"
echo "   }"
echo ""
echo "4. Use type assertions when necessary:"
echo "   const data = result as MyType"
echo ""
echo "5. For truly dynamic data:"
echo "   - Use 'unknown' instead of 'any'"
echo "   - Add type guards to validate"
echo ""

echo "🎯 Priority order:"
echo "  1. Database layer (repositories, service, client)"
echo "  2. API routes (auth, campaigns, contacts)"
echo "  3. Service layers (email, sms, shopify)"
echo "  4. Utility functions"
echo ""

echo "✅ Type helper utilities created:"
echo "  - src/lib/database/type-helpers.ts"
echo "  - Provides: DatabaseResult, JsonObject, type guards, etc."
echo ""

echo "📝 To fix a specific file:"
echo "  1. Open the file"
echo "  2. Find each 'any' usage"
echo "  3. Replace with appropriate type from type-helpers.ts"
echo "  4. Test with: npx tsc --noEmit <filename>"
echo ""
