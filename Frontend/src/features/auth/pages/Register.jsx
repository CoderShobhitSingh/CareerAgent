import { useState } from "react"
import "../auth.form.scss"
import {useNavigate,Link} from "react-router"
import {useAuth} from "../hooks/useAuth"
import LoadingAnimation from "../../../components/LoadingAnimation"

const Register = () => {
    const navigate = useNavigate()
    const [username,setUsername] = useState("")
    const [email,setEmail] = useState("")
    const [password,setPassword] = useState("")

    const {loading,error,handleRegister} = useAuth()

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (await handleRegister({username,email,password})) {
            navigate("/")
        }
    }

    if(loading){
        return <LoadingAnimation message="Creating your account..." />
    }

  return (
    <main>
        <div className="form-container">
            <h1>Register</h1>
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label htmlFor="username">Username</label>
                    <input onChange={(e) => setUsername(e.target.value)} type="text" id="username" name="username" placeholder="John Doe" autoComplete="username" required/>
                    
                </div>
                <div className="input-group">
                    <label htmlFor="email">Email</label>
                    <input onChange={(e) => setEmail(e.target.value)} type="email" id="email" name="email" placeholder="you@example.com" autoComplete="email" required/>
                    
                </div>
                <div className="input-group">
                    <label htmlFor="password">Password</label>
                    <input onChange={(e) => setPassword(e.target.value)} type="password" id="password" name="password" placeholder="Create a password" autoComplete="new-password" required minLength={8}/>
                    
                </div>

                {error && <p className="form-error" role="alert">{error}</p>}
                <button className="button primary-button" type="submit">Register</button>
            </form>

            <p>Already have an account? <Link to="/login">Login</Link></p>
        </div>
    </main>
  )
}

export default Register