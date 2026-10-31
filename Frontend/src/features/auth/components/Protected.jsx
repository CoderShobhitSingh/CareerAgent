import {useAuth} from "../hooks/useAuth"
import {Navigate} from "react-router"
import LoadingAnimation from "../../../components/LoadingAnimation"


const Protected = ({children}) => {
    const {loading,user} =  useAuth()

    if(loading){
        return <LoadingAnimation message="Checking your session..." />
    }

    if(!user){
        return <Navigate to="/login" replace />
    }

    return children
}

export default Protected