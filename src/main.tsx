import { BrowserRouter } from "react-router-dom";
import { Authenticator } from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import "@aws-amplify/ui-react/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./global.css";
import "@aws-amplify/ui-react/styles.css";
import awsConfig from "./config/aws.ts";
import App from "./App.tsx";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: awsConfig.Auth.userPoolId,
      userPoolClientId: awsConfig.Auth.userPoolWebClientId,
      identityPoolId: awsConfig.Auth.identityPoolId,
      signUpVerificationMethod: "code",
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Authenticator.Provider>
        <App />
      </Authenticator.Provider>
    </BrowserRouter>
  </StrictMode>
);
