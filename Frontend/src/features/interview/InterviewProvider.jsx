import { useState } from "react"
import { InterviewContext } from "./interview.context"

const InterviewProvider = ({ children }) => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [report, setReport] = useState(null)
    const [reports, setReports] = useState([])

    return (
        <InterviewContext.Provider value={{ loading, setLoading, error, setError, report, setReport, reports, setReports }}>
            {children}
        </InterviewContext.Provider>
    )
}

export default InterviewProvider
