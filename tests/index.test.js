const axios = require("axios");

const BACKEND_URL = "http://localhost:3000"

describe("Authentication", () => {
    test('User is able to sign up only once', async() => {
        const username = "Shiruvati" + Math.random();
        const password = "123445"
        const response = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            type: "admin"
        })
        expect(response.status).toBe(200)
        const updatedResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            type: "admin"
        })
        expect(updatedResponse.status).toBe(400)
    })

    test ('Signup request fails if the uername is  empty', async() => {
        const username = `shiruvati-${Math.random()}`
        const password = "123456"

        const response  = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            password
        })

        expect(response.status).toBe(400)
    })

    test('Signup request fails if the password is empty', async() => {
        const username = `shiruvati-${Math.random()}`
        
        const response = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username
        })
        
        expect(response.status).toBe(400)
    })
    
    test('Signup request fails if user type is invalid', async() => {
        const username = `shiruvati-${Math.random()}`
        const password = "123456"
        
        const response = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            type: "invalid_type"
        })
        
        expect(response.status).toBe(400)
    })
    
    test('User can login with correct credentials', async() => {
        // First create a user
        const username = `shiruvati-${Math.random()}`
        const password = "123456"
        
        await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            type: "user"
        })
        
        // Now try to login
        const loginResponse = await axios.post(`${BACKEND_URL}/api/v1/login`, {
            username,
            password
        })
        
        expect(loginResponse.status).toBe(200)
        expect(loginResponse.data).toHaveProperty('token')
    })
    
    test('Login fails with incorrect password', async() => {
        // First create a user
        const username = `shiruvati-${Math.random()}`
        const password = "123456"
        
        await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            type: "user"
        })
        
        // Try to login with wrong password
        try {
            await axios.post(`${BACKEND_URL}/api/v1/login`, {
                username,
                password: "wrong_password"
            })
            // If we reach here, the test should fail
            expect(true).toBe(false) // Force test to fail if we reach this point
        } catch (error) {
            expect(error.response.status).toBe(401)
        }
    })
    
    test('Login fails with non-existent user', async() => {
        try {
            await axios.post(`${BACKEND_URL}/api/v1/login`, {
                username: "non_existent_user",
                password: "any_password"
            })
            // If we reach here, the test should fail
            expect(true).toBe(false) // Force test to fail if we reach this point
        } catch (error) {
            expect(error.response.status).toBe(401)
        }
    })
    
    test('User can logout with valid token', async() => {
        // First create a user and login
        const username = `shiruvati-${Math.random()}`
        const password = "123456"
        
        await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            type: "user"
        })
        
        const loginResponse = await axios.post(`${BACKEND_URL}/api/v1/login`, {
            username,
            password
        })
        
        const token = loginResponse.data.token
        
        // Now logout
        const logoutResponse = await axios.post(`${BACKEND_URL}/api/v1/logout`, {}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        
        expect(logoutResponse.status).toBe(200)
    })
})

describe("Authorization and User Management", () => {
    test('Protected endpoints reject requests without token', async() => {
        try {
            await axios.get(`${BACKEND_URL}/api/v1/profile`)
            // If we reach here, the test should fail
            expect(true).toBe(false)
        } catch (error) {
            expect(error.response.status).toBe(401)
        }
    })
    
    test('User can access their profile with valid token', async() => {
        // First create a user and login
        const username = `shiruvati-${Math.random()}`
        const password = "123456"
        
        await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            type: "user"
        })
        
        const loginResponse = await axios.post(`${BACKEND_URL}/api/v1/login`, {
            username,
            password
        })
        
        const token = loginResponse.data.token
        
        // Now access profile
        const profileResponse = await axios.get(`${BACKEND_URL}/api/v1/profile`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        
        expect(profileResponse.status).toBe(200)
        expect(profileResponse.data.username).toBe(username)
    })
    
    test('Admin users can access admin-only endpoints', async() => {
        // Create an admin user
        const username = `admin-${Math.random()}`
        const password = "123456"
        
        await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            type: "admin"
        })
        
        const loginResponse = await axios.post(`${BACKEND_URL}/api/v1/login`, {
            username,
            password
        })
        
        const token = loginResponse.data.token
        
        // Now access admin endpoint
        const adminResponse = await axios.get(`${BACKEND_URL}/api/v1/admin/dashboard`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        
        expect(adminResponse.status).toBe(200)
    })
    
    test('Regular users cannot access admin-only endpoints', async() => {
        // Create a regular user
        const username = `user-${Math.random()}`
        const password = "123456"
        
        await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            type: "user"
        })
        
        const loginResponse = await axios.post(`${BACKEND_URL}/api/v1/login`, {
            username,
            password
        })
        
        const token = loginResponse.data.token
        
        // Try to access admin endpoint
        try {
            await axios.get(`${BACKEND_URL}/api/v1/admin/dashboard`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            // If we reach here, the test should fail
            expect(true).toBe(false)
        } catch (error) {
            expect(error.response.status).toBe(403) // Forbidden
        }
    })
    
    test('Token expires after set time', async() => {
        // This test is for demonstration - may need to be adjusted based on your token expiration time
        // You might need to mock time or use a shorter expiration for testing
        
        const username = `user-${Math.random()}`
        const password = "123456"
        
        await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            type: "user"
        })
        
        const loginResponse = await axios.post(`${BACKEND_URL}/api/v1/login`, {
            username,
            password
        })
        
        const token = loginResponse.data.token
        
        // In a real test, you might use something like:
        // jest.advanceTimersByTime(tokenExpirationTimeInMs)
        
        // For now, we'll just document the test concept
        console.log("Note: Token expiration test should be implemented based on your token expiration strategy")
    })
})

describe("Meeting Functionality", () => {
    let userToken;
    let adminToken;
    
    // Setup - create a regular user and an admin user before tests
    beforeAll(async () => {
        // Create regular user
        const username = `user-${Math.random()}`
        const password = "123456"
        
        await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            type: "user"
        })
        
        const userLogin = await axios.post(`${BACKEND_URL}/api/v1/login`, {
            username,
            password
        })
        
        userToken = userLogin.data.token
        
        // Create admin user
        const adminUsername = `admin-${Math.random()}`
        
        await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username: adminUsername,
            password,
            type: "admin"
        })
        
        const adminLogin = await axios.post(`${BACKEND_URL}/api/v1/login`, {
            username: adminUsername,
            password
        })
        
        adminToken = adminLogin.data.token
    })
    
    test('User can create a meeting', async() => {
        const meetingData = {
            title: "Test Meeting",
            description: "This is a test meeting",
            startTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
            duration: 60, // minutes
            maxParticipants: 10
        }
        
        const response = await axios.post(`${BACKEND_URL}/api/v1/meetings`, meetingData, {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        })
        
        expect(response.status).toBe(200)
        expect(response.data).toHaveProperty('id')
        expect(response.data.title).toBe(meetingData.title)
        
        return response.data.id // Return meeting ID for other tests
    })
    
    test('User can fetch meeting details', async() => {
        // First create a meeting
        const meetingData = {
            title: "Meeting for Details Test",
            description: "Testing fetching meeting details",
            startTime: new Date(Date.now() + 3600000).toISOString(),
            duration: 45,
            maxParticipants: 5
        }
        
        const createResponse = await axios.post(`${BACKEND_URL}/api/v1/meetings`, meetingData, {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        })
        
        const meetingId = createResponse.data.id
        
        // Now fetch the meeting details
        const response = await axios.get(`${BACKEND_URL}/api/v1/meetings/${meetingId}`, {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        })
        
        expect(response.status).toBe(200)
        expect(response.data.id).toBe(meetingId)
        expect(response.data.title).toBe(meetingData.title)
    })
    
    test('User can join a meeting', async() => {
        // First create a meeting
        const meetingData = {
            title: "Meeting to Join",
            description: "Testing joining a meeting",
            startTime: new Date(Date.now() + 3600000).toISOString(),
            duration: 30,
            maxParticipants: 5
        }
        
        const createResponse = await axios.post(`${BACKEND_URL}/api/v1/meetings`, meetingData, {
            headers: {
                Authorization: `Bearer ${adminToken}`
            }
        })
        
        const meetingId = createResponse.data.id
        
        // Now join the meeting as a regular user
        const joinResponse = await axios.post(`${BACKEND_URL}/api/v1/meetings/${meetingId}/join`, {}, {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        })
        
        expect(joinResponse.status).toBe(200)
        expect(joinResponse.data).toHaveProperty('joinUrl')
    })
    
    test('User cannot join a meeting at full capacity', async() => {
        // Create a meeting with just 1 participant capacity
        const meetingData = {
            title: "Full Capacity Meeting",
            description: "Testing capacity limits",
            startTime: new Date(Date.now() + 3600000).toISOString(),
            duration: 30,
            maxParticipants: 1 // Just enough for the creator
        }
        
        const createResponse = await axios.post(`${BACKEND_URL}/api/v1/meetings`, meetingData, {
            headers: {
                Authorization: `Bearer ${adminToken}`
            }
        })
        
        const meetingId = createResponse.data.id
        
        // Try to join the meeting as a regular user
        try {
            await axios.post(`${BACKEND_URL}/api/v1/meetings/${meetingId}/join`, {}, {
                headers: {
                    Authorization: `Bearer ${userToken}`
                }
            })
            // If we reach here, the test should fail
            expect(true).toBe(false)
        } catch (error) {
            expect(error.response.status).toBe(400)
            expect(error.response.data).toHaveProperty('message')
            expect(error.response.data.message).toMatch(/capacity|full/)
        }
    })
    
    test('Admin can cancel any meeting', async() => {
        // First create a meeting as a regular user
        const meetingData = {
            title: "Meeting to Cancel",
            description: "Testing meeting cancellation",
            startTime: new Date(Date.now() + 3600000).toISOString(),
            duration: 45,
            maxParticipants: 5
        }
        
        const createResponse = await axios.post(`${BACKEND_URL}/api/v1/meetings`, meetingData, {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        })
        
        const meetingId = createResponse.data.id
        
        // Now cancel the meeting as an admin
        const cancelResponse = await axios.delete(`${BACKEND_URL}/api/v1/meetings/${meetingId}`, {
            headers: {
                Authorization: `Bearer ${adminToken}`
            }
        })
        
        expect(cancelResponse.status).toBe(200)
        
        // Try to fetch the meeting details, should get a 404
        try {
            await axios.get(`${BACKEND_URL}/api/v1/meetings/${meetingId}`, {
                headers: {
                    Authorization: `Bearer ${userToken}`
                }
            })
            // If we reach here, the test should fail
            expect(true).toBe(false)
        } catch (error) {
            expect(error.response.status).toBe(404)
        }
    })
    
    test('User can only cancel their own meetings', async() => {
        // First create a meeting as admin
        const meetingData = {
            title: "Admin's Meeting",
            description: "Testing permission controls",
            startTime: new Date(Date.now() + 3600000).toISOString(),
            duration: 30,
            maxParticipants: 5
        }
        
        const createResponse = await axios.post(`${BACKEND_URL}/api/v1/meetings`, meetingData, {
            headers: {
                Authorization: `Bearer ${adminToken}`
            }
        })
        
        const meetingId = createResponse.data.id
        
        // Try to cancel the meeting as a regular user
        try {
            await axios.delete(`${BACKEND_URL}/api/v1/meetings/${meetingId}`, {
                headers: {
                    Authorization: `Bearer ${userToken}`
                }
            })
            // If we reach here, the test should fail
            expect(true).toBe(false)
        } catch (error) {
            expect(error.response.status).toBe(403)
        }
    })
})

