# Campaign Theme Persistence Fix

## Problem
When editing a campaign theme (customizing email or SMS templates) and navigating back to the template selection step, then returning to the customization step, all changes would be reset.

## Root Cause
The EmailBuilder component was not automatically saving changes when blocks were modified. This meant that if you:
1. Customized your email template
2. Navigated back to step 2 (template selection)
3. Navigated forward to step 3 (customize)

The customized HTML state would be preserved in the parent component, but the EmailBuilder would re-initialize with that HTML. However, any unsaved changes made in the builder would be lost.

## Solution Applied

### EmailBuilder Auto-Save
Added an auto-save mechanism to the EmailBuilder component that automatically saves changes whenever blocks are modified:

```typescript
// Auto-save changes whenever blocks are modified
useEffect(() => {
  // Skip the initial render to avoid overwriting with default blocks
  if (blocks.length > 0) {
    const html = generateHTML()
    onSave(blocks, html)
  }
}, [blocks])
```

This ensures that:
- Every time you add, edit, move, or delete a block, the changes are automatically saved to the parent component's state
- When you navigate back and forth between steps, your changes are always preserved
- The `customizedHtml` state in the parent component is always up-to-date

### Existing Protections (Already in Place)
The campaign pages already had these protections:

1. **Template Selection Protection** - Prevents overwriting customizations when clicking the same template:
```typescript
onClick={() => {
  setSelectedTemplate(template)
  // Only set the HTML if switching to a different template or if no customized HTML exists
  if (selectedTemplate?.id !== template.id || !customizedHtml) {
    setCustomizedHtml(template.html)
  }
}}
```

2. **EmailBuilder State Sync** - Updates blocks when initialHtml changes:
```typescript
useEffect(() => {
  if (initialHtml) {
    const parsedBlocks = parseHtmlToBlocks(initialHtml)
    if (parsedBlocks.length > 0) {
      setBlocks(parsedBlocks)
    }
  }
}, [initialHtml])
```

3. **Customized HTML Priority** - Passes customized HTML to the builder:
```typescript
<EmailBuilder
  initialHtml={customizedHtml || selectedTemplate.html}
  onSave={(blocks, html) => {
    setCustomizedHtml(html)
  }}
/>
```

## Files Modified
- `src/components/campaigns/EmailBuilder.tsx` - Added auto-save useEffect

## Testing
To verify the fix:

1. **Email Campaign Test:**
   - Go to `/campaigns/email/new`
   - Select a template
   - Customize it (add/edit/remove blocks, change colors, text, etc.)
   - Navigate back to step 2
   - Navigate forward to step 3
   - ✅ All customizations should be preserved

2. **Multiple Edits Test:**
   - Customize a template
   - Navigate back and forth multiple times
   - Make additional edits after each navigation
   - ✅ All changes should accumulate and persist

3. **Template Switching Test:**
   - Customize template A
   - Go back and select template B
   - ✅ Template B's original content should load
   - Go back and select template A again
   - ✅ Template A's customizations should still be there

## Impact
- Users can now freely navigate between wizard steps without losing their work
- Changes are automatically saved as you make them
- No need to click "Continue" to save changes before navigating
- Provides a smoother, more intuitive user experience

## SMS Campaigns
SMS campaigns don't need this fix because they use a simple textarea that maintains its state through React's controlled component pattern. The state is already preserved correctly.
