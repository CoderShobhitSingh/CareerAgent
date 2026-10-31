import { useContext, useState } from "react"
import { AuthContext } from "../auth.context"
import { login, logout, register } from "../services/auth.api"

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider")
    }

    const { user, loading, setUser, setLoading } = context
    const [error, setError] = useState("")

    const handleLogin = async ({ email, password }) => {
        setLoading(true)
        setError("")
        try {
            const data = await login({ email, password })
            setUser(data.user)
            return true
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Unable to log in. Please try again.")
            return false
        } finally {
            setLoading(false)
        }
    }

    const handleRegister = async ({ username, email, password }) => {
        setLoading(true)
        setError("")
        try {
            const data = await register({ username, email, password })
            setUser(data.user)
            return true
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Unable to register. Please try again.")
            return false
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        setLoading(true)
        setError("")
        try {
            await logout()
            setUser(null)
            return true
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Unable to log out. Please try again.")
            return false
        } finally {
            setLoading(false)
        }
    }

    return { user, loading, error, handleLogin, handleRegister, handleLogout }
}
