import axios from "axios";
import { useEffect, useState } from "react";

const HscSubjectWiseQuiz = ({ subject, totalQuestions }) => {
  const [questionsData, setQuestionsData] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answerStatus, setAnswerStatus] = useState([]);
  const [timeLeft, setTimeLeft] = useState(totalQuestions * 60);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [skippedAnswers, setSkippedAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);

  const questionsPerPage = 10;

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `http://localhost:5000/hsc-questions/hsc-subjectWise/${subject}/${totalQuestions}`
        );
        if (
          response.data &&
          Array.isArray(response.data.questions) &&
          response.data.questions.length > 0
        ) {
          const filteredQuestions = response.data.questions.slice(
            0,
            totalQuestions
          );
          setQuestionsData(filteredQuestions);
          setSelectedOptions(Array(filteredQuestions.length).fill(null));
        } else {
          setError("No questions available for this subject.");
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
        setError("Failed to load questions. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [subject, totalQuestions]);

  useEffect(() => {
    if (timeLeft > 0 && !showResult) {
      const timer = setInterval(
        () => setTimeLeft((prevTime) => prevTime - 1),
        1000
      );
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      handleSubmit();
    }
  }, [timeLeft, showResult]);

  useEffect(() => {
    if (showResult) {
      const savedOptions = localStorage.getItem("selectedOptions");
      if (savedOptions) {
        setSelectedOptions(JSON.parse(savedOptions));
      } else {
        setSelectedOptions(Array(questionsData.length).fill(null));
      }
    }
  }, [showResult, questionsData]);

  const handleOptionSelect = (questionIndex, optionIndex) => {
    if (!showResult) {
      const updatedOptions = [...selectedOptions];
      updatedOptions[questionIndex] = optionIndex;
      setSelectedOptions(updatedOptions);
      // Save to localStorage
      localStorage.setItem("selectedOptions", JSON.stringify(updatedOptions));
    }
  };

  const calculateScore = () => {
    let calculatedScore = 0;
    let incorrectCount = 0;
    let skippedCount = 0;
    const statusArray = [];

    questionsData.forEach((question, questionIndex) => {
      const selected = selectedOptions[questionIndex];
      if (selected === null) {
        skippedCount++;
      } else {
        const selectedKey = String.fromCharCode(65 + selected); // 'A', 'B', 'C', 'D'
        const correctAnswerKey = question.correctAnswer;

        if (selectedKey === correctAnswerKey) {
          calculatedScore += 1;
          statusArray.push({
            questionIndex: questionIndex + 1,
            correct: true,
            selectedAnswer: question.options[selected],
            correctAnswer: question.answer,
          });
        } else {
          incorrectCount++;
          statusArray.push({
            questionIndex: questionIndex + 1,
            correct: false,
            selectedAnswer: question.options[selected],
            correctAnswer: question.answer,
          });
        }
      }
    });

    setAnswerStatus(statusArray);

    // Return all calculated values
    return { calculatedScore, incorrectCount, skippedCount };
  };

  const handleSubmit = async () => {
    const { calculatedScore, incorrectCount, skippedCount } = calculateScore();

    // Update the state values based on the calculation
    setScore(calculatedScore);
    setIncorrectAnswers(incorrectCount);
    setSkippedAnswers(skippedCount);

    const email = localStorage.getItem("userEmail");
    const bcsSubject = localStorage.getItem("bcsSubject");

    // Use calculated values directly instead of relying on state
    const dataToSend = {
      history: [
        {
          email,
          hscSubject: subject,
          totalMarks: questionsData.length,
          correctAnswers: calculatedScore,
          incorrectAnswers: incorrectCount,
          skippedAnswers: skippedCount,
        },
      ],
    };

    try {
      await axios.post(
        "http://localhost:5000/hsc-questions/save-hsc-subjectWise-history",
        dataToSend
      );
    } catch (error) {
      console.error("Error saving result:", error);
    }

    setShowResult(true);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if ((currentPage + 1) * questionsPerPage < questionsData.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (loading)
    return <div className="text-center text-lg text-red-500">Loading...</div>;
  if (error)
    return <div className="text-center text-lg text-red-500">{error}</div>;
  if (questionsData.length === 0)
    return (
      <div className="text-center text-lg text-red-500">
        No questions available.
      </div>
    );

  const totalQuestionsCount = questionsData.length;
  const currentQuestions = questionsData.slice(
    currentPage * questionsPerPage,
    (currentPage + 1) * questionsPerPage
  );
  const isLastPage =
    (currentPage + 1) * questionsPerPage >= totalQuestionsCount;

  return (
    <div className="max-w-2xl mx-auto p-6 border">
      {showResult ? (
        <div className="text-center">
          <h1 className="text-2xl font-bold text-green-500 mb-4">
            Quiz Completed
          </h1>
          <p className="text-xl mb-4">
            Your Marks: {score}/{totalQuestionsCount}
          </p>
          <p className="text-lg mb-4">Correct Answers: {score}</p>
          <p className="text-lg mb-4">Incorrect Answers: {incorrectAnswers}</p>
          <p className="text-lg mb-4">Skipped Answers: {skippedAnswers}</p>
          <hr></hr>

          <div className="mb-8 mt-20">
            {questionsData.map((question, questionIndex) => {
              const selected = selectedOptions[questionIndex];
              const correctAnswerKey = question.correctAnswer;
              const correctIndex = correctAnswerKey.charCodeAt(0) - 65; // Convert 'A', 'B', 'C', 'D' to index
              const selectedKey =
                selected !== null ? String.fromCharCode(65 + selected) : "";
              const isCorrect = selectedKey === correctAnswerKey;

              return (
                <div
                  key={questionIndex}
                  className="p-4 border rounded-lg bg-gray-100 mb-4"
                >
                  {/* Correct / Incorrect / Skipped Label */}
                  <div
                    className={`text-center font-bold text-lg p-2 rounded-md ${
                      selected === null
                        ? "text-yellow-700"
                        : isCorrect
                        ? "text-green-700"
                        : "text-red-700"
                    }`}
                  >
                    {selected === null
                      ? "Skipped ⚠️"
                      : isCorrect
                      ? "Correct ✅"
                      : "Incorrect ❌"}
                  </div>

                  {/* Question */}
                  <h3 className="font-bold text-md text-left">
                    {questionIndex + 1}. {question.questionText}
                  </h3>

                  {/* Options List */}
                  <ul className="mt-4 space-y-2">
                    {question.options.map((option, optionIndex) => {
                      const isSelected = selected === optionIndex;
                      const isCorrectOption = optionIndex === correctIndex;
                      const optionKey = String.fromCharCode(65 + optionIndex); // 'A', 'B', 'C', 'D'

                      // Apply color based on correctness
                      let optionStatus = "bg-gray-200 text-gray-700"; // Default color for all options

                      if (isCorrectOption) {
                        optionStatus = "bg-green-200 text-green-600"; // Mark correct answer green
                      }

                      if (!isCorrect && isSelected) {
                        optionStatus = "bg-red-200 text-red-600"; // Mark wrong selection red
                      }

                      return (
                        <li
                          key={optionIndex}
                          className={`flex items-center space-x-2 ${optionStatus} p-2 rounded-md`}
                        >
                          <input
                            type="radio"
                            checked={isSelected}
                            disabled
                            className="mr-2"
                          />
                          <label className="text-sm font-normal">
                            {optionKey}. {option}
                          </label>
                        </li>
                      );
                    })}
                  </ul>

                  {/* Explanation */}
                  {question.explanation && (
                    <div className="mt-2 p-2 bg-blue-100 text-blue-700 rounded-md text-left">
                      <strong>Explanation:</strong> {question.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-left">
          <div className="flex justify-between text-lg font-bold mb-4">
            <div>Time: {formatTime(timeLeft)}</div>
            <div>Total Marks: {totalQuestionsCount}</div>
          </div>
          <h2 className="text-xl font-semibold mb-4">Subject: {subject}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {currentQuestions.map((question, questionIndex) => {
              const actualIndex =
                currentPage * questionsPerPage + questionIndex;
              return (
                <div
                  key={questionIndex}
                  className="p-4 border rounded-lg bg-gray-100"
                >
                  <h1 className="font-bold text-md text-left">
                    {actualIndex + 1}. {question.questionText}
                  </h1>
                  <ul className="mt-4 space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <li
                        key={optionIndex}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="radio"
                          checked={selectedOptions[actualIndex] === optionIndex}
                          onChange={() =>
                            handleOptionSelect(actualIndex, optionIndex)
                          }
                          disabled={showResult}
                          className="mr-2"
                        />
                        <label className="text-sm font-normal">{option}</label>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 0}
              className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-300"
            >
              Previous
            </button>

            {isLastPage ? (
              <button
                onClick={handleSubmit}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Submit Quiz
              </button>
            ) : (
              <button
                onClick={handleNextPage}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Next
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HscSubjectWiseQuiz;
