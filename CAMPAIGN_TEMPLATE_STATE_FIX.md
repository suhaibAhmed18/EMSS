# Campaign Template Customization State Persistence Fix

## Problem Description

When creating email or SMS campaigns, users would customize templates in the customization step. However, when navigating back to the template selection step and then forward again to the customization step, all their changes would be lost and the template would revert to its original state.

## Root Cause

The issue had two main causes:

### 1. Email Campaign Builder Component State Initialization

**File:** `src/components/campaigns/EmailBuilder.tsx`

The `EmailBuilder` component was initializing its `blocks` state only once when the component first mounted, using a lazy initializer function:

```typescript
const [blocks, setBlocks] = useState<EmailBlock[]>(() => {
  if (initialBlocks.length > 0) return initialBlocks
  if (initialHtml) return parseHtmlToBlocks(initialHtml)
  return getDefaultBlocks()
})
```

When the user navigated back and forth between wizard steps, the component would re-render with an updated `initialHtml` prop (containing the user's customizations), but the state would not update because React's `useState` only uses the initializer function on the first render.

### 2. Template Selection Overwriting Customizations

**Files:** 
- `src/app/campaigns/email/new/page.tsx`
- `src/app/campaigns/sms/new/page.tsx`

When users went back to the template selection step and clicked on the already-selected template (or any template), the code would unconditionally overwrite the customized content with the original template content:

```typescript
// Email
onClick={() => {
  setSelectedTemplate(template)
  setCustomizedHtml(template.html)  // Always overwrites!
}}

// SMS
onClick={() => {
  setSelectedTemplate(template)
  setCustomizedMessage(template.message)  // Always overwrites!
}}
```

### 3. Email Builder Not Receiving Customized HTML

**File:** `src/app/campaigns/email/new/page.tsx`

In the customize template step, the `EmailBuilder` was receiving the original template HTML instead of the customized version:

```typescript
<EmailBuilder
  initialHtml={selectedTemplate.html}  // Wrong - uses original template
  onSave={(blocks, html) => {
    setCustomizedHtml(html)
  }}
/>
```

## Solution

### Fix 1: Add useEffect to Update EmailBuilder State

Added a `useEffect` hook to the `EmailBuilder` component to watch for changes in the `initialHtml` prop and update the blocks state accordingly:

```typescript
// Update blocks when initialHtml changes (e.g., when navigating back and forth in wizard)
useEffect(() => {
  if (initialHtml) {
    const parsedBlocks = parseHtmlToBlocks(initialHtml)
    if (parsedBlocks.length > 0) {
      setBlocks(parsedBlocks)
    }
  }
}, [initialHtml])
```

This ensures that when the user navigates back to the customization step, the builder loads their previously customized content instead of the original template.

### Fix 2: Conditional Template Content Setting

Modified the template selection logic to only set the content when switching to a different template or when no customized content exists:

**Email Campaign:**
```typescript
onClick={() => {
  setSelectedTemplate(template)
  // Only set the HTML if switching to a different template or if no customized HTML exists
  if (selectedTemplate?.id !== template.id || !customizedHtml) {
    setCustomizedHtml(template.html)
  }
}}
```

**SMS Campaign:**
```typescript
onClick={() => {
  setSelectedTemplate(template)
  // Only set the message if switching to a different template or if no message exists
  if (selectedTemplate?.id !== template.id || !customizedMessage) {
    setCustomizedMessage(template.message)
  }
}}
```

This prevents the customized content from being overwritten when the user clicks on the already-selected template.

### Fix 3: Pass Customized HTML to EmailBuilder

Changed the `EmailBuilder` component to receive the customized HTML instead of the original template:

```typescript
<EmailBuilder
  initialHtml={customizedHtml || selectedTemplate.html}  // Use customized version first
  onSave={(blocks, html) => {
    setCustomizedHtml(html)
  }}
/>
```

This ensures the builder always starts with the user's customizations if they exist.

## Files Modified

1. **src/components/campaigns/EmailBuilder.tsx**
   - Added `useEffect` import
   - Added `useEffect` hook to update blocks when `initialHtml` changes

2. **src/app/campaigns/email/new/page.tsx**
   - Modified template selection onClick handler to conditionally set `customizedHtml`
   - Changed `EmailBuilder` initialHtml prop to use `customizedHtml || selectedTemplate.html`

3. **src/app/campaigns/sms/new/page.tsx**
   - Modified template selection onClick handler to conditionally set `customizedMessage`

## Testing Recommendations

To verify the fix works correctly:

1. **Email Campaign Test:**
   - Go to `/campaigns/email/new`
   - Select a template in step 2
   - Customize the template in step 3 (add/edit/remove blocks)
   - Navigate back to step 2
   - Navigate forward to step 3
   - Verify all customizations are preserved

2. **SMS Campaign Test:**
   - Go to `/campaigns/sms/new`
   - Select a template in step 2
   - Customize the message in step 3
   - Navigate back to step 2
   - Navigate forward to step 3
   - Verify the customized message is preserved

3. **Template Switching Test:**
   - Start with template A and customize it
   - Go back and select template B
   - Verify template B's original content loads (not template A's customizations)
   - Go back and select template A again
   - Verify template A's customizations are still preserved

4. **Multiple Navigation Test:**
   - Customize a template
   - Navigate back and forth multiple times
   - Verify customizations persist through all navigation

## Impact

This fix ensures a smooth user experience when creating campaigns. Users can now:
- Navigate freely between wizard steps without losing their work
- Review template options without fear of losing customizations
- Make iterative changes to their campaigns with confidence

The fix is backward compatible and doesn't affect any existing functionality.
