import axios from "axios"

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json"
  }
})

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      return Promise.reject({
        message: error.response.data?.message || "An error occurred",
        status: error.response.status
      })
    } else if (error.request) {
      // The request was made but no response was received
      return Promise.reject({
        message: "No response received from server",
        status: 0
      })
    } else {
      // Something happened in setting up the request that triggered an Error
      return Promise.reject({
        message: error.message,
        status: -1
      })
    }
  }
)

export interface Template {
  id: string
  name: string
  createdAt: string
  isCustom: boolean
}

export default api