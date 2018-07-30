require('dotenv').config()

const fetch = require('isomorphic-fetch')
const AmazonCognitoIdentity = require('amazon-cognito-identity-js')
const express = require('express')
const AWS = require('aws-sdk')
const app = express()

const poolData = {
    UserPoolId : process.env.COGNITO_USER_POOL_ID,
    ClientId : process.env.COGNITO_CLIENT_ID
}

app.get('/getIdenityId/:username/:password', (req, res) => {
    const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData)

    let username = req.params.username
    let password = req.params.password

    const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
        Username: username,
        Password: password
    })

    const cognitoUser = new AmazonCognitoIdentity.CognitoUser({
        Username: username,
        Pool: userPool
    })

    let identityPoolId = process.env.IDENTITY_POOL_ID
    
    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
            var accessToken = result.getAccessToken().getJwtToken()
            var idToken = result.idToken.jwtToken

            AWS.config.region = 'eu-west-1'
            AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                IdentityPoolId: identityPoolId,
                Logins: {
                    'cognito-idp.eu-west-1.amazonaws.com/eu-west-1_TUzcZHL99': idToken,
                }
            })
            AWS.config.credentials.get(function(err){
                if (err) {
                    console.log(err);
                }
            });
        },
        onFailure: (err) => {
            console.log(err)
        },
    })

    res.json({ identityId: AWS.config.credentials.identityId })
})

app.listen(process.env.PORT, () => console.log('app listening on port ' + process.env.PORT))
