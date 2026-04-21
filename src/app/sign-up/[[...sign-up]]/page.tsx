import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="auth-wrapper">
      <div className="animate-fade-in">
        <SignUp 
          appearance={{
            elements: {
              card: "glass-card",
            },
            variables: {
              colorPrimary: "#6366f1",
              colorBackground: "#111111",
              colorText: "#ffffff",
              colorInputBackground: "#1a1a1a",
              colorInputText: "#ffffff",
              colorTextSecondary: "#a1a1aa",
              borderRadius: "0.75rem"
            }
          }}
        />
      </div>
    </div>
  );
}
