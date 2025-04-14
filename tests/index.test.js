
const axios = require("axios");
const BACKEND_URL = "http://localhost:3000";

describe("Authentication", () => {
    test('User cannot sign up with same username twice', async() => {
        const username = "User" + Math.random();
        const password = "ValidPass123"
        
        const firstAttempt = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            type: "admin"
        });
        expect(firstAttempt.status).toBe(200, "First signup attempt should succeed");
        
        try {
            await axios.post(`${BACKEND_URL}/api/v1/signup`, {
                username,
                password: "DifferentPass123",
                type: "admin"
            });
            fail("Second signup with same username should fail");
        } catch (error) {
            expect(error.response.status).toBe(400, "Should return 400 for duplicate username");
            expect(error.response.data.message).toMatch(/already exists/i, "Error message should indicate username exists");
        }
    });

    test('Signup fails when username is missing', async() => {
        try {
            await axios.post(`${BACKEND_URL}/api/v1/signup`, {
                password: "ValidPass123"
            });
            fail("Signup without username should fail");
        } catch (error) {
            expect(error.response.status).toBe(400, "Should return 400 for missing username");
            expect(error.response.data.message).toMatch(/username.*required/i, "Error should mention username is required");
        }
    });

    test('Password must be at least 6 characters', async() => {
        try {
            await axios.post(`${BACKEND_URL}/api/v1/signup`, {
                username: `user-${Math.random()}`,
                password: "short"
            });
            fail("Short password should be rejected");
        } catch (error) {
            expect(error.response.status).toBe(400, "Should return 400 for short password");
            expect(error.response.data.message).toMatch(/at least 6 characters/i, "Should specify minimum length requirement");
        }
    });

    test('Password cannot exceed 64 characters', async() => {
        try {
            await axios.post(`${BACKEND_URL}/api/v1/signup`, {
                username: `user-${Math.random()}`,
                password: "a".repeat(65)
            });
            fail("Overly long password should be rejected");
        } catch (error) {
            expect(error.response.status).toBe(400, "Should return 400 for long password");
            expect(error.response.data.message).toMatch(/maximum.*64 characters/i, "Should specify maximum length limit");
        }
    });

    test('Password with special characters is accepted', async() => {
        const response = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username: `user-${Math.random()}`,
            password: "S3cur3P@$$w0rd!"
        });
        expect(response.status).toBe(200, "Complex password should be accepted");
        expect(response.data.message).toMatch(/success/i, "Should indicate successful signup");
    });

    test('Common passwords are rejected', async() => {
        const commonPasswords = ["password", "123456", "qwerty"];
        
        for (const badPassword of commonPasswords) {
            try {
                await axios.post(`${BACKEND_URL}/api/v1/signup`, {
                    username: `user-${Math.random()}`,
                    password: badPassword
                });
                fail(`Common password '${badPassword}' should be rejected`);
            } catch (error) {
                expect(error.response.status).toBe(400, `Should reject '${badPassword}'`);
                expect(error.response.data.message).toMatch(/too common/i, "Should warn about common password");
            }
        }
    });

    test('Username cannot contain special characters', async() => {
        const invalidUsernames = ["user@name", "user#name", "user$name"];
        
        for (const badUsername of invalidUsernames) {
            try {
                await axios.post(`${BACKEND_URL}/api/v1/signup`, {
                    username: badUsername,
                    password: "ValidPass123"
                });
                fail(`Username '${badUsername}' with special chars should be rejected`);
            } catch (error) {
                expect(error.response.status).toBe(400, `Should reject '${badUsername}'`);
                expect(error.response.data.message).toMatch(/alphanumeric/i, "Should specify allowed characters");
            }
        }
    });

    test('Successful signin returns token', async () => {
        const credentials = {
            username: `user-${Math.random()}`,
            password: "ValidPass123"
        };
    
        await axios.post(`${BACKEND_URL}/api/v1/signup`, credentials);
        const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, credentials);
    
        expect(response.status).toBe(200, "Valid credentials should return 200");
        expect(response.data.token).toBeDefined("Response must include auth token");
        expect(typeof response.data.token).toBe("string", "Token should be a string");
    });

    test('Signin fails with wrong password', async () => {
        const username = `user-${Math.random()}`;
        const password = "CorrectPass123";
    
        await axios.post(`${BACKEND_URL}/api/v1/signup`, { username, password });
    
        try {
            await axios.post(`${BACKEND_URL}/api/v1/signin`, {
                username,
                password: "WrongPass123"
            });
            fail("Signin with wrong password should fail");
        } catch (error) {
            expect(error.response.status).toBe(403, "Should return 403 for invalid password");
            expect(error.response.data.message).toMatch(/invalid credentials/i, "Should not specify whether username or password was wrong");
        }
    });

    test('Account locks after multiple failed attempts', async () => {
        const credentials = {
            username: `user-${Math.random()}`,
            password: "CorrectPass123"
        };
    
        await axios.post(`${BACKEND_URL}/api/v1/signup`, credentials);
    
        for (let i = 0; i < 5; i++) {
            try {
                await axios.post(`${BACKEND_URL}/api/v1/signin`, {
                    username: credentials.username,
                    password: "WrongPass123"
                });
            } catch (error) {
                expect(error.response.status).toBe(403, `Attempt ${i+1} should fail`);
            }
        }
    
        try {
            await axios.post(`${BACKEND_URL}/api/v1/signin`, credentials);
            fail("Account should be temporarily locked");
        } catch (error) {
            expect(error.response.status).toBe(429, "Should return 429 for rate limiting");
            expect(error.response.data.message).toMatch(/too many attempts/i, "Should indicate account is temporarily locked");
        }
    });

    test('Protected routes require valid token', async () => {
        const credentials = {
            username: `user-${Math.random()}`,
            password: "ValidPass123"
        };
    
        await axios.post(`${BACKEND_URL}/api/v1/signup`, credentials);
        const signinResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, credentials);
        const token = signinResponse.data.token;
    
        const protectedResponse = await axios.get(`${BACKEND_URL}/api/v1/protected`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        expect(protectedResponse.status).toBe(200, "Valid token should grant access");
    
        try {
            await axios.get(`${BACKEND_URL}/api/v1/protected`, {
                headers: { Authorization: "Bearer invalid.token.here" }
            });
            fail("Invalid token should be rejected");
        } catch (error) {
            expect(error.response.status).toBe(401, "Should return 401 for invalid token");
            expect(error.response.data.message).toMatch(/unauthorized/i, "Should indicate authorization failure");
        }
    });
});


/*Additional tests you might consider adding:

Password reset functionality

Email verification (if applicable)

Account locking after too many failed attempts

Session expiration tests

Cross-origin request protections

SQL injection attempts

XSS attack attempts*/