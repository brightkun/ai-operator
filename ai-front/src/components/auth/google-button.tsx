"use client";

import { GoogleLogin } from "@react-oauth/google";

interface GoogleButtonProps {
  onCredential: (idToken: string) => void;
}

export function GoogleButton({ onCredential }: GoogleButtonProps) {
  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          if (credentialResponse.credential) {
            onCredential(credentialResponse.credential);
          }
        }}
        onError={() => {
          console.error("Google login failed");
        }}
        theme="outline"
        shape="pill"
        width="320"
      />
    </div>
  );
}
