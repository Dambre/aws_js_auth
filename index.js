require('dotenv').config()

const fetch = require('isomorphic-fetch')
const AmazonCognitoIdentity = require('amazon-cognito-identity-js')
const express = require('express')
const AWS = require('aws-sdk')
const app = express()

// Add ClientId to authenticated providers on federated idenity settings
const poolData = {
    UserPoolId : process.env.COGNITO_USER_POOL_ID,
    ClientId : process.env.COGNITO_CLIENT_ID
}

app.use

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
 
    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
            var accessToken = result.getAccessToken().getJwtToken()
            var idToken = result.idToken.jwtToken
            var loginProvider = process.env.COGNITO_USER_POOL_ARN

            AWS.config.region = process.env.AWS_REGION

            AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                IdentityPoolId: process.env.IDENTITY_POOL_ID,
                Logins: {loginProvider: idToken}
            })

            AWS.config.credentials.get(function(err){
                if (err) {
                    console.log(err);
                    res.json({
                        identityId: null,
                        message: err.message,
                        success: false
                    })
                } else {
                    res.json({
                        identityId: AWS.config.credentials.identityId,
                        message: null,
                        success: true
                    })
                }
            });
        },
        onFailure: (err) => {
            console.log(err)
            res.json({
                identityId: null,
                message: err.message,
                success: false
            })
        },
    })
})

app.listen(process.env.PORT, () => console.log('app listening on port ' + process.env.PORT))
