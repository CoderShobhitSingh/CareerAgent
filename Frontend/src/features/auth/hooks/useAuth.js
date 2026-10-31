import {AuthContext} from "../auth.context";
import {useContext,useEffect} from "react"
import {login,register,logout,getMe} from "../services/auth.api"

export const useAuth = () => {
    const context = useContext(AuthContext)
    const {user, loading, setUser, setLoading} = context

    const handleLogin = async ({email,password}) => {
        setLoading(true)
        try{
            const data = await login ({email,password})
        setUser(data.user)
        }
        catch(error){
            console.error("Login failed:", error)
        }
        finally{
            setLoading(false)
        }
        
    }

    const handleRegister = async ({name,email,password}) => {
        setLoading(true)
        try{
            const data = await register ({name,email,password})
            setUser(data.user)
        }
        catch(error){
            console.error("Register failed:", error)
        }
        finally{
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        setLoading(true)
        const data =await logout()
        setUser(null)
        setLoading(false)
    }  
    
    useEffect(()=>{

        const getAndSetUser = async ()=>{
            const data = await getMe()
            setUser(data.user)
            setLoading(false)
        }
        getAndSetUser()
    },[])


    return { user, loading, handleLogin, handleRegister, handleLogout}
}