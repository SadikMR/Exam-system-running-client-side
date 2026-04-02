import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const ReviewSubmitStep = ({ examData, setExamData, setCurrentStep }) => {
  // ---------- State ----------
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // ---------- Derived ----------
  const currentSubject = examData.subjects[currentSubjectIndex];
  const currentQuestion = currentSubject?.questions?.[currentQuestionIndex];
  const hasQuestions = currentSubject?.questions?.length > 0;

  const totalQuestions = examData.subjects.reduce(
    (sum, subject) => sum + subject.questionCount,
    0
  );
  const completedQuestions = examData.subjects.reduce(
    (sum, subject) => sum + (subject.questions?.length || 0),
    0
  );
  const isComplete = completedQuestions === totalQuestions;

  // ---------- UI Helpers ----------
  const getModeIcon = (mode) => {
    switch (mode) {
      case "live":
        return "🔴";
      case "previous":
        return "📚";
      case "practice":
        return "💪";
      default:
        return "📝";
    }
  };

  const getModeTitle = (mode) => {
    switch (mode) {
      case "live":
        return "Live Exam";
      case "previous":
        return "Previous Year Paper";
      case "practice":
        return "Practice Test";
      default:
        return "Exam";
    }
  };

  const getEndTime = () => {
    if (examData.startTime && examData.duration) {
      const startTime = new Date(examData.startTime);
      const endTime = new Date(startTime.getTime() + examData.duration * 60000);
      return endTime.toLocaleString();
    }
    return "Will be calculated";
  };

  const InfoCard = ({ label, value }) => (
    <div className="flex flex-col rounded-lg bg-white/60 p-4 shadow-inner">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <span className="mt-0.5 font-semibold text-gray-800">{value}</span>
    </div>
  );

  // ---------- Navigation ----------
  const nextSubject = () => {
    if (currentSubjectIndex < examData.subjects.length - 1) {
      setCurrentSubjectIndex(currentSubjectIndex + 1);
      setCurrentQuestionIndex(0);
    }
  };

  const prevSubject = () => {
    if (currentSubjectIndex > 0) {
      setCurrentSubjectIndex(currentSubjectIndex - 1);
      setCurrentQuestionIndex(0);
    }
  };

  const nextQuestion = () => {
    const maxQuestions = currentSubject?.questions?.length || 0;
    if (currentQuestionIndex < maxQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (currentSubjectIndex < examData.subjects.length - 1) {
      setCurrentSubjectIndex(currentSubjectIndex + 1);
      setCurrentQuestionIndex(0);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (currentSubjectIndex > 0) {
      const prevSubject = examData.subjects[currentSubjectIndex - 1];
      setCurrentSubjectIndex(currentSubjectIndex - 1);
      setCurrentQuestionIndex(
        Math.max(0, (prevSubject.questions?.length || 1) - 1)
      );
    }
  };

  const navigateToQuestion = (questionIndex) => {
    setCurrentQuestionIndex(questionIndex);
  };

  const navigateToSubject = (subjectIndex) => {
    setCurrentSubjectIndex(subjectIndex);
    setCurrentQuestionIndex(0);
  };

  // ---------- Payload Builders ----------
  const prepareLiveExamPayload = (data) => ({
    title: data.title,
    examType: data.examType,
    examMode: "live",
    duration: data.duration,
    startTime: data.startTime,
    endTime: data.startTime
      ? new Date(
          new Date(data.startTime).getTime() + data.duration * 60000
        ).toISOString()
      : null,
    password: data.password || null,
    isPremium: data.isPremium || false,
    subjects: data.subjects.map((s) => ({
      name: s.name,
      questionCount: s.questionCount,
      questions:
        s.questions?.map((q) => ({
          text: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty,
        })) || [],
    })),
    status: "published",
    totalQuestions: data.subjects.reduce((sum, s) => sum + s.questionCount, 0),
  });

  const preparePreviousExamPayload = (data) => {
    const payload = {
      title: data.title,
      examType: data.examType,
      examMode: "previous",
      examYear: data.examYear,
      subjects: data.subjects.map((s) => ({
        name: s.name,
        questionCount: s.questionCount,
        questions:
          s.questions?.map((q) => ({
            text: q.text,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
          })) || [],
      })),
    };

    // Include hscGroup only for HSC
    if (data.examType === "HSC" && data.hscGroup) {
      payload.hscGroup = data.hscGroup;
      payload.hscBoard = data.hscBoard;
    }
    if (data.examType == "BCS" && data.batch) {
      payload.batch = data.batch;
    }

    return payload;
  };

  const preparePracticePayload = (data) => ({
    title: data.title,
    examType: data.examType,
    examMode: "practice",
    duration: data.duration || null,
    practiceType: data.practiceType,
    showResults: data.showResults ?? true,
    subjects: data.subjects.map((s) => ({
      name: s.name,
      questionCount: s.questionCount,
      questions:
        s.questions?.map((q) => ({
          text: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        })) || [],
    })),
  });

  // ---------- Submit Handler ----------
  const handleSubmitExam = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      let payload;
      let apiUrl;

      if (examData.examMode === "live") {
        payload = prepareLiveExamPayload(examData);
        apiUrl = `${BACKEND_URL}/liveExam/create`;
      } else if (examData.examMode === "previous") {
        payload = preparePreviousExamPayload(examData);
        const routePrefix = examData.examType
          ? examData.examType.toLowerCase()
          : "previous";
        apiUrl = `${BACKEND_URL}/${routePrefix}-questions/create`;
      } else if (examData.examMode === "practice") {
        payload = preparePracticePayload(examData);
        apiUrl = `${BACKEND_URL}/practiceExam/create`;
      } else {
        throw new Error("Unsupported exam mode");
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.message || `HTTP error! status: ${response.status}`
        );
      }

      setSubmitSuccess(true);

      // Reset exam data and step
      setExamData({ type: "RESET" });
      setCurrentStep(0); // Make sure you pass setCurrentStep as prop to this component
      localStorage.removeItem("exam-data");
      localStorage.removeItem("exam-currentStep");

      // SweetAlert success modal
      await Swal.fire({
        title: "✅ Exam submitted successfully!",
        text: "The exam has been saved successfully.",
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#2563EB",
        background: "#fff",
        color: "#111827",
        allowOutsideClick: true,
      });

      // Optional: attach returned id to examData if needed
      if (result._id) {
        examData._id = result._id;
        examData.publishedAt = new Date().toISOString();
      }
    } catch (err) {
      console.error("Submission error:", err);
      setSubmitError(err.message || "Submission failed");

      // SweetAlert error modal
      Swal.fire({
        title: "❌ Submission failed",
        text: err.message || "Unknown error",
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#DC2626",
        background: "#fff",
        color: "#111827",
        allowOutsideClick: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  const getOrdinalSuffix = (value) => {
    const n = parseInt(value, 10);
    if (Number.isNaN(n)) return ""; // guard for non-numeric batch values
    const j = n % 10;
    const k = n % 100;
    if (j === 1 && k !== 11) return "st";
    if (j === 2 && k !== 12) return "nd";
    if (j === 3 && k !== 13) return "rd";
    return "th";
  };

  // ---------- Render (keeps your original question UI) ----------
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Review & Submit
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          Final review before publishing your exam
        </p>
      </div>

      {/* Professional Exam Details Card */}
      <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-sm">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <span className="text-3xl">{getModeIcon(examData.examMode)}</span>
          <div className="space-y-0.5">
            <h3 className="text-xl font-semibold text-gray-900">
              {examData.title}
            </h3>
            <p className="text-sm text-gray-600">
              {getModeTitle(examData.examMode)} • {examData.examType}
            </p>
          </div>
        </div>

        {/* Body - Conditional fields based on exam mode */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 text-[15px]">
          {/* Live Exam Fields Only */}
          {examData.examMode === "live" && (
            <>
              <InfoCard
                label="Duration"
                value={`${examData.duration} minutes`}
              />
              <InfoCard
                label="Start Time"
                value={
                  examData.startTime
                    ? new Date(examData.startTime).toLocaleString()
                    : "Not set"
                }
              />
              <InfoCard label="End Time" value={getEndTime()} />
              <InfoCard
                label="Password"
                value={examData.password ? "Protected" : "Open Access"}
              />
              <InfoCard
                label="Access"
                value={examData.isPremium ? "Premium Only" : "Free"}
              />
            </>
          )}

          {/* Previous Year Fields */}
          {examData.examMode === "previous" && (
            <>
              <InfoCard label="Year" value={examData.examYear} />

              {examData.examType === "HSC" && (
                <>
                  {examData.hscGroup && (
                    <InfoCard label="Group" value={examData.hscGroup} />
                  )}
                  {examData.hscBoard && (
                    <InfoCard label="Board" value={examData.hscBoard} />
                  )}
                </>
              )}

              {examData.examType === "BCS" && examData.batch && (
                <InfoCard
                  label="Batch"
                  value={`${examData.batch}${getOrdinalSuffix(examData.batch)}`}
                />
              )}
            </>
          )}

          {/* Practice Test Fields */}
          {examData.examMode === "practice" && (
            <>
              <InfoCard label="Type" value={examData.practiceType} />
              <InfoCard
                label="Results"
                value={
                  examData.showResults ? "Show Immediately" : "Hide Results"
                }
              />
            </>
          )}
        </div>
      </div>

      {/* Subject Navigation */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={prevSubject}
            disabled={currentSubjectIndex === 0}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4 mr-2" />
            Previous Subject
          </button>

          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              {currentSubject?.name}
            </h3>
            <p className="text-sm text-gray-600">
              Subject {currentSubjectIndex + 1} of {examData.subjects.length}
            </p>
          </div>

          <button
            onClick={nextSubject}
            disabled={currentSubjectIndex === examData.subjects.length - 1}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next Subject
            <ChevronRightIcon className="w-4 h-4 ml-2" />
          </button>
        </div>

        {/* Subject Tabs */}
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-2">
          {examData.subjects.map((subject, index) => {
            const completedQ = subject.questions?.length || 0;
            const totalQ = subject.questionCount;
            const isActive = index === currentSubjectIndex;
            const isSubjectComplete = completedQ === totalQ;

            return (
              <button
                key={subject.name + index}
                onClick={() => navigateToSubject(index)}
                className={`flex-shrink-0 px-3 py-2 sm:px-4 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-colors border-2 ${
                  isActive
                    ? "bg-blue-600 text-white border-blue-700"
                    : isSubjectComplete
                    ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-200"
                    : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                }`}
              >
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <span>{subject.name}</span>
                    {isSubjectComplete && (
                      <CheckCircleIcon className="w-3 h-3" />
                    )}
                  </div>
                  <div className="text-xs mt-1">
                    {completedQ}/{totalQ}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Question Navigation */}
      {hasQuestions && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={prevQuestion}
              disabled={currentSubjectIndex === 0 && currentQuestionIndex === 0}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeftIcon className="w-4 h-4 mr-2" />
              Previous Question
            </button>

            <div className="text-center">
              <h4 className="text-lg font-semibold text-gray-900">
                Question {currentQuestionIndex + 1}
              </h4>
              <p className="text-sm text-gray-600">
                {currentQuestionIndex + 1} of{" "}
                {currentSubject?.questions?.length || 0}
              </p>
            </div>

            <button
              onClick={nextQuestion}
              disabled={
                currentSubjectIndex === examData.subjects.length - 1 &&
                currentQuestionIndex ===
                  (currentSubject?.questions?.length || 1) - 1
              }
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next Question
              <ChevronRightIcon className="w-4 h-4 ml-2" />
            </button>
          </div>

          {/* Question Number Grid */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {Array.from(
              { length: currentSubject?.questions?.length || 0 },
              (_, index) => {
                const isCurrent = index === currentQuestionIndex;
                return (
                  <button
                    key={index}
                    onClick={() => navigateToQuestion(index)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors border-2 ${
                      isCurrent
                        ? "bg-blue-600 text-white border-blue-700"
                        : "bg-green-100 text-green-800 border-green-300 hover:bg-green-200"
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* Question Preview */}
      {currentQuestion ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold text-gray-900">
                Question {currentQuestionIndex + 1}
              </h3>
              <h3 className="text-xl font-semibold text-blue-600">
                {currentSubject?.name}
              </h3>

              {currentQuestion.difficulty &&
              examData.examMode !== "previous" ? (
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    currentQuestion.difficulty === "easy"
                      ? "bg-green-100 text-green-800"
                      : currentQuestion.difficulty === "medium"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {currentQuestion.difficulty.charAt(0).toUpperCase() +
                    currentQuestion.difficulty.slice(1)}
                </span>
              ) : (
                <div></div>
              )}
            </div>
            <div className="flex items-center text-sm text-green-600">
              <CheckCircleIcon className="w-4 h-4 mr-1" />
              Saved Question
            </div>
          </div>

          {/* Question Text */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">
              Question:
            </h4>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div dangerouslySetInnerHTML={{ __html: currentQuestion.text }} />
            </div>
          </div>

          {/* Options */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">
              Options:
            </h4>
            <div className="space-y-3">
              {currentQuestion.options?.map((option, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-2 ${
                    currentQuestion.correctAnswer === index
                      ? "bg-green-50 border-green-300"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <span
                      className={`font-medium ${
                        currentQuestion.correctAnswer === index
                          ? "text-green-700"
                          : "text-gray-700"
                      }`}
                    >
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <div className="flex-1">
                      <div dangerouslySetInnerHTML={{ __html: option }} />
                      {currentQuestion.correctAnswer === index && (
                        <span className="inline-flex items-center mt-2 text-sm text-green-600">
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Correct Answer
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Explanation */}
          {currentQuestion.explanation && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">
                Explanation:
              </h4>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div
                  dangerouslySetInnerHTML={{
                    __html: currentQuestion.explanation,
                  }}
                />
              </div>
            </div>
          )}

          {/* Bottom Navigation Buttons */}
          <div className="flex justify-between items-center pt-6 border-t-2 border-gray-200">
            <button
              onClick={prevQuestion}
              disabled={currentSubjectIndex === 0 && currentQuestionIndex === 0}
              className="flex items-center px-6 py-3 text-base font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5 mr-2" />
              Previous Question
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of{" "}
                {currentSubject?.questions?.length || 0}
              </p>
              <p className="text-xs text-gray-500">{currentSubject?.name}</p>
            </div>

            <button
              onClick={nextQuestion}
              disabled={
                currentSubjectIndex === examData.subjects.length - 1 &&
                currentQuestionIndex ===
                  (currentSubject?.questions?.length || 1) - 1
              }
              className="flex items-center px-6 py-3 text-base font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next Question
              <ChevronRightIcon className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>
      ) : hasQuestions ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <XCircleIcon className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            No Question Selected
          </h3>
          <p className="text-yellow-700">
            Please select a question to preview.
          </p>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <XCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No Questions Added
          </h3>
          <p className="text-gray-500">
            No questions have been added to this subject yet.
          </p>
        </div>
      )}

      {/* Overall Status */}
      <div
        className={`rounded-lg p-4 sm:p-6 ${
          isComplete
            ? "bg-green-50 border border-green-200"
            : "bg-yellow-50 border border-yellow-200"
        }`}
      >
        <div className="flex items-center">
          <span className={`text-2xl mr-3 ${isComplete ? "✅" : "⚠️"}`}></span>
          <div>
            <h4
              className={`font-semibold ${
                isComplete ? "text-green-800" : "text-yellow-800"
              }`}
            >
              {isComplete ? "Exam Ready for Submission" : "Exam Incomplete"}
            </h4>
            <p
              className={`text-sm ${
                isComplete ? "text-green-600" : "text-yellow-600"
              }`}
            >
              {isComplete
                ? `All ${totalQuestions} questions have been added across ${examData.subjects.length} subjects.`
                : `${completedQuestions}/${totalQuestions} questions completed. Please add remaining questions.`}
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <XCircleIcon className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-800 font-medium">Submission Error:</span>
          </div>
          <p className="text-red-700 mt-1">{submitError}</p>
        </div>
      )}

      {/* Success Message */}
      {submitSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-green-800 font-medium">Success!</span>
          </div>
          <p className="text-green-700 mt-1">
            Exam has been published successfully!
          </p>
        </div>
      )}

      {/* Submit Button */}
      {isComplete && (
        <div className="text-center">
          <button
            onClick={handleSubmitExam}
            disabled={isSubmitting}
            className={`px-8 py-3 font-semibold rounded-lg transition-colors shadow-lg ${
              isSubmitting
                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Submitting...
              </span>
            ) : (
              "🎯 Submit Exam for Publication"
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewSubmitStep;
