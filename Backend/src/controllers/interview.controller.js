const pdfParse = require("pdf-parse")
const path = require("node:path")
const { pathToFileURL } = require("node:url")
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")

const pdfJsPackagePath = require.resolve("pdfjs-dist/package.json", {
    paths: [require.resolve("pdf-parse")]
})
const standardFontDataUrl = pathToFileURL(
    `${path.join(path.dirname(pdfJsPackagePath), "standard_fonts")}${path.sep}`
).href

function normalizeEvidenceText(value) {
    return value.normalize("NFKC").replace(/\s+/g, " ").trim().toLocaleLowerCase()
}

function keepVerifiedEvidence(evidence, profileSources, jobDescription) {
    const normalizedJobDescription = normalizeEvidenceText(jobDescription)

    return evidence.filter(({ profileSource, profileExcerpt, jobRequirement }) => {
        const sourceText = profileSources[profileSource]
        return sourceText &&
        normalizeEvidenceText(sourceText).includes(normalizeEvidenceText(profileExcerpt)) &&
        normalizedJobDescription.includes(normalizeEvidenceText(jobRequirement))
    })
}


async function generateInterViewReportController(req, res) {
    const { selfDescription, jobDescription } = req.body
    const resumeFile = req.file

    if (!jobDescription?.trim()) {
        return res.status(400).json({ message: "A job description is required." })
    }
    if (!resumeFile && !selfDescription?.trim()) {
        return res.status(400).json({ message: "Upload a PDF resume or provide a self-description." })
    }
    if (resumeFile && (
        resumeFile.mimetype !== "application/pdf" ||
        !resumeFile.buffer.subarray(0, 5).equals(Buffer.from("%PDF-"))
    )) {
        return res.status(400).json({ message: "Resume must be a valid PDF file." })
    }

    let resume = ""
    if (resumeFile) {
        const parser = new pdfParse.PDFParse({
            data: Uint8Array.from(resumeFile.buffer),
            standardFontDataUrl
        })
        try {
            const resumeContent = await parser.getText()
            resume = resumeContent.text
        } catch (error) {
            console.error("Unable to parse uploaded resume:", error)
            return res.status(400).json({ message: "Unable to read the uploaded PDF resume." })
        } finally {
            await parser.destroy()
        }
    }
    if (!resume.trim() && !selfDescription?.trim()) {
        return res.status(400).json({ message: "The PDF has no readable text. Provide a self-description instead." })
    }

    let interviewReportFromAi
    try {
        interviewReportFromAi = await generateInterviewReport({
            resume,
            selfDescription: selfDescription?.trim() || "",
            jobDescription: jobDescription.trim()
        })
    } catch (error) {
        console.error("Interview strategy generation failed:", error.message)
        return res.status(502).json({
            message: "We could not generate a complete interview strategy. Please try again."
        })
    }
    const profileSources = {
        resume,
        selfDescription: selfDescription?.trim() || ""
    }
    const matchBreakdown = Object.fromEntries(
        Object.entries(interviewReportFromAi.matchBreakdown).map(([category, result]) => [
            category,
            {
                ...result,
                evidence: keepVerifiedEvidence(result.evidence, profileSources, jobDescription)
            }
        ])
    )
    const matchScore = Math.round(
        matchBreakdown.skills.score * 0.4 +
        matchBreakdown.experience.score * 0.35 +
        matchBreakdown.keywords.score * 0.25
    )
    const generatedTitle = typeof interviewReportFromAi.title === "string"
        ? interviewReportFromAi.title.trim()
        : ""
    const fallbackTitle = jobDescription
        .split(/\r?\n/)
        .map(line => line.trim())
        .find(Boolean)
        ?.slice(0, 100) || "Interview Strategy"

    const interviewReport = await interviewReportModel.create({
        ...interviewReportFromAi,
        matchScore,
        matchBreakdown,
        user: req.user.id,
        resume,
        selfDescription: selfDescription?.trim() || "",
        jobDescription: jobDescription.trim(),
        title: generatedTitle || fallbackTitle
    })

    res.status(201).json({
        message: "Interview report generated successfully.",
        interviewReport
    })

}


async function getInterviewReportByIdController(req, res) {

    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
}


async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}

async function deleteInterviewReportController(req, res) {
    const { interviewId } = req.params
    const deletedReport = await interviewReportModel.findOneAndDelete({
        _id: interviewId,
        user: req.user.id
    })

    if (!deletedReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    res.status(200).json({
        message: "Interview report deleted successfully."
    })
}



async function generateResumePdfController(req, res) {
    const { interviewReportId } = req.params

    const interviewReport = await interviewReportModel.findOne({
        _id: interviewReportId,
        user: req.user.id
    })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    const { resume, jobDescription, selfDescription } = interviewReport

    const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
    })

    res.send(pdfBuffer)
}

module.exports = {
    generateInterViewReportController,
    getInterviewReportByIdController,
    getAllInterviewReportsController,
    deleteInterviewReportController,
    generateResumePdfController
}