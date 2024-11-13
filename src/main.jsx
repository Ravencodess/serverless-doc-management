// main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Amplify } from 'aws-amplify'
import { Authenticator } from '@aws-amplify/ui-react'
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito'
import '@aws-amplify/ui-react/styles.css'
import App from './App'
import './index.css'
import awsConfig from './config/aws-config'

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: awsConfig.Auth.userPoolId,
      userPoolClientId: awsConfig.Auth.userPoolWebClientId,
      identityPoolId: awsConfig.Auth.identityPoolId,
      signUpVerificationMethod: 'code',
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Authenticator.Provider>
        <App />
      </Authenticator.Provider>
    </BrowserRouter>
  </React.StrictMode>
)