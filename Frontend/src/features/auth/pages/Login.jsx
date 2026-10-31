import { useState } from "react"
import "../auth.form.scss"
import {useNavigate,Link} from "react-router"
import {useAuth} from "../hooks/useAuth"
import LoadingAnimation from "../../../components/LoadingAnimation"

const Login = () => {

    const {loading,error,handleLogin} = useAuth()

    const [email,setEmail] = useState("")
    const [password,setPassword] = useState("")

    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (await handleLogin({email,password})) {
            navigate("/")
        }
    }

    if(loading){
        return <LoadingAnimation message="Signing you in..." />
    }
  return (
    <main>
        <div className="form-container">
            <h1>Login</h1>
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label htmlFor="email">Email</label>
                    <input onChange={(e) => setEmail(e.target.value)} type="email" id="email" name="email" placeholder="you@example.com" autoComplete="email" required/>
                    
                </div>
                <div className="input-group">
                    <label htmlFor="password">Password</label>
                    <input onChange={(e) => setPassword(e.target.value)} type="password" id="password" name="password" placeholder="Enter your password" autoComplete="current-password" required/>
                    
                </div>

                {error && <p className="form-error" role="alert">{error}</p>}
                <button className="button primary-button" type="submit">Log in</button>
            </form>

            <p>Don't have an account? <Link to="/register">Register</Link></p>
        </div>
    </main>
  )
}

export default Login