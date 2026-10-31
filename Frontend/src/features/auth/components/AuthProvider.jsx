import { useEffect, useState } from "react"
import { AuthContext } from "../auth.context"
import { getMe } from "../services/auth.api"

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadUser = async () => {
            try {
                const data = await getMe()
                setUser(data.user)
            } catch (error) {
                if (error.response?.status !== 401) {
                    console.error("Unable to load current user:", error)
                }
            } finally {
                setLoading(false)
            }
        }

        loadUser()
    }, [])

    return (
        <AuthContext.Provider value={{ user, loading, setUser, setLoading }}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthProvider
