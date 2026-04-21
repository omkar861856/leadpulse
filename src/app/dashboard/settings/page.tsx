import { UserProfile } from "@clerk/nextjs";

export default function SettingsPage() {
  return (
    <div className="animate-fade-in">
       <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Settings</h1>
        <p style={{ color: 'var(--muted-foreground)' }}>Manage your account, profile, and security settings via Clerk.</p>
      </div>

      <div style={{ 
        background: 'rgba(255,255,255,0.02)', 
        borderRadius: '1rem', 
        border: '1px solid var(--border)',
        overflow: 'hidden'
      }}>
        <UserProfile 
          routing="hash"
          appearance={{
            elements: {
              rootBox: { width: '100%' },
              card: { 
                background: 'transparent', 
                boxShadow: 'none', 
                width: '100%',
                border: 'none'
              },
              navbar: {
                background: 'rgba(255,255,255,0.02)',
                borderRight: '1px solid var(--border)'
              },
              headerTitle: { color: 'white' },
              headerSubtitle: { color: 'var(--muted-foreground)' },
              profileSectionTitleText: { color: 'var(--primary)' },
              userPreviewMainIdentifier: { color: 'white' },
              userPreviewSecondaryIdentifier: { color: 'var(--muted-foreground)' },
              button: { color: 'var(--primary)' }
            }
          }}
        />
      </div>
    </div>
  );
}
