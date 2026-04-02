import React, { useState, useReducer, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import AdminNavbar from "../AdminNavbar";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import ExamModeSelectionStep from "./ExamModeSelectionStep";
import ExamSetupStep from "./ExamSetupStep";
import SubjectSelectionStep from "./SubjectSelectionStep";
import QuestionEntryStep from "./QuestionEntryStep";
import ReviewSubmitStep from "./ReviewSubmitStep";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Initial state for the exam
const initialExamState = {
  examMode: "",
  title: "",
  examType: "",
  duration: 60,

  // Live exam specific (NO endTime)
  startTime: "",
  password: "",
  isPremium: false,

  // Previous year specific
  examYear: "",
  session: "",

  // Practice specific
  practiceType: "unlimited",
  showResults: true,

  subjects: [],
  isLive: true,

  //HSC specific
  hscGroup: "",
  hscBoard: "",
};

// Custom Alert Modal Component
const CustomAlert = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "warning",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                type === "warning" ? "bg-yellow-100" : "bg-red-100"
              }`}
            >
              <ExclamationTriangleIcon
                className={`w-6 h-6 ${
                  type === "warning" ? "text-yellow-600" : "text-red-600"
                }`}
              />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
          </div>

          <div className="flex space-x-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                type === "warning"
                  ? "bg-yellow-600 hover:bg-yellow-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reducer function to manage exam state
const examReducer = (state, action) => {
  switch (action.type) {
    case "SET_EXAM_MODE":
      return { ...state, examMode: action.payload };
    case "SET_TITLE":
      return { ...state, title: action.payload };
    case "SET_EXAM_TYPE":
      return { ...state, examType: action.payload };
    case "SET_HSC_GROUP":
      return { ...state, hscGroup: action.payload };
    case "SET_HSC_BOARD":
      return { ...state, hscBoard: action.payload };
    case "SET_DURATION":
      return { ...state, duration: action.payload };
    case "SET_START_TIME":
      return { ...state, startTime: action.payload };
    case "SET_PASSWORD":
      return { ...state, password: action.payload };
    case "SET_PREMIUM":
      return { ...state, isPremium: action.payload };
    case "SET_EXAM_YEAR":
      return { ...state, examYear: action.payload };
    case "SET_BATCH":
      return { ...state, batch: action.payload };
    case "SET_PRACTICE_TYPE":
      return { ...state, practiceType: action.payload };
    case "SET_SHOW_RESULTS":
      return { ...state, showResults: action.payload };
    case "ADD_SUBJECT":
      return {
        ...state,
        subjects: [...state.subjects, { ...action.payload, questions: [] }],
      };
    case "REMOVE_SUBJECT":
      return {
        ...state,
        subjects: state.subjects.filter((s) => s.name !== action.payload),
      };
    case "UPDATE_QUESTION_COUNT":
      return {
        ...state,
        subjects: state.subjects.map((subject) =>
          subject.name === action.payload.subjectName
            ? { ...subject, questionCount: action.payload.count }
            : subject
        ),
      };
    case "SAVE_QUESTION":
      const { subjectIndex, questionIndex, question } = action.payload;
      const updatedSubjects = [...state.subjects];
      if (!updatedSubjects[subjectIndex].questions) {
        updatedSubjects[subjectIndex].questions = [];
      }
      updatedSubjects[subjectIndex].questions[questionIndex] = question;
      return { ...state, subjects: updatedSubjects };
    case "LOAD_FROM_CACHE":
      return action.payload;
    case "RESET":
      return initialExamState;
    default:
      return state;
  }
};

// Helper function to read from localStorage
const readFromLocalStorage = (key, fallback) => {
  try {
    const cached = localStorage.getItem(key);
    return cached ? JSON.parse(cached) : fallback;
  } catch (error) {
    console.warn(`Error reading ${key} from localStorage:`, error);
    return fallback;
  }
};

// Helper function to write to localStorage
const writeToLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Error writing ${key} to localStorage:`, error);
  }
};

// Validation function
const isStepValid = (step, examData) => {

  switch (step) {
    case 0: // Exam Mode Selection
      return examData.examMode !== "";

    case 1: // Exam Setup
      const baseValid = examData.title && examData.examType;

      if (examData.examMode === "live") {
        return (
          baseValid &&
          examData.duration &&
          examData.duration > 0 &&
          examData.startTime
        );
      } else if (examData.examMode === "previous") {
        return baseValid && examData.examYear;
      } else if (examData.examMode === "practice") {
        return baseValid;
      }
      return false;

    case 2: // Subject Selection - ONLY check subjects and question counts
      const hasSubjects = examData.subjects && examData.subjects.length > 0;
      const allHaveValidCounts =
        examData.subjects &&
        examData.subjects.every(
          (s) =>
            s.questionCount &&
            s.questionCount > 0 &&
            Number.isInteger(s.questionCount)
        );

      return hasSubjects && allHaveValidCounts;

    case 3: // Question Entry - Check if all questions are added
      if (!examData.subjects || examData.subjects.length === 0) return false;

      return examData.subjects.every(
        (subject) =>
          subject.questions &&
          subject.questions.length === subject.questionCount &&
          subject.questions.every(
            (q) =>
              q.text &&
              q.options &&
              q.options.length === 4 &&
              q.options.every((opt) => opt && opt.trim() !== "") &&
              q.correctAnswer !== undefined &&
              q.correctAnswer >= 0 &&
              q.correctAnswer < 4
          )
      );

    default:
      return true;
  }
};

const AdminExamCreator = () => {
  // Initialize state from localStorage
  const [currentStep, setCurrentStep] = useState(() =>
    readFromLocalStorage("exam-currentStep", 0)
  );
  const [examData, setExamData] = useReducer(
    examReducer,
    readFromLocalStorage("exam-data", initialExamState)
  );

  // Alert modal states
  const [showClearCacheAlert, setShowClearCacheAlert] = useState(false);
  const [showResetSubjectsAlert, setShowResetSubjectsAlert] = useState(false);

  const steps = [
    { id: 0, title: "Exam Mode", description: "Choose exam type" },
    { id: 1, title: "Exam Setup", description: "Basic configuration" },
    { id: 2, title: "Subjects", description: "Select subjects" },
    { id: 3, title: "Add Questions", description: "Create questions" },
    { id: 4, title: "Review", description: "Final review" },
  ];

  // Save currentStep to localStorage whenever it changes
  useEffect(() => {
    writeToLocalStorage("exam-currentStep", currentStep);
  }, [currentStep]);

  // Save examData to localStorage whenever it changes
  useEffect(() => {
    writeToLocalStorage("exam-data", examData);
  }, [examData]);

  // Function to confirm reset and go back to subjects
  const confirmResetToSubjects = () => {
    // Clear all questions but keep exam setup and subjects structure
    const clearedData = {
      ...examData,
      subjects: examData.subjects.map((subject) => ({
        ...subject,
        questions: [],
      })),
    };

    setExamData({ type: "LOAD_FROM_CACHE", payload: clearedData });
    setCurrentStep(2);
    setShowResetSubjectsAlert(false);
  };

  // Function to clear cache
  const confirmClearCache = () => {
    localStorage.removeItem("exam-currentStep");
    localStorage.removeItem("exam-data");
    setExamData({ type: "RESET" });
    setCurrentStep(0);
    setShowClearCacheAlert(false);
  };

  const [loading, setLoading] = useState(false); // Add this at the top of your component

  const checkDuplicateBeforeNext = async () => {
    try {
      if (examData.examMode !== "previous") return true;

      const routePrefix = examData.examType
        ? examData.examType.toLowerCase()
        : "";
      const apiUrl = `${BACKEND_URL}/${routePrefix}-questions/check-duplicate`;

      const params = (() => {
        if (examData.examType === "BCS") {
          return { batch: examData.batch };
        } else if (examData.examType === "HSC") {
          return {
            examYear: examData.examYear,
            hscGroup: examData.hscGroup,
            hscBoard: examData.hscBoard,
          };
        } else if (examData.examType === "Bank") {
          return { examYear: examData.examYear };
        }
      })();

      const response = await axios.get(apiUrl, { params });

      if (response.data.exists) {
        Swal.fire({
          title: "Warning",
          text: response.data.message || "This exam already exists!",
          icon: "warning",
          confirmButtonText: "OK",
          customClass: {
            confirmButton:
              "bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded",
          },
        });
        return false;
      }

      return true;
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: "Error",
        text: "Failed to check duplicates",
        icon: "error",
      });
      return false;
    }
  };

  const handleNext = async () => {
    // Only check duplicates when moving from step 1 to step 2
    if (currentStep === 1) {
      setLoading(true); // Start loading
      const canProceed = await checkDuplicateBeforeNext();
      setLoading(false); // Stop loading

      if (!canProceed) return; // Stop if duplicate exists
    }

    if (currentStep === 4) {
      handleSubmit();
    } else {
      setCurrentStep(Math.min(4, currentStep + 1));
    }
  };

  const handlePrev = () => {
    // If going back from step 2 to step 1, clear subjects only
    if (currentStep === 2) {
      const clearedData = {
        ...examData,
        subjects: [], // Clear all subjects automatically
      };
      setExamData({ type: "LOAD_FROM_CACHE", payload: clearedData });
      setCurrentStep(1);
    }
    // If going back from step 1 to step 0, clear all exam data completely
    else if (currentStep === 1) {
      setExamData({ type: "RESET" }); // Reset to initial state completely
      setCurrentStep(0);
    }
    // If trying to go back from step 3 or 4 to step 2, show confirmation
    else if (currentStep >= 3 && currentStep - 1 === 2) {
      setShowResetSubjectsAlert(true);
    }
    // Normal navigation for other steps
    else {
      setCurrentStep(Math.max(0, currentStep - 1));
    }
  };

  const handleSubmit = async () => {
    try {

      // Here you would typically send the data to your API
      // const response = await fetch('/api/exams', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(examData)
      // });

      alert(
        "✅ Exam created successfully by Admin!\n\nExam Details:\n" +
          `- Title: ${examData.title}\n` +
          `- Type: ${examData.examType}\n` +
          `- Mode: ${examData.examMode}\n` +
          `- Subjects: ${examData.subjects.length}\n` +
          `- Total Questions: ${examData.subjects.reduce(
            (sum, s) => sum + s.questionCount,
            0
          )}\n\n` +
          "Check console for full data."
      );

      // Clear localStorage and reset form for next exam creation
      localStorage.removeItem("exam-currentStep");
      localStorage.removeItem("exam-data");
      setExamData({ type: "RESET" });
      setCurrentStep(0);
    } catch (error) {
      console.error("Error creating exam:", error);
      alert("❌ Error creating exam. Please try again.");
    }
  };

  return (
    <div>
      <AdminNavbar />
      <div className="min-h-screen bg-gray-50 sm:py-8">
        <div className="max-w-7xl pt-4 mx-auto">
          {/* Custom Alert Modals */}
          <CustomAlert
            isOpen={showClearCacheAlert}
            onClose={() => setShowClearCacheAlert(false)}
            onConfirm={confirmClearCache}
            title="Clear All Progress"
            message="This will permanently delete all saved exam data and return you to the beginning. This action cannot be undone."
            type="warning"
          />

          <CustomAlert
            isOpen={showResetSubjectsAlert}
            onClose={() => setShowResetSubjectsAlert(false)}
            onConfirm={confirmResetToSubjects}
            title="Reset to Subjects"
            message="Going back to subjects will permanently delete all questions and progress from the current exam. You will need to re-enter all questions. Are you sure you want to continue?"
            type="warning"
          />

          {/* Admin Instructions */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-blue-600 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-blue-800">
                    Dynamic Exam Creator
                  </h3>
                  <p className="text-xs text-blue-600 mt-1">
                    Create Live Exams, Previous Year Papers, or Practice Tests
                    with mathematical symbols support. Progress is automatically
                    saved.
                  </p>
                </div>
              </div>

              {/* Clear Cache Button with subtle styling */}
              <button
                onClick={() => setShowClearCacheAlert(true)}
                className="px-3 py-1.5 text-xs font-medium text-orange-700 bg-orange-100 border border-orange-200 rounded-md hover:bg-orange-200 transition-colors"
              >
                Clear Cache
              </button>
            </div>
          </div>

          {/* Back to Subjects Option (Step 3+) with subtle styling */}
          {currentStep >= 3 && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="w-4 h-4 text-amber-600 mr-2" />
                  <span className="text-sm text-amber-800">
                    Need to modify subjects or question counts?
                  </span>
                </div>
                <button
                  onClick={() => setShowResetSubjectsAlert(true)}
                  className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 border border-red-200 rounded-md hover:bg-red-200 transition-colors"
                >
                  ↩ Back to Subjects
                </button>
              </div>
            </div>
          )}

          {/* Progress Stepper */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between overflow-x-auto pb-2">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-shrink-0">
                  <div
                    className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 ${
                      currentStep >= index
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "border-gray-300 text-gray-400"
                    }`}
                  >
                    {currentStep > index ? (
                      <CheckCircleIcon className="w-4 h-4 sm:w-6 sm:h-6" />
                    ) : (
                      <span className="text-xs sm:text-sm font-medium">
                        {index + 1}
                      </span>
                    )}
                  </div>
                  <div className="ml-2 sm:ml-4 min-w-0 hidden sm:block">
                    <p
                      className={`text-xs sm:text-sm font-medium ${
                        currentStep >= index ? "text-blue-600" : "text-gray-500"
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500 hidden md:block">
                      {step.description}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 sm:mx-4 min-w-[20px] ${
                        currentStep > index ? "bg-blue-600" : "bg-gray-300"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            {currentStep === 0 && (
              <ExamModeSelectionStep
                examData={examData}
                setExamData={setExamData}
              />
            )}
            {currentStep === 1 && (
              <ExamSetupStep examData={examData} setExamData={setExamData} />
            )}
            {currentStep === 2 && (
              <SubjectSelectionStep
                examData={examData}
                setExamData={setExamData}
              />
            )}
            {currentStep === 3 && (
              <QuestionEntryStep
                examData={examData}
                setExamData={setExamData}
              />
            )}
            {currentStep === 4 && (
              <ReviewSubmitStep
                examData={examData}
                setExamData={setExamData}
                setCurrentStep={setCurrentStep} // Pass it here
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-4 sm:mt-6">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="flex items-center px-3 py-2 sm:px-4 sm:py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="w-4 h-4 mr-1 sm:mr-2" />
              Previous
            </button>

            <div className="flex items-center space-x-3">
              {/* Debug info */}
              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Step {currentStep + 1}/5 | Valid:{" "}
                {isStepValid(currentStep, examData) ? "✅" : "❌"}
              </div>

              <button
                onClick={handleNext}
                disabled={
                  !isStepValid(currentStep, examData) || currentStep === 4
                }
                className={`flex items-center px-3 py-2 sm:px-4 sm:py-2 text-sm font-medium border border-transparent rounded-md transition-colors ${
                  isStepValid(currentStep, examData) && currentStep !== 4
                    ? "text-white bg-blue-600 hover:bg-blue-700"
                    : "text-gray-400 bg-gray-300 cursor-not-allowed"
                }`}
              >
                {currentStep === 4 ? "Create Exam" : "Next"}
                {currentStep !== 4 && (
                  <ChevronRightIcon className="w-4 h-4 ml-1 sm:ml-2" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="loader border-4 border-blue-500 border-t-transparent rounded-full w-12 h-12 animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default AdminExamCreator;
