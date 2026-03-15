import React, { useState, useEffect } from "react";
import MathEditor from "./MathEditor";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

const QuestionEntryStep = ({ examData, setExamData }) => {
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [formData, setFormData] = useState({
    text: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    explanation: "",
    difficulty: "medium",
  });

  const currentSubject = examData.subjects[currentSubjectIndex];

  // Get saved question or return empty form
  const getSavedQuestion = (subjectIndex, questionIndex) => {
    const subject = examData.subjects[subjectIndex];
    return subject?.questions?.[questionIndex] || null;
  };

  // Check if current question is saved
  const isQuestionSaved = () => {
    const savedQuestion = getSavedQuestion(
      currentSubjectIndex,
      currentQuestionIndex
    );
    return (
      savedQuestion &&
      savedQuestion.text &&
      savedQuestion.options.every((opt) => opt)
    );
  };

  // Check if a specific question is saved
  const isSpecificQuestionSaved = (subjectIndex, questionIndex) => {
    const subject = examData.subjects[subjectIndex];
    const question = subject?.questions?.[questionIndex];
    return question && question.text && question.options.every((opt) => opt);
  };

  // Get first unsaved question index for a subject
  const getFirstUnsavedIndex = (subjectIndex) => {
    const subject = examData.subjects[subjectIndex];
    if (!subject.questions) return 0;

    for (let i = 0; i < subject.questionCount; i++) {
      if (!isSpecificQuestionSaved(subjectIndex, i)) {
        return i;
      }
    }
    return subject.questionCount; // All saved
  };

  // Reset form to empty state
  const resetForm = () => {
    setFormData({
      text: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      explanation: "",
      difficulty: "medium",
    });
    setHasUnsavedChanges(false);
  };

  // Load question data when navigation changes
  useEffect(() => {
    const savedQuestion = getSavedQuestion(
      currentSubjectIndex,
      currentQuestionIndex
    );
    if (savedQuestion) {
      setFormData(savedQuestion);
    } else {
      resetForm();
    }
    setHasUnsavedChanges(false);
  }, [currentSubjectIndex, currentQuestionIndex]);

  const saveQuestion = () => {
    if (!isFormValid()) {
      alert(
        "❌ All fields are required except Explanation!\n\nPlease fill:\n- Question Text\n- All 4 Options\n- Select Correct Answer"
      );
      return;
    }

    setExamData({
      type: "SAVE_QUESTION",
      payload: {
        subjectIndex: currentSubjectIndex,
        questionIndex: currentQuestionIndex,
        question: formData,
      },
    });

    setHasUnsavedChanges(false);

    // Check if this is the last question of the last subject
    const isLastSubject = currentSubjectIndex === examData.subjects.length - 1;
    const isLastQuestion =
      currentQuestionIndex === currentSubject.questionCount - 1;

    if (isLastSubject && isLastQuestion) {
      // Don't reset form or navigate for the last question
      return;
    }

    // Reset form after state update for non-last questions
    setTimeout(() => {
      resetForm();

      // Auto-navigate to next unsaved question
      const nextUnsavedIndex = getFirstUnsavedIndex(currentSubjectIndex);
      if (nextUnsavedIndex < currentSubject.questionCount) {
        setCurrentQuestionIndex(nextUnsavedIndex);
      } else if (currentSubjectIndex < examData.subjects.length - 1) {
        setCurrentSubjectIndex(currentSubjectIndex + 1);
        setCurrentQuestionIndex(0);
      }
    }, 0);
  };

  const saveChanges = () => {
    if (!isFormValid()) {
      alert(
        "❌ All fields are required except Explanation!\n\nPlease fill:\n- Question Text\n- All 4 Options\n- Select Correct Answer"
      );
      return;
    }

    setExamData({
      type: "SAVE_QUESTION",
      payload: {
        subjectIndex: currentSubjectIndex,
        questionIndex: currentQuestionIndex,
        question: formData,
      },
    });

    setHasUnsavedChanges(false);
  };

  // Enhanced navigation logic: can access saved questions + first unsaved
  const canNavigateToQuestion = (questionIndex) => {
    // Can always navigate to current question
    if (questionIndex === currentQuestionIndex) return true;

    // Can navigate to any saved question
    if (isSpecificQuestionSaved(currentSubjectIndex, questionIndex))
      return true;

    // Can navigate to the first unsaved question
    const firstUnsavedIndex = getFirstUnsavedIndex(currentSubjectIndex);
    if (questionIndex === firstUnsavedIndex) return true;

    return false;
  };

  const navigateToQuestion = (questionIndex) => {
    if (canNavigateToQuestion(questionIndex)) {
      setCurrentQuestionIndex(questionIndex);
    }
  };

  const navigateToSubject = (subjectIndex) => {
    setCurrentSubjectIndex(subjectIndex);
    setCurrentQuestionIndex(0);
  };

  // Navigation functions for subjects
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

  // Navigation functions for questions
  const nextQuestion = () => {
    const nextIndex = currentQuestionIndex + 1;
    if (
      nextIndex < currentSubject.questionCount &&
      canNavigateToQuestion(nextIndex)
    ) {
      setCurrentQuestionIndex(nextIndex);
    } else if (currentSubjectIndex < examData.subjects.length - 1) {
      setCurrentSubjectIndex(currentSubjectIndex + 1);
      setCurrentQuestionIndex(0);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (currentSubjectIndex > 0) {
      setCurrentSubjectIndex(currentSubjectIndex - 1);
      const prevSubject = examData.subjects[currentSubjectIndex - 1];
      const lastAccessibleIndex = Math.min(
        getFirstUnsavedIndex(currentSubjectIndex - 1),
        prevSubject.questionCount - 1
      );
      setCurrentQuestionIndex(lastAccessibleIndex);
    }
  };

  const handleFieldChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setHasUnsavedChanges(true);
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
    setHasUnsavedChanges(true);
  };

  const isFormValid = () => {
    return (
      formData.text &&
      formData.text.trim() !== "" &&
      formData.options.every((opt) => opt && opt.trim() !== "") &&
      formData.correctAnswer !== undefined
    );
  };

  const isSubjectComplete = (subject) => {
    return (
      subject.questions &&
      subject.questions.length === subject.questionCount &&
      subject.questions.every(
        (q) =>
          q.text &&
          q.text.trim() !== "" &&
          q.options.every((opt) => opt && opt.trim() !== "") &&
          q.correctAnswer !== undefined
      )
    );
  };

  const isAllSubjectsComplete = () => {
    return examData.subjects.every((subject) => isSubjectComplete(subject));
  };

  const handleFinishExam = async () => {
    try {
      console.log("Saving complete exam to API:", examData);
      alert(
        "🎉 Exam saved successfully!\n\nAll questions have been submitted to the system."
      );

      // Reset to first question of first subject
      setCurrentSubjectIndex(0);
      setCurrentQuestionIndex(0);
    } catch (error) {
      console.error("Error saving exam:", error);
      alert("❌ Error saving exam. Please try again.");
    }
  };

  const showDifficulty = examData.examMode !== "previous";

  return (
    <div className="space-y-6">
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
            const completedQuestions =
              subject.questions?.filter(
                (q) => q && q.text && q.options.every((opt) => opt)
              ).length || 0;
            const totalQuestions = subject.questionCount;
            const isActive = index === currentSubjectIndex;
            const isComplete = isSubjectComplete(subject);

            return (
              <button
                key={subject.name}
                onClick={() => navigateToSubject(index)}
                className={`flex-shrink-0 px-3 py-2 sm:px-4 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-colors border-2 ${
                  isActive
                    ? "bg-blue-600 text-white border-blue-700"
                    : isComplete
                    ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-200"
                    : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                }`}
              >
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <span>{subject.name}</span>
                    {isComplete && <CheckCircleIcon className="w-3 h-3" />}
                  </div>
                  <div className="text-xs mt-1">
                    {completedQuestions}/{totalQuestions}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Question Navigation */}
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
              {currentQuestionIndex + 1} of {currentSubject?.questionCount}
            </p>
          </div>

          <button
            onClick={nextQuestion}
            disabled={
              !canNavigateToQuestion(currentQuestionIndex + 1) &&
              !(currentSubjectIndex < examData.subjects.length - 1)
            }
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next Question
            <ChevronRightIcon className="w-4 h-4 ml-2" />
          </button>
        </div>

        {/* Enhanced Question Number Grid */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {Array.from(
            { length: currentSubject?.questionCount || 0 },
            (_, index) => {
              const isCurrentQuestion = index === currentQuestionIndex;
              const isQuestionComplete = isSpecificQuestionSaved(
                currentSubjectIndex,
                index
              );
              const canNavigate = canNavigateToQuestion(index);
              const firstUnsavedIndex =
                getFirstUnsavedIndex(currentSubjectIndex);
              const isFirstUnsaved =
                index === firstUnsavedIndex && !isQuestionComplete;

              return (
                <button
                  key={index}
                  onClick={() => navigateToQuestion(index)}
                  disabled={!canNavigate}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors border-2 ${
                    isCurrentQuestion
                      ? "bg-blue-600 text-white border-blue-700"
                      : isQuestionComplete
                      ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-200"
                      : canNavigate
                      ? "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200"
                      : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50"
                  }`}
                  title={
                    isCurrentQuestion
                      ? "Current Question"
                      : isQuestionComplete
                      ? "Saved Question - Click to Edit"
                      : isFirstUnsaved
                      ? "Next Available Question"
                      : canNavigate
                      ? "Available Question"
                      : "Complete previous questions first"
                  }
                >
                  {index + 1}
                  {isQuestionComplete && (
                    <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1"></div>
                  )}
                </button>
              );
            }
          )}
        </div>

        {/* Navigation Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-600 rounded mr-2"></div>
            <span>Current Question</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
            <span>Saved Question</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded mr-2"></div>
            <span>Next Available</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded mr-2 opacity-50"></div>
            <span>Locked</span>
          </div>
        </div>
      </div>

      {/* Question Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-2 sm:space-y-0">
          <h3 className="text-xl sm:text-2xl font-semibold text-gray-900">
            {currentSubject?.name} - Question {currentQuestionIndex + 1}
          </h3>
          <div className="flex items-center space-x-4">
            {hasUnsavedChanges && (
              <div className="flex items-center text-orange-600 text-sm">
                <XCircleIcon className="w-4 h-4 mr-1" />
                Unsaved changes
              </div>
            )}
            {isQuestionSaved() && !hasUnsavedChanges && (
              <div className="flex items-center text-green-600 text-sm">
                <CheckCircleIcon className="w-4 h-4 mr-1" />
                Saved
              </div>
            )}
          </div>
        </div>

        {/* Question Text */}
        <div className="space-y-8">
          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              Question Text *
            </label>
            <MathEditor
              key={`question-${currentSubjectIndex}-${currentQuestionIndex}`}
              value={formData.text}
              onChange={(value) => handleFieldChange("text", value)}
              placeholder="Enter your question here... Use the math panel for symbols and equations"
              className="min-h-[150px]"
              maxImageW={600}
              maxImageH={420}
            />
            {!formData.text && (
              <p className="text-red-500 text-sm mt-1">
                Question text is required
              </p>
            )}
          </div>

          {/* Answer Options */}
          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-4">
              Answer Options *
            </label>
            <div className="space-y-4">
              {formData.options.map((option, index) => (
                <div key={index} className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={formData.correctAnswer === index}
                      onChange={() => handleFieldChange("correctAnswer", index)}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500 mt-2"
                    />
                    <label className="text-base font-medium text-gray-700">
                      Option {String.fromCharCode(65 + index)}
                      {formData.correctAnswer === index && (
                        <span className="ml-2 text-green-600 text-sm">
                          (Correct Answer)
                        </span>
                      )}
                    </label>
                  </div>
                  <div className="ml-8">
                    <MathEditor
                      key={`option-${currentSubjectIndex}-${currentQuestionIndex}-${index}`}
                      value={option}
                      onChange={(value) => handleOptionChange(index, value)}
                      placeholder={`Enter option ${String.fromCharCode(65 + index)}`}
                      className="min-h-[100px]"
                      maxImageW={400}
                      maxImageH={300}
                    />
                  </div>
                  {!option && (
                    <p className="text-red-500 text-sm ml-8">
                      Option {String.fromCharCode(65 + index)} is required
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              Explanation (Optional)
            </label>
            <MathEditor
              key={`explanation-${currentSubjectIndex}-${currentQuestionIndex}`}
              value={formData.explanation}
              onChange={(value) => handleFieldChange("explanation", value)}
              placeholder="Explain the correct answer with mathematical reasoning..."
              className="min-h-[120px]"
              maxImageW={600}
              maxImageH={420}
            />
          </div>

          {/* Difficulty - Only for Live and Practice */}
          {showDifficulty && (
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-3">
                Difficulty Level
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) =>
                  handleFieldChange("difficulty", e.target.value)
                }
                className="w-full sm:w-auto px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          )}

          {/* Form Validation Status */}
          <div
            className={`p-4 rounded-lg border-2 ${
              isFormValid()
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center">
              {isFormValid() ? (
                <>
                  <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-green-800 font-medium">
                    Question is complete and ready to save
                  </span>
                </>
              ) : (
                <>
                  <XCircleIcon className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-red-800 font-medium">
                    Please fill all required fields (except Explanation)
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-center pt-6 border-t-2">
            {isQuestionSaved() && !hasUnsavedChanges ? (
              <button
                disabled
                className="px-8 py-3 text-base font-semibold text-gray-400 bg-gray-100 border-2 border-gray-200 rounded-lg cursor-not-allowed"
              >
                ✅ Question Saved
              </button>
            ) : (
              <button
                onClick={isQuestionSaved() ? saveChanges : saveQuestion}
                disabled={!isFormValid()}
                className={`px-8 py-3 text-base font-semibold border-2 rounded-lg transition-colors ${
                  isFormValid()
                    ? "text-white bg-blue-600 border-blue-600 hover:bg-blue-700"
                    : "text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed"
                }`}
              >
                {isQuestionSaved() ? "💾 Save Changes" : "💾 Save Question"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="bg-gray-50 rounded-lg p-4 border">
        <h4 className="font-medium text-gray-900 mb-4">Overall Progress</h4>
        <div className="space-y-3">
          {examData.subjects.map((subject, index) => {
            const completed =
              subject.questions?.filter(
                (q) => q && q.text && q.options.every((opt) => opt)
              ).length || 0;
            const total = subject.questionCount;
            const percentage = (completed / total) * 100;
            const isComplete = isSubjectComplete(subject);

            return (
              <div key={subject.name} className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700 w-20 truncate">
                  {subject.name}
                </span>
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      isComplete ? "bg-green-500" : "bg-blue-600"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-16 text-right">
                  {completed}/{total}
                </span>
                {isComplete && (
                  <CheckCircleIcon className="w-4 h-4 text-green-500" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuestionEntryStep;
