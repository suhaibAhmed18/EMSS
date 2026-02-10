#!/bin/bash

# Script to help identify and remove unused imports
# Run with: bash cleanup-unused.sh

echo "🔍 Finding unused imports and variables..."
echo ""

# Run ESLint to get all unused variable warnings
npx eslint --format=json --quiet 2>/dev/null | \
  node -e "
    const fs = require('fs');
    const input = fs.readFileSync(0, 'utf-8');
    try {
      const results = JSON.parse(input);
      const unused = [];
      
      results.forEach(file => {
        file.messages.forEach(msg => {
          if (msg.ruleId === '@typescript-eslint/no-unused-vars') {
            unused.push({
              file: file.filePath,
              line: msg.line,
              message: msg.message
            });
          }
        });
      });
      
      console.log('Found', unused.length, 'unused variables/imports');
      console.log('');
      console.log('Top files with unused imports:');
      
      const fileCount = {};
      unused.forEach(item => {
        const file = item.file.split('/').slice(-3).join('/');
        fileCount[file] = (fileCount[file] || 0) + 1;
      });
      
      Object.entries(fileCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .forEach(([file, count]) => {
          console.log(`  ${count.toString().padStart(3)} - ${file}`);
        });
    } catch (e) {
      console.log('Error parsing ESLint output');
    }
  "

echo ""
echo "💡 To fix unused imports automatically, you can:"
echo "   1. Use your IDE's 'Organize Imports' feature"
echo "   2. Or manually remove unused imports from the files listed above"
echo ""
echo "🔧 For unused variables that are intentional (like error handlers),"
echo "   prefix them with underscore: const _error = ..."
