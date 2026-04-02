import React from "react";

const ExamSetupStep = ({ examData, setExamData }) => {
  const examTypes = ["BCS", "HSC", "Bank"];
  const hscGroups = ["Science", "Business Studies", "Humanities"];
  const hscBoards = [
    "Barisal",
    "Chittagong",
    "Comilla",
    "Dhaka",
    "Dinajpur",
    "Jessore",
    "Mymensingh",
    "Rajshahi",
    "Sylhet",
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - i);
  const batches = Array.from({ length: 50 }, (_, i) => 50 - i);

  const handleChange = (type, value) => {
    setExamData({ type, payload: value });
  };
  const getLocalDateTime = () => {
    const now = new Date();
    // offset in ms
    const tzOffset = now.getTimezoneOffset() * 60000;
    // subtract offset to get local time in ISO format
    return new Date(now - tzOffset).toISOString().slice(0, 16);
  };

  // Convert UTC datetime to local datetime for datetime-local input
  const convertUTCToLocal = (utcString) => {
    if (!utcString) return "";
    const date = new Date(utcString);
    // Get local time string in format YYYY-MM-DDTHH:mm
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Get current local datetime for min attribute
  const getCurrentLocalDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const renderLiveFields = () => (
    <>
      {/* HSC Group (only if exam type is HSC) */}
      {examData.examType === "HSC" && (
        <div className="col-span-1 sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            HSC Group *
          </label>
          <select
            value={examData.hscGroup || ""}
            onChange={(e) => handleChange("SET_HSC_GROUP", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 text-black bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select HSC group</option>
            {hscGroups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="col-span-1 sm:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Start Date & Time *
        </label>
        <input
          type="datetime-local"
          value={convertUTCToLocal(examData.startTime)}
          onChange={(e) => {
            const selectedTime = e.target.value; // e.g., "2025-11-23T04:45" (local time)
            if (!selectedTime) {
              handleChange("SET_START_TIME", "");
              return;
            }

            // Create date object treating input as local time
            const selectedDate = new Date(selectedTime);

            const now = new Date();
            if (selectedDate < now) {
              alert("Start time cannot be in the past!");
              return;
            }

            // Convert selected datetime to UTC before storing
            const utcString = selectedDate.toISOString(); // e.g., "2025-11-23T04:45:00.000Z"
            handleChange("SET_START_TIME", utcString);
          }}
          min={getCurrentLocalDateTime()} // prevents past selection (in local time)
          className="w-full px-3 py-2 border border-gray-300 text-black bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Select a future date and time for the exam to start
        </p>
      </div>

      <div className="col-span-1 sm:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Duration (minutes) *
        </label>
        <input
          type="number"
          value={examData.duration || ""}
          onChange={(e) =>
            handleChange("SET_DURATION", parseInt(e.target.value) || 0)
          }
          min="1"
          max="600"
          placeholder="Enter duration in minutes"
          className="w-full px-3 py-2 border border-gray-300 text-black bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Exam will automatically end after this duration (1-600 minutes)
        </p>
      </div>

      <div className="col-span-1 sm:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Access Password (Optional)
        </label>
        <input
          type="text"
          value={examData.password || ""}
          onChange={(e) => handleChange("SET_PASSWORD", e.target.value)}
          placeholder="Leave empty for no password"
          className="w-full px-3 py-2 border border-gray-300 text-black bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="col-span-1 sm:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Access Type *
        </label>
        <div className="space-y-3">
          {[
            {
              id: "free",
              label: "Free Access",
              desc: "Available to all users",
              value: false,
              icon: "🆓",
            },
            {
              id: "premium",
              label: "Premium Only",
              desc: "Only premium subscribers can access",
              value: true,
              icon: "👑",
            },
          ].map((option) => (
            <div
              key={option.id}
              className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <input
                type="radio"
                id={option.id}
                name="accessType"
                checked={examData.isPremium === option.value}
                onChange={() => handleChange("SET_PREMIUM", option.value)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <label
                htmlFor={option.id}
                className="ml-3 flex items-center text-sm text-gray-700 cursor-pointer"
              >
                <span className="text-lg mr-2">{option.icon}</span>
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-gray-500">{option.desc}</div>
                </div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const renderPreviousFields = () => (
    <>
      {examData.examType === "HSC" && (
        <>
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              HSC Group *
            </label>
            <select
              value={examData.hscGroup || ""}
              onChange={(e) => handleChange("SET_HSC_GROUP", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 text-black bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select HSC group</option>
              {hscGroups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-1 sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              HSC Board *
            </label>
            <select
              value={examData.hscBoard || ""}
              onChange={(e) => handleChange("SET_HSC_BOARD", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 text-black bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select HSC board</option>
              {hscBoards.map((board) => (
                <option key={board} value={board}>
                  {board}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
      <div className="col-span-1 sm:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Exam Year *
        </label>
        <select
          value={examData.examYear || ""}
          onChange={(e) => handleChange("SET_EXAM_YEAR", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select year</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
      {examData.examType === "BCS" && (
        <div className="col-span-1 sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Exam Batch *
          </label>
          <select
            value={examData.batch || ""}
            onChange={(e) => handleChange("SET_BATCH", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Batch</option>
            {Array.from({ length: 50 }, (_, i) => 50 - i).map((batch) => (
              <option key={batch} value={batch}>
                {batch}th Batch
              </option>
            ))}
          </select>
        </div>
      )}
    </>
  );

  const renderPracticeFields = () => (
    <>
      <div className="col-span-1 sm:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Duration (minutes) - Optional
        </label>
        <input
          type="number"
          value={examData.duration || ""}
          onChange={(e) =>
            handleChange("SET_DURATION", parseInt(e.target.value) || 0)
          }
          min="1"
          placeholder="Leave empty for unlimited"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="col-span-1 sm:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Practice Type
        </label>
        <select
          value={examData.practiceType || "unlimited"}
          onChange={(e) => handleChange("SET_PRACTICE_TYPE", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="unlimited">Unlimited Attempts</option>
          <option value="timed">Timed Practice</option>
          <option value="mock">Mock Test</option>
        </select>
      </div>

      <div className="col-span-1 sm:col-span-4">
        <div className="flex items-center p-3 border rounded-lg">
          <input
            type="checkbox"
            id="showResults"
            checked={examData.showResults || false}
            onChange={(e) => handleChange("SET_SHOW_RESULTS", e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label
            htmlFor="showResults"
            className="ml-3 block text-sm text-gray-700"
          >
            <div className="font-medium">Show results immediately</div>
            <div className="text-xs text-gray-500">
              Display results right after exam completion
            </div>
          </label>
        </div>
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          {examData.examMode === "live" && "Live Exam Configuration"}
          {examData.examMode === "previous" && "Previous Year Paper Setup"}
          {examData.examMode === "practice" && "Practice Test Configuration"}
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          {examData.examMode === "live" &&
            "Set up your live exam with timing and access controls"}
          {examData.examMode === "previous" &&
            "Configure historical exam paper details"}
          {examData.examMode === "practice" &&
            "Set up practice test parameters"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Exam Title */}
        <div className="col-span-1 sm:col-span-2 lg:col-span-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Exam Title *
          </label>
          <input
            type="text"
            value={examData.title || ""}
            onChange={(e) => handleChange("SET_TITLE", e.target.value)}
            placeholder={
              examData.examMode === "live"
                ? "e.g., BCS Preliminary Live Test 2024"
                : examData.examMode === "previous"
                ? "e.g., 43rd BCS Preliminary 2022"
                : "e.g., BCS Math Practice Test"
            }
            className="w-full px-3 py-2 border border-gray-300 text-black bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Exam Type */}
        <div className="col-span-1 sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Exam Type *
          </label>
          <select
            value={examData.examType || ""}
            onChange={(e) => {
              handleChange("SET_EXAM_TYPE", e.target.value);
              if (e.target.value !== "HSC") handleChange("SET_HSC_GROUP", "");
            }}
            className="w-full px-3 py-2 border border-gray-300 text-black bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select exam type</option>
            {examTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Mode-specific fields */}
        {examData.examMode === "live" && renderLiveFields()}
        {examData.examMode === "previous" && renderPreviousFields()}
        {examData.examMode === "practice" && renderPracticeFields()}
      </div>
    </div>
  );
};

export default ExamSetupStep;
