const  axios  = require("axios");




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
})

