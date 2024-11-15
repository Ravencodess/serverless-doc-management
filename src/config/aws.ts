const awsConfig = {
    Auth: {
        region: 'us-east-1',
        userPoolId: 'us-east-1_6TF3m0W32',
        userPoolWebClientId: '7e9hk402l1odkd2v3rbqo1hb2v',
        identityPoolId: 'us-east-1:52a80846-ed26-40e7-8297-b1f1080acba9',
        mandatorySignIn: true,
        oauth: {
            domain: 'doc-management-user-pool.auth.us-east-1.amazoncognito.com',
            scope: ['email', 'openid', 'profile'],
            redirectSignIn: 'http://localhost:5173/',
            redirectSignOut: 'http://localhost:5173/',
            responseType: 'code'
        }
    },
    API: {
        endpoints: [
            {
                name: 'DocManagementAPI',
                endpoint: 'https://kc0jhbt5j0.execute-api.us-east-1.amazonaws.com/dev',
                region: 'us-east-1'
            }
        ]
    }
} as const

export default awsConfig;