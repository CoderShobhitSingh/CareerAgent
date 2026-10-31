import React from 'react'
import {useNavigate,Link} from "react-router"

const Register = () => {
    const navigate = useNavigate()

    const handleSubmit = (e) => {
        e.preventDefault()
    }

  return (
    <main>
        <div className="form-container">
            <h1>Register</h1>
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label htmlFor="username">Username</label>
                    <input type="text" id="username" name="username" placeholder="John Doe"/>
                    
                </div>
                <div className="input-group">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" name="email" placeholder="you@example.com" autoComplete="email"/>
                    
                </div>
                <div className="input-group">
                    <label htmlFor="password">Password</label>
                    <input type="password" id="password" name="password" placeholder="Enter your password" autoComplete="current-password"/>
                    
                </div>

                <button className="button primary-button" type="submit">Register</button>
            </form>

            <p>Already have an account? <Link to="/login">Login</Link></p>
        </div>
    </main>
  )
}

export default Register