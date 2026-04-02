// ExamReview.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const ExamReview = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [examData, setExamData] = useState(null);
  const [submissionData, setSubmissionData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showAnswerKey, setShowAnswerKey] = useState(true);

  useEffect(() => {
    // Get data from navigation state
    const passedExamData = location.state?.examData;
    const passedSubmissionData =
      location.state?.results || location.state?.submissionData;

    if (passedExamData && passedSubmissionData) {
      setExamData(passedExamData);
      setSubmissionData(passedSubmissionData);
    }
  }, [location.state, navigate]);

  // Helper functions
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 80) return "text-teal-600 bg-teal-50";
    if (percentage >= 60) return "text-orange-600 bg-orange-50";
    return "text-red-600 bg-red-50";
  };

  const getPerformanceLabel = (percentage) => {
    if (percentage >= 90) return "Excellent";
    if (percentage >= 80) return "Very Good";
    if (percentage >= 70) return "Good";
    if (percentage >= 60) return "Average";
    if (percentage >= 40) return "Below Average";
    return "Poor";
  };

  // Loading state
  if (!examData || !submissionData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-900">
            Loading exam review...
          </p>
        </div>
      </div>
    );
  }

  // Get all questions in sequence
  const getAllQuestions = () => {
    const allQuestions = [];
    let questionNumber = 1;

    examData.subjects.forEach((subject, subjectIndex) => {
      subject.questions.forEach((question, questionIndex) => {
        const questionKey = `${subjectIndex}-${questionIndex}`;
        const userAnswer = submissionData.answers[questionKey];
        const isCorrect = userAnswer === question.correctAnswer;
        const isSkipped = userAnswer === undefined;

        allQuestions.push({
          ...question,
          questionNumber,
          subjectName: subject.name,
          subjectIndex,
          questionIndex,
          questionKey,
          userAnswer,
          isCorrect,
          isSkipped,
        });
        questionNumber++;
      });
    });

    return allQuestions;
  };

  // Overview Tab Component
  const OverviewTab = () => (
    <div className="space-y-8">
      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-500 mb-1">
              {submissionData.totalScore}
            </div>
            <div className="text-sm font-medium text-gray-600">Total Score</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-teal-500 mb-1">
              {submissionData.totalCorrect}
            </div>
            <div className="text-sm font-medium text-gray-600">
              Correct Answers
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-500 mb-1">
              {submissionData.totalWrong}
            </div>
            <div className="text-sm font-medium text-gray-600">
              Wrong Answers
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-500 mb-1">
              {submissionData.totalSkipped}
            </div>
            <div className="text-sm font-medium text-gray-600">Skipped</div>
          </div>
        </div>
      </div>

      {/* Performance Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Overall Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Overall Performance
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-gray-600">Accuracy Rate</span>
                <span className="font-semibold text-gray-900">
                  {submissionData.percentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${submissionData.percentage}%` }}
                ></div>
              </div>
            </div>
            <div className="pt-2">
              <span
                className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium ${getPerformanceColor(
                  submissionData.percentage
                )}`}
              >
                {getPerformanceLabel(submissionData.percentage)}
              </span>
            </div>
          </div>
        </div>

        {/* Time Analysis */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Time Analysis
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Total Duration</span>
              <span className="font-semibold text-gray-900">
                {formatTime(submissionData.examDuration)}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Time Utilized</span>
              <span className="font-semibold text-gray-900">
                {formatTime(submissionData.timeConsumed)}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Time Remaining</span>
              <span className="font-semibold text-gray-900">
                {formatTime(submissionData.timeRemaining)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-t border-gray-200 pt-4">
              <span className="text-gray-600">Average per Question</span>
              <span className="font-semibold text-gray-900">
                {formatTime(
                  Math.floor(
                    submissionData.timeConsumed / submissionData.totalQuestions
                  )
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Subject-wise Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Subject-wise Performance
        </h3>
        <div className="space-y-6">
          {submissionData.subjectWiseResults?.map((subject, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-5">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-gray-900">
                  {subject.subjectName}
                </h4>
                <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  Score: {subject.score} | {subject.correct}/
                  {subject.totalQuestions}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-6 text-center mb-4">
                <div>
                  <div className="text-teal-600 font-bold text-xl mb-1">
                    {subject.correct}
                  </div>
                  <div className="text-gray-500 text-sm">Correct</div>
                </div>
                <div>
                  <div className="text-red-500 font-bold text-xl mb-1">
                    {subject.wrong}
                  </div>
                  <div className="text-gray-500 text-sm">Wrong</div>
                </div>
                <div>
                  <div className="text-gray-500 font-bold text-xl mb-1">
                    {subject.skipped}
                  </div>
                  <div className="text-gray-500 text-sm">Skipped</div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-teal-400 h-2 rounded-full"
                  style={{
                    width: `${
                      (subject.correct / subject.totalQuestions) * 100
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Questions Review Tab Component
  const QuestionsReviewTab = () => {
    const allQuestions = getAllQuestions();

    return (
      <div className="space-y-8">
        {/* Answer Key Toggle */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={showAnswerKey}
              onChange={(e) => setShowAnswerKey(e.target.checked)}
              className="w-4 h-4 text-blue-500 bg-white border-gray-300 rounded focus:ring-blue-400 focus:ring-2"
            />
            <span className="text-sm font-medium text-gray-700">
              Show Answer Key & Explanations
            </span>
          </label>
        </div>

        {/* All Questions */}
        <div className="space-y-6">
          {allQuestions.map((question, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              {/* Question Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <span className="bg-gray-100 text-gray-700 text-sm font-semibold px-3 py-1 rounded-full">
                    Question {question.questionNumber}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                    {question.subjectName}
                  </span>
                  {question.isSkipped ? (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                      Not Answered
                    </span>
                  ) : question.isCorrect ? (
                    <span className="px-3 py-1 bg-teal-100 text-teal-700 text-xs font-medium rounded-full">
                      Correct
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                      Incorrect
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded">
                  +{question.marks} | -{question.negativeMarks}
                </div>
              </div>

              {/* Question Text */}
              <div className="mb-6">
                <div
                  className="text-gray-900 font-medium leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: question.text }}
                />
              </div>

              {/* Options */}
              <div className="space-y-3 mb-6">
                {question.options.map((option, optionIndex) => {
                  const isUserAnswer = question.userAnswer === optionIndex;
                  const isCorrectAnswer =
                    question.correctAnswer === optionIndex;

                  let optionClass =
                    "p-4 rounded-lg border transition-all duration-200 ";

                  if (showAnswerKey && isCorrectAnswer) {
                    optionClass += "border-teal-200 bg-teal-50 ";
                  } else if (isUserAnswer && !question.isCorrect) {
                    optionClass += "border-red-200 bg-red-50 ";
                  } else if (isUserAnswer) {
                    optionClass += "border-blue-200 bg-blue-50 ";
                  } else {
                    optionClass += "border-gray-200 bg-gray-50 ";
                  }

                  return (
                    <div key={optionIndex} className={optionClass}>
                      <div className="flex items-center justify-between">
                        <div
                          className="text-gray-900 flex-1"
                          dangerouslySetInnerHTML={{
                            __html: `<span class="font-semibold">${String.fromCharCode(
                              65 + optionIndex
                            )}.</span> ${option}`,
                          }}
                        />
                        <div className="flex space-x-2 ml-4">
                          {isUserAnswer && (
                            <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 font-medium">
                              Your Answer
                            </span>
                          )}
                          {showAnswerKey && isCorrectAnswer && (
                            <span className="text-xs px-2 py-1 rounded bg-teal-100 text-teal-700 font-medium">
                              Correct Answer
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              {showAnswerKey && question.explanation && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h5 className="text-sm font-semibold text-yellow-800 mb-2">
                    💡 Explanation:
                  </h5>
                  <div
                    className="text-sm text-yellow-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: question.explanation }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-white hover:text-gray-700 bg-blue-700 font-medium"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Exam Review
                </h1>
                <p className="text-sm text-gray-600">{examData.title}</p>
              </div>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <span>📧</span>
                <span>{submissionData.userEmail}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>📅</span>
                <span>
                  {new Date(submissionData.submissionTime).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Exam Info Banner */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Exam Code
              </h3>
              <p className="text-lg font-semibold text-gray-900">
                {examData.code}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Duration
              </h3>
              <p className="text-lg font-semibold text-gray-900">
                {examData.duration} minutes
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Total Questions
              </h3>
              <p className="text-lg font-semibold text-gray-900">
                {submissionData.totalQuestions}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Passing Score
              </h3>
              <p className="text-lg font-semibold text-gray-900">
                {examData.passingScore}%
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-4 px-3 border-b-2 font-medium text-sm transition-colors rounded-t-lg ${
                  activeTab === "overview"
                    ? "border-blue-400 text-blue-600 bg-blue-200"
                    : "border-transparent text-gray-500 bg-blue-50"
                }`}
              >
                📊 Performance Overview
              </button>
              <button
                onClick={() => setActiveTab("questions")}
                className={`py-4 px-3 border-b-2 font-medium text-sm transition-colors rounded-t-lg ${
                  activeTab === "questions"
                    ? "border-blue-400 text-blue-600 bg-blue-200"
                    : "border-transparent text-gray-500 bg-blue-50"
                }`}
              >
                📝 Question Review
              </button>
            </nav>
          </div>

          <div className="p-8">
            {activeTab === "overview" && <OverviewTab />}
            {activeTab === "questions" && <QuestionsReviewTab />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamReview;
