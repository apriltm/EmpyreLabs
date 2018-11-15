/*global EmpyreLabs _config AmazonCognitoIdentity AWSCognito*/

var EmpyreLabs = window.EmpyreLabs || {};

(function scopeWrapper($) {
    var signinUrl = '/signin.html';

    var poolData = {
        UserPoolId: _config.cognito.userPoolId,
        ClientId: _config.cognito.userPoolClientId
    };

    var userPool;

    if (!(_config.cognito.userPoolId &&
        _config.cognito.userPoolClientId &&
        _config.cognito.region)) {
        $('#noCognitoMessage').show(); //no div created yet, so ignore for now
        return;
    }

    userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

    if (typeof AWSCognito !== 'undefined') {
        AWSCognito.config.region = _config.cognito.region;
    }

    EmpyreLabs.signOut = function signOut() {
        userPool.getCurrentUser().signOut();
    };

    EmpyreLabs.authToken = new Promise(function fetchCurrentAuthToken(resolve, reject) {
        var cognitoUser = userPool.getCurrentUser();

        if (cognitoUser) {
            cognitoUser.getSession(function sessionCallback(err, session) {
                if (err) {
                    reject(err);
                } else if (!session.isValid()) {
                    resolve(null);
                } else {
                    resolve(session.getIdToken().getJwtToken());
                }
            });
        } else {
            resolve(null);
        }
    });


    /*
     * Cognito User Pool functions
     */

    function register(email, password, onSuccess, onFailure) {
        var dataEmail = {
            Name: 'email',
            Value: email
        };
        var attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail);

        userPool.signUp(email, password, [attributeEmail], null,
            function signUpCallback(err, result) {
                if (!err) {
                    onSuccess(result);
                } else {
                    onFailure(err);
                }
            }
        );
    }

    function signin(email, password, onSuccess, onFailure) {
        var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
            Username: email,
            Password: password
        });

        var cognitoUser = createCognitoUser(email);
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: onSuccess,
            onFailure: onFailure
        });
    }

    function verify(email, code, onSuccess, onFailure) {
        createCognitoUser(email).confirmRegistration(code, true, function confirmCallback(err, result) {
            if (!err) {
                onSuccess(result);
            } else {
                onFailure(err);
            }
        });
    }

    function createCognitoUser(email) {
        return new AmazonCognitoIdentity.CognitoUser({
            Username: email,
            Pool: userPool
        });
    }

    /*
     *  Event Handlers
     */

    $(function onDocReady() {
        $('#signinForm').submit(handleSignin);  //for signing in
        $('#registrationForm').submit(handleRegister); //for registering
        $('#verifyForm').submit(handleVerify); //for verifying
    });

    /* for sign in */

    function handleSignin(event) {
        var email = $('#signemail').val(); //extracting value from input in the email form; check signin.html for same div #id
        var password = $('#signpassword').val(); //extracting value from input in the password form; check signin.html for same div #id
        event.preventDefault();
        signin(email, password,
            function signinSuccess() {
                console.log('Successfully Logged In');
                window.location.href = 'signin.html'; //not sure if this works; need registration and verification to work first
            },
            function signinError(err) {
                alert(err);  //give error 
            }
        );
    }

    /* for registration */

    function handleRegister(event) {
        var email = $('#registeremail').val(); //extracting value from input in the email form; check signin.html for same div #id
        var password = $('#registerpassword').val(); //extracting value from input in the password form; check signin.html for same div #id
        var password2 = $('#registercpassword').val(); //extracting value from input in the password form; check signin.html for same div #id

        var onSuccess = function registerSuccess(result) {
            var cognitoUser = result.user;
            console.log('user name is ' + cognitoUser.getUsername());
            var confirmation = ('Registration successful. Please check your email inbox or spam folder for your verification code.');
            if (confirmation) {
                window.location.href = 'verify.html'; //this event is not triggering; need to be fixed
            }
        };
        var onFailure = function registerFailure(err) {
            alert(err);
        };
        event.preventDefault();

        if (password === password2) {
            register(email, password, onSuccess, onFailure); //not triggering; need to be fixed
        } else {
            alert('Passwords do not match'); //not triggering; need to be fixed
        }
    }

    /* for verification */

    function handleVerify(event) {
        var email = $('#verifyemail').val(); //extracting value from input in the email form; check verify.html for same div #id
        var code = $('#verifycode').val(); //extracting value from input in the verification code form; check verify.html for same div #id
        event.preventDefault();
        verify(email, code,
            function verifySuccess(result) {
                console.log('call result: ' + result);
                console.log('Successfully verified');
                alert('Verification successful. You will now be redirected to the login page.'); //not triggering; need to be fixed
                window.location.href = signinUrl;
            },
            function verifyError(err) {
                alert(err); //not triggering; need to be fixed
            }
        );
    }
}(jQuery));