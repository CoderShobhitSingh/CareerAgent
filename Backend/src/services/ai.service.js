const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const puppeteer = require("puppeteer");

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

const matchEvidenceSchema = z.object({
  profileSource: z.enum(["resume", "selfDescription"]),
  profileExcerpt: z.string().trim().min(1),
  jobRequirement: z.string().trim().min(1),
  relevance: z.string().trim().min(1),
});

const matchCategorySchema = z.object({
  score: z.number().min(0).max(100),
  explanation: z.string().min(1),
  evidence: z.array(matchEvidenceSchema).max(4),
});

const matchCategoryJsonSchema = {
  type: "object",
  properties: {
    score: { type: "number", minimum: 0, maximum: 100 },
    explanation: { type: "string" },
    evidence: {
      type: "array",
      maxItems: 4,
      items: {
        type: "object",
        properties: {
          profileSource: { type: "string", enum: ["resume", "selfDescription"] },
          profileExcerpt: { type: "string" },
          jobRequirement: { type: "string" },
          relevance: { type: "string" },
        },
        required: ["profileSource", "profileExcerpt", "jobRequirement", "relevance"],
      },
    },
  },
  required: ["score", "explanation", "evidence"],
};

const interviewReportSchema = z.object({
  matchScore: z
    .number()
    .min(0)
    .max(100)
    .describe("The overall match score, calculated from the three match categories"),
  matchBreakdown: z.object({
    skills: matchCategorySchema,
    experience: matchCategorySchema,
    keywords: matchCategorySchema,
  }),
  technicalQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe("The technical question can be asked in the interview"),
        intention: z
          .string()
          .describe("The intention of interviewer behind asking this question"),
        answer: z
          .string()
          .describe(
            "How to answer this question, what points to cover, what approach to take etc.",
          ),
      }),
    )
    .length(30, "Exactly thirty technical questions are required")
    .describe(
      "Technical questions that can be asked in the interview along with their intention and how to answer them",
    ),
  behavioralQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe("The technical question can be asked in the interview"),
        intention: z
          .string()
          .describe("The intention of interviewer behind asking this question"),
        answer: z
          .string()
          .describe(
            "How to answer this question, what points to cover, what approach to take etc.",
          ),
      }),
    )
    .length(10, "Exactly ten behavioral questions are required")
    .describe(
      "Behavioral questions that can be asked in the interview along with their intention and how to answer them",
    ),
  skillGaps: z
    .array(
      z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z
          .enum(["low", "medium", "high"])
          .describe(
            "The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances",
          ),
      }),
    )
    .describe(
      "List of skill gaps in the candidate's profile along with their severity",
    ),
  preparationPlan: z
    .array(
      z.object({
        day: z
          .number()
          .describe("The day number in the preparation plan, starting from 1"),
        focus: z
          .string()
          .describe(
            "The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc.",
          ),
        tasks: z
          .array(z.string())
          .describe(
            "List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.",
          ),
      }),
    )
    .min(3, "At least three preparation days are required")
    .describe(
      "A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively",
    ),
  title: z
    .string()
    .min(1, "A job title is required")
    .describe(
      "The title of the job for which the interview report is generated",
    ),
});

const interviewReportJsonSchema = {
  type: "object",
  properties: {
    matchScore: { type: "number", minimum: 0, maximum: 100 },
    matchBreakdown: {
      type: "object",
      properties: {
        skills: matchCategoryJsonSchema,
        experience: matchCategoryJsonSchema,
        keywords: matchCategoryJsonSchema,
      },
      required: ["skills", "experience", "keywords"],
    },
    technicalQuestions: {
      type: "array",
      minItems: 30,
      maxItems: 30,
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          intention: { type: "string" },
          answer: { type: "string" },
        },
        required: ["question", "intention", "answer"],
      },
    },
    behavioralQuestions: {
      type: "array",
      minItems: 10,
      maxItems: 10,
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          intention: { type: "string" },
          answer: { type: "string" },
        },
        required: ["question", "intention", "answer"],
      },
    },
    skillGaps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          skill: { type: "string" },
          severity: { type: "string", enum: ["low", "medium", "high"] },
        },
        required: ["skill", "severity"],
      },
    },
    preparationPlan: {
      type: "array",
      minItems: 3,
      items: {
        type: "object",
        properties: {
          day: { type: "integer", minimum: 1 },
          focus: { type: "string" },
          tasks: { type: "array", items: { type: "string" } },
        },
        required: ["day", "focus", "tasks"],
      },
    },
    title: { type: "string" },
  },
  required: [
    "matchScore",
    "matchBreakdown",
    "technicalQuestions",
    "behavioralQuestions",
    "skillGaps",
    "preparationPlan",
    "title",
  ],
};

async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
}) {
  const prompt = `Generate a complete, detailed interview report for a candidate with the following details.
Return exactly 30 technical questions and exactly 10 behavioral questions, plus a multi-day preparation plan with tasks for every day. Do not return fewer or more questions, empty question arrays, or omit any requested field. Keep each answer practical and concise. Each question must include its question, interviewer intention, and answer. Include a concise role title and a matchBreakdown with scores from 0 to 100 for skills, experience, and keywords.

Score skills as 40%, experience as 35%, and keywords as 25% of the overall matchScore. Assess skills against the job's required capabilities, experience against relevant scope and seniority, and keywords against explicit job terminology. Explain each category score briefly. For each category, provide up to four evidence items. Each profileExcerpt must be a short, exact quote copied from the supplied resume or self-description, with profileSource set to the source it came from; each jobRequirement must be a short, exact quote copied from the job description. Never invent or paraphrase quoted evidence. If no direct evidence supports a category, return an empty evidence array and explain the limitation. Calculate matchScore using the stated weights.

                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}
`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: interviewReportJsonSchema,
    },
  });

  if (!response.text) {
    throw new Error("The AI service returned an empty interview report.");
  }

  const parsedResponse = interviewReportSchema.safeParse(JSON.parse(response.text));
  if (!parsedResponse.success) {
    throw new Error(`The AI service returned an incomplete interview report: ${parsedResponse.error.message}`);
  }

  return parsedResponse.data;
}

async function generatePdfFromHtml(htmlContent) {
  const launchOptions = process.env.PUPPETEER_EXECUTABLE_PATH
    ? { executablePath: process.env.PUPPETEER_EXECUTABLE_PATH }
    : {};
  const browser = await puppeteer.launch(launchOptions);

  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    return await page.pdf({
      format: "A4",
      margin: {
        top: "20mm",
        bottom: "20mm",
        left: "15mm",
        right: "15mm",
      },
    });
  } finally {
    await browser.close();
  }
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
  const resumePdfSchema = z.object({
    html: z.string().trim().min(1),
  });

  const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                    `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: {
        type: "object",
        properties: {
          html: { type: "string" },
        },
        required: ["html"],
      },
    },
  });

  if (!response.text) {
    throw new Error("The AI service returned an empty resume.");
  }

  let jsonContent;
  try {
    jsonContent = resumePdfSchema.parse(JSON.parse(response.text));
  } catch (error) {
    throw new Error("The AI service returned an invalid resume document.", {
      cause: error,
    });
  }

  const pdfBuffer = await generatePdfFromHtml(jsonContent.html);

  return pdfBuffer;
}

module.exports = { generateInterviewReport, generateResumePdf };
