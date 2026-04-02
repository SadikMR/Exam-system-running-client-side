import { useEffect, useState } from "react";
import axios from "axios";

const Quiz = () => {
  const [questionsData, setQuestionsData] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [skippedAnswers, setSkippedAnswers] = useState(0);
  const [timeLeft, setTimeLeft] = useState(4000);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  const questionsPerPage = 10;

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          "http://localhost:5000/bcs-questions/getOthersQuestions"
        );
        if (
          Array.isArray(response.data.data) &&
          response.data.data.length > 0
        ) {
          const allQuestions = response.data.data;
          setQuestionsData(allQuestions);
          setSelectedOptions(Array(allQuestions.length).fill(null));
          setTimeLeft(allQuestions.length * 60);
        } else {
          setError("No questions available.");
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
        setError("Failed to load questions. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (showResult) {
      const savedOptions = localStorage.getItem("selectedOptions");
      if (savedOptions) {
        setSelectedOptions(JSON.parse(savedOptions));
      } else {
        // Set default empty options if not saved
        setSelectedOptions(Array(questionsData.length).fill(null));
      }
    }
  }, [showResult, questionsData]);

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
      if (selected !== null) {
        const selectedKey = String.fromCharCode(65 + selected); // 'A', 'B', 'C', 'D'
        const correctAnswerKey = question.correctAnswer;

        if (selectedKey === correctAnswerKey) {
          calculatedScore += 1;
        } else {
          incorrectCount += 1;
        }
      } else {
        skippedCount += 1;
      }
    });

    return { calculatedScore, incorrectCount, skippedCount };
  };

  const handleSubmit = async () => {
    const { calculatedScore, incorrectCount, skippedCount } = calculateScore();

    setScore(calculatedScore);
    setIncorrectAnswers(incorrectCount);
    setSkippedAnswers(skippedCount);

    const email = localStorage.getItem("userEmail");

    const dataToSend = {
      history: [
        {
          bcsYear: "others",
          email,
          totalMarks: selectedOptions.length,
          correctAnswers: calculatedScore,
          incorrectAnswers: incorrectCount,
          skippedAnswers: skippedCount,
        },
      ],
    };

    try {
      await axios.post(
        "http://localhost:5000/bcs-questions/save-result",
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

  const handleNextPage = () => {
    if ((currentPage + 1) * questionsPerPage < questionsData.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading) {
    return (
      <div className="text-center text-lg text-red-500">
        Loading Questions...
      </div>
    );
  }
  if (error) {
    return <div className="text-center text-lg text-red-500">{error}</div>;
  }

  const totalQuestions = questionsData.length;
  const currentQuestions = questionsData.slice(
    currentPage * questionsPerPage,
    (currentPage + 1) * questionsPerPage
  );

  return (
    <div className="max-w-2xl mx-auto p-6 border">
      {showResult ? (
        <div className="text-center">
          <h1 className="text-2xl font-bold text-green-500 mb-4">
            Quiz Completed
          </h1>
          <p className="text-xl mb-4">
            Your Marks: {score}/{totalQuestions}
          </p>
          <p className="text-lg mb-4">Correct Answers: {score}</p>
          <p className="text-lg mb-4">Incorrect Answers: {incorrectAnswers}</p>
          <p className="text-lg mb-4">Skipped Answers: {skippedAnswers}</p>
          <hr></hr>

          {questionsData?.length > 0 ? (
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
                    <div className="mt-2 p-2 bg-blue-100 text-blue-700 rounded-md text-left">
                      <strong>Explanation:</strong> {question.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-gray-500">No questions available.</p>
          )}
        </div>
      ) : (
        <div className="text-left">
          <div className="flex justify-between text-lg font-bold mb-4">
            <div>Time: {formatTime(timeLeft)}</div>
            <div>Total Marks: {totalQuestions}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {currentQuestions.map((question, index) => {
              const questionIndex = currentPage * questionsPerPage + index;
              return (
                <div
                  key={questionIndex}
                  className="p-4 border rounded-lg bg-gray-100"
                >
                  <h1 className="font-bold text-md text-left">
                    {questionIndex + 1}. {question.questionText}
                  </h1>
                  <ul className="mt-4 space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <li
                        key={optionIndex}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="radio"
                          checked={
                            selectedOptions[questionIndex] === optionIndex
                          }
                          onChange={() =>
                            handleOptionSelect(questionIndex, optionIndex)
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

            {(currentPage + 1) * questionsPerPage >= questionsData.length ? (
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

export default Quiz;
