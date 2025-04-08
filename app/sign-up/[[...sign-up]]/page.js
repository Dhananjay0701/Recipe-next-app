import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: 'calc(100vh - 80px)', /* Adjusted to account for header */
      width: '100%',
      padding: '20px' 
    }}>
      <div style={{ 
        width: '100%',
        maxWidth: '500px'
      }}>
        <SignUp 
          path="/sign-up" 
          routing="path" 
          signInUrl="/sign-in"
          appearance={{
            layout: {
              logoPlacement: "inside",
              socialButtonsVariant: "iconButton"
            },
            elements: {
              card: {
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                borderRadius: "8px"
              },
              formButtonPrimary: {
                backgroundColor: "#4a90e2",
                fontSize: "16px"
              },
              formFieldInput: {
                borderRadius: "6px"
              }
            }
          }}
        />
      </div>
    </div>
  );
} 