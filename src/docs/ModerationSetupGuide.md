# Moderation Tools Setup Guide

This guide explains how to implement and configure the comprehensive moderation system for AZReader.

## Overview

The moderation system provides:
- ✅ Content reporting system for users
- ✅ Automated content filtering with configurable rules
- ✅ Admin moderation dashboard for reviewing reports
- ✅ User flagging and suspension system
- ✅ Comprehensive audit logging
- ✅ Real-time content validation
- ✅ Integration with existing comment system

## Core Components

### 1. Hooks

- **`useModeration`** - Core moderation functionality and API
- **Content filtering** - Automatic detection of inappropriate content
- **Report management** - User reporting and admin review system

### 2. Components

- **`ReportModal`** - User-friendly reporting interface
- **`ModerationPanel`** - Admin dashboard for managing reports and users
- **`ContentFilter`** - Real-time content validation with suggestions
- **`EnhancedComments`** - Comments with built-in moderation features

### 3. Database Schema

- **`content_reports`** - User reports for comments/articles/users
- **`user_flags`** - User status tracking (flagged/suspended/banned)
- **`moderation_logs`** - Complete audit trail of moderation actions

## Quick Setup

### Step 1: Database Setup

Run the SQL schema in your Supabase dashboard:

```bash
# Copy the SQL file content and run in Supabase SQL editor
cat src/docs/ModerationDatabaseSchema.sql
```

Key tables created:
- `content_reports` - Stores user reports
- `user_flags` - Tracks user disciplinary status  
- `moderation_logs` - Audit trail of moderation actions

### Step 2: Configure Admin Users

Update admin user emails in the database:

```sql
-- Replace with your actual admin emails
UPDATE users SET email = 'admin@azreader.com' 
WHERE email = 'your-admin-email@example.com';

UPDATE users SET email = 'moderator@azreader.com' 
WHERE email = 'your-moderator-email@example.com';
```

### Step 3: Integration with Comments

Replace your existing Comments component import:

```tsx
// Before
import Comments from '@components/Comments';

// After - with moderation features
import { EnhancedCommentInput, EnhancedCommentItem } from '@components/EnhancedComments';
import ReportModal from '@components/ReportModal';
```

### Step 4: Add Moderation Panel for Admins

```tsx
import ModerationPanel from '@components/ModerationPanel';

const AdminArea: React.FC = () => {
  const [showModeration, setShowModeration] = useState(false);
  
  return (
    <>
      <IonButton onClick={() => setShowModeration(true)}>
        <IonIcon icon={shield} />
        Moderation
      </IonButton>
      
      <ModerationPanel 
        isOpen={showModeration} 
        onClose={() => setShowModeration(false)} 
      />
    </>
  );
};
```

## Advanced Configuration

### Content Filter Customization

Modify the content filters in `useModeration.ts`:

```typescript
const CUSTOM_CONTENT_FILTERS: ContentFilter[] = [
  {
    pattern: 'your-banned-word',
    type: 'contains',
    severity: 'high',
    action: 'require_review',
    description: 'Contains prohibited language',
  },
  {
    pattern: '\\b\\d{4}[-\\s]?\\d{4}[-\\s]?\\d{4}[-\\s]?\\d{4}\\b',
    type: 'regex',
    severity: 'high',
    action: 'flag',
    description: 'Possible credit card number',
  },
  // Add more custom filters...
];
```

### Strict Mode Configuration

Enable strict mode for sensitive content:

```tsx
const { checkContent } = useModeration({ 
  enableAutoModeration: true, 
  strictMode: true // Rejects more content automatically
});
```

### Custom Admin Check

Replace the basic admin check with your role system:

```typescript
const isAdmin = useCallback(async (userId?: string): Promise<boolean> => {
  const targetUserId = userId || currentUserId;
  if (!targetUserId) return false;

  try {
    // Your custom role checking logic
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', targetUserId)
      .single();

    return userRole?.role === 'admin' || userRole?.role === 'moderator';
  } catch (error) {
    return false;
  }
}, [currentUserId]);
```

## Usage Examples

### 1. Basic Content Reporting

```tsx
import { useModeration } from '@hooks/useModeration';

const CommentActions: React.FC = ({ commentId }) => {
  const { reportContent } = useModeration();
  
  const handleReport = async () => {
    await reportContent(
      'comment', 
      commentId, 
      'inappropriate_content',
      'This comment violates community guidelines'
    );
  };
  
  return (
    <IonButton onClick={handleReport} size="small">
      <IonIcon icon={flag} />
      Report
    </IonButton>
  );
};
```

### 2. Automated Content Filtering

```tsx
import ContentFilter from '@components/ContentFilter';

const SmartCommentInput: React.FC = () => {
  const [comment, setComment] = useState('');
  const [canSubmit, setCanSubmit] = useState(false);
  
  return (
    <>
      <IonTextarea
        value={comment}
        onIonInput={(e) => setComment(e.detail.value!)}
        placeholder="Write a comment..."
      />
      
      <ContentFilter
        content={comment}
        onContentApproved={() => setCanSubmit(true)}
        onContentRejected={() => setCanSubmit(false)}
        showSuggestions={true}
        strictMode={false}
      />
      
      <IonButton disabled={!canSubmit}>
        Post Comment
      </IonButton>
    </>
  );
};
```

### 3. Admin Moderation Dashboard

```tsx
import ModerationPanel from '@components/ModerationPanel';
import { useModeration } from '@hooks/useModeration';

const AdminDashboard: React.FC = () => {
  const [showPanel, setShowPanel] = useState(false);
  const { getReports, getUserFlags } = useModeration();
  
  const [pendingReports, setPendingReports] = useState(0);
  
  useEffect(() => {
    const loadStats = async () => {
      const reports = await getReports('pending');
      setPendingReports(reports.length);
    };
    loadStats();
  }, []);
  
  return (
    <>
      <IonCard>
        <IonCardContent>
          <h2>Moderation Overview</h2>
          <p>Pending reports: {pendingReports}</p>
          <IonButton onClick={() => setShowPanel(true)}>
            Open Moderation Panel
          </IonButton>
        </IonCardContent>
      </IonCard>
      
      <ModerationPanel
        isOpen={showPanel}
        onClose={() => setShowPanel(false)}
      />
    </>
  );
};
```

### 4. User Status Checking

```tsx
const CommentSection: React.FC = ({ userId }) => {
  const { getUserFlags } = useModeration();
  const [userStatus, setUserStatus] = useState('active');
  
  useEffect(() => {
    const checkUserStatus = async () => {
      const flags = await getUserFlags(userId);
      const activeFlag = flags.find(f => f.status !== 'active');
      setUserStatus(activeFlag?.status || 'active');
    };
    checkUserStatus();
  }, [userId]);
  
  if (userStatus === 'banned') {
    return <div>This user has been banned.</div>;
  }
  
  if (userStatus === 'suspended') {
    return <div>This user is temporarily suspended.</div>;
  }
  
  return <Comments userId={userId} />;
};
```

## Moderation Workflow

### 1. User Reports Content

```
User sees inappropriate content → Clicks Report → 
Fills out report form → Report stored in database →
Admin notification sent
```

### 2. Admin Reviews Report

```
Admin opens moderation panel → Views pending reports →
Reviews content and context → Takes appropriate action →
Action logged in audit trail
```

### 3. Automated Content Filtering

```
User types comment → Content analyzed in real-time →
Flagged content shows warnings → User can revise or override →
Final content submitted with approval status
```

### 4. User Discipline Actions

```
Multiple reports on user → Admin flags user →
Escalating actions: Warning → Flagged → Suspended → Banned →
User restrictions automatically expire (for suspensions)
```

## Database Schema Details

### Content Reports

```sql
content_reports (
  id, content_type, content_id, reporter_id,
  reason, description, status,
  reviewed_by, reviewed_at, resolution,
  created_at, updated_at
)
```

**Report Reasons:**
- `spam` - Repetitive or promotional content
- `harassment` - Targeting specific users
- `hate_speech` - Discriminatory content
- `violence` - Threatening or violent content  
- `inappropriate_content` - General violations
- `misinformation` - False information
- `copyright` - Unauthorized use
- `other` - Other violations

### User Flags

```sql
user_flags (
  id, user_id, flagged_by, reason,
  status, severity, expires_at,
  created_at, updated_at
)
```

**Status Types:**
- `active` - Normal user
- `flagged` - Warned user
- `suspended` - Temporarily restricted
- `banned` - Permanently blocked

**Severity Levels:**
- `low` - Minor violations
- `medium` - Moderate violations  
- `high` - Serious violations
- `critical` - Severe violations

### Moderation Logs

```sql
moderation_logs (
  id, moderator_id, action, target_type,
  target_id, reason, details, created_at
)
```

**Action Types:**
- `warn` - User warning
- `hide_comment` - Content hidden
- `flag_user` - User flagged
- `suspend_user` - User suspended
- `ban_user` - User banned
- `dismiss` - Report dismissed

## Security Considerations

### 1. Row Level Security (RLS)

All moderation tables use RLS:
- Users can only view their own reports
- Only admins can view all reports and take actions
- System functions can create audit logs

### 2. Admin Authentication

Admin status is determined by:
- Email pattern matching (basic)
- Custom role tables (recommended)
- Supabase auth metadata (alternative)

### 3. Content Validation

- Client-side filtering for UX
- Server-side validation for security
- Audit trail for all actions
- User override protection

### 4. Data Privacy

- Reports contain minimal PII
- Automatic cleanup of old data
- Secure admin access only
- Encrypted sensitive fields

## Performance Optimization

### 1. Database Indexes

All moderation tables include optimized indexes:
- Status-based queries
- User-specific lookups  
- Time-based sorting
- Content-type filtering

### 2. Query Optimization

- Limit result sets appropriately
- Use pagination for large datasets
- Cache admin status checks
- Batch operations where possible

### 3. Real-time Considerations

- Avoid real-time on moderation tables
- Use polling for admin dashboards
- Optimize subscription queries
- Implement connection pooling

## Troubleshooting

### Reports Not Submitting?

1. Check user authentication
2. Verify database permissions  
3. Check RLS policies
4. Review network connectivity

### Admin Panel Empty?

1. Verify admin email pattern
2. Check RLS admin policies
3. Ensure proper database setup
4. Review user roles configuration

### Content Filter Not Working?

1. Check filter patterns syntax
2. Verify regex expressions
3. Test with different content
4. Review strictMode settings

### Performance Issues?

1. Check database indexes
2. Review query complexity
3. Optimize result pagination  
4. Monitor connection pools

## API Reference

### useModeration Hook

```typescript
const {
  reportContent,
  checkContent, 
  hideContent,
  flagUser,
  suspendUser,
  banUser,
  getReports,
  getUserFlags,
  getModerationLogs,
  reviewReport,
  isLoading,
  error,
} = useModeration(options);
```

### ContentFilter Component

```typescript
<ContentFilter
  content={string}
  onContentApproved={(content: string) => void}
  onContentRejected={(content: string, reasons: string[]) => void}
  showSuggestions={boolean}
  strictMode={boolean}
/>
```

### ReportModal Component

```typescript
<ReportModal
  isOpen={boolean}
  onClose={() => void}
  contentType={'comment' | 'article' | 'user'}
  contentId={string}
  contentPreview={string}
  reportedUserEmail={string}
/>
```

This moderation system provides enterprise-level content moderation capabilities while maintaining user privacy and administrative efficiency.