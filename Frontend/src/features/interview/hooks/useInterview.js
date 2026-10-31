import { useCallback, useContext, useEffect, useState } from "react"
import { useParams } from "react-router"
import { InterviewContext } from "../interview.context"
import {
    generateInterviewReport,
    generateResumePdf,
    getAllInterviewReports,
    getInterviewReportById,
    deleteInterviewReport as deleteInterviewReportRequest,
} from "../services/interview.api"

const getErrorMessage = async error => {
    const responseData = error.response?.data
    if (responseData instanceof Blob) {
        try {
            const responseBody = JSON.parse(await responseData.text())
            if (responseBody.message) {
                return responseBody.message
            }
        } catch {
            // Fall back to the request error when the response is not a JSON error.
        }
    }

    return responseData?.message || error.message || "The request failed. Please try again."
}

export const useInterview = () => {
    const context = useContext(InterviewContext)
    const { interviewId } = useParams()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, error, setError, report, setReport, reports, setReports } = context
    const [downloadingResume, setDownloadingResume] = useState(false)

    const generateReport = useCallback(async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true)
        setError("")
        try {
            const response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            setReport(response.interviewReport)
            return response.interviewReport
        } catch (requestError) {
            setError(await getErrorMessage(requestError))
            return null
        } finally {
            setLoading(false)
        }
    }, [setError, setLoading, setReport])

    const getReportById = useCallback(async (id) => {
        setLoading(true)
        setError("")
        try {
            const response = await getInterviewReportById(id)
            setReport(response.interviewReport)
            return response.interviewReport
        } catch (requestError) {
            setReport(null)
            setError(await getErrorMessage(requestError))
            return null
        } finally {
            setLoading(false)
        }
    }, [setError, setLoading, setReport])

    const getReports = useCallback(async () => {
        setLoading(true)
        setError("")
        try {
            const response = await getAllInterviewReports()
            setReports(response.interviewReports)
            return response.interviewReports
        } catch (requestError) {
            setError(await getErrorMessage(requestError))
            return []
        } finally {
            setLoading(false)
        }
    }, [setError, setLoading, setReports])

    const deleteReport = useCallback(async (id) => {
        setError("")
        try {
            await deleteInterviewReportRequest(id)
            setReports(currentReports => currentReports.filter(item => item._id !== id))
            return true
        } catch (requestError) {
            setError(await getErrorMessage(requestError))
            return false
        }
    }, [setError, setReports])

    const getResumePdf = useCallback(async (interviewReportId) => {
        setDownloadingResume(true)
        setError("")
        try {
            const pdfBlob = await generateResumePdf({ interviewReportId })
            if (!(pdfBlob instanceof Blob) || pdfBlob.size === 0) {
                throw new Error("The generated resume PDF is empty or invalid. Please try again.")
            }
            const pdfHeader = await pdfBlob.slice(0, 5).text()
            if (pdfHeader !== "%PDF-") {
                let message = "The server returned an invalid resume PDF. Please try again."
                try {
                    const responseBody = JSON.parse(await pdfBlob.text())
                    message = responseBody.message || message
                } catch {
                    // Keep the PDF validation message for non-JSON responses.
                }
                throw new Error(message)
            }

            const url = window.URL.createObjectURL(pdfBlob)
            const link = document.createElement("a")
            link.href = url
            link.download = `resume_${interviewReportId}.pdf`
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.setTimeout(() => window.URL.revokeObjectURL(url), 1000)
            return true
        } catch (requestError) {
            setError(await getErrorMessage(requestError))
            return false
        } finally {
            setDownloadingResume(false)
        }
    }, [setError])

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        } else {
            getReports()
        }
    }, [getReportById, getReports, interviewId])

    return { loading, error, report, reports, generateReport, getReportById, getReports, deleteReport, getResumePdf, downloadingResume }
}
