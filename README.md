# ExamDesk BD — Online Exam System (Client)

The frontend application for **ExamDesk BD**, a full-featured online exam platform for Bangladeshi competitive exams (BCS, HSC, Bank). Built with **React 18** and **Vite**, it delivers a high-performance, responsive interface for students to take exams and administrators to manage the platform.

## 🌐 Live Demo

🔗 **[https://exam-desk-bd.vercel.app/](https://exam-desk-bd.vercel.app/)**

## 🔗 Related Repository

- **Server**: [Exam-system-running-server-side](https://github.com/SadikMR/Exam-system-running-server-side.git)

---

## ✨ Features

### 🎓 Student Interface

**1. Live Assessment Engine**

- **Strict Proctoring**:
  - **Webcam Monitoring**: Uses `face-api.js` for real-time face detection. Alerts on: missing face, multiple faces, head turning.
  - **Webcam Capture**: Periodically captures snapshots during live exams for review.
  - **Fullscreen Enforcement**: Forces fullscreen mode; logs violations on exit (`ESC`).
  - **Focus Tracking**: Detects browser tab switching or window blurring.
- **Real-time Timer**: Syncs with server time via `useExamTimer`.
- **Dynamic Interface**: Supports complex question types (images, mathematical/special symbols).

**2. Practice Mode**

- **Flexible Selection**: Choose exams by Category (BCS / HSC / Bank / Others) → Mode (All Questions / Subject-wise / Year-wise).
- **Review System**:
  - Detailed score cards with accuracy percentage.
  - **PDF Download**: Generates a complete exam report with Bengali support using `html2pdf.js`.

**3. Student Dashboard**

- **Performance Analytics**: Visualization of results over time with Recharts.
- **Exam History**: Detailed review of past submissions (`/student/exam-review/:submissionId`).
- **Leaderboard**: See your ranking per exam (`/student/leaderboard/:examId`).

**4. User Account**

- **Authentication**: Register, Login, Forgot Password → Verify Code → Set New Password flow.
- **Profile Management**: Image upload, personal details editing.
- **Email Verification**: UI for email and profile verification steps.

---

### 🛡️ Admin Interface

**1. Dynamic Exam Creator**

- **Step-by-Step Wizard**: Create exams in logical steps (Setup → Subjects → Questions).
- **Rich Text Editor**: Integrated **React Quill** custom toolbar for:
  - Text formatting
  - **Mathematical/Special Symbols**
  - Image embedding (resizable, with table support)
- **Dynamic Structure**: Add unlimited subjects and questions per subject.

**2. Management & Monitoring**

- **Dashboard**: Overview of all exams and platform activity.
- **Invitation System**: Send email invites to onboard new admins/editors.
- **Exam History**: View all past exams with full submission details.
- **Exam Ranking**: Per-exam leaderboard with "Cheat Score" (violation count) filters.
- **User Exam Details**: Drill into individual student submission data.

---

## 🛠️ Tech Stack & Libraries

| Category       | Technology                   | Usage                        |
| :------------- | :--------------------------- | :--------------------------- |
| **Core**       | React 18, Vite               | UI Framework & Build Tool    |
| **Styling**    | Tailwind CSS, DaisyUI        | Responsive Design System     |
| **Animation**  | Framer Motion                | Page & Component Animations  |
| **State**      | React Query, Context API     | Server State & Global State  |
| **Routing**    | React Router v6              | Navigation & Protected Routes|
| **Editor**     | React Quill                  | Rich Text Question Editing   |
| **PDF**        | html2pdf.js, html2canvas-pro | Report Generation            |
| **AI/ML**      | face-api.js                  | Webcam Proctoring            |
| **Charts**     | Recharts                     | Analytics Visualization      |
| **Icons**      | React Icons, Heroicons       | UI Elements                  |

---

## 🚀 Installation & Setup

1. **Clone the repository**

   ```bash
   git clone <this-repo-url>
   cd client
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the `client/` directory:

   ```env
   VITE_BACKEND_URL=http://localhost:5000
   ```

   > For production, point this to the deployed server URL.

4. **Start Development Server**

   ```bash
   npm run dev
   ```

   Runs on `http://localhost:5173`.

---

## 📂 Directory Structure

```
src/
├── Pages/
│   ├── Admin/                  # AdminDashboard, ExamCreator, ExamHistory, ExamRanking
│   │   └── Exam-Creation/      # Step-by-step exam creation wizard
│   ├── ExamRoom/               # LiveExamRoom (proctored), OthersExamRoom (practice)
│   ├── LiveExam/               # Live exams listing page
│   ├── StudentDashboard/       # Analytics, ExamReview, Leaderboard
│   ├── BcsExam/                # BCS All-Questions & Subject-wise
│   ├── HscExam/                # HSC All-Questions & Subject-wise
│   ├── BankExam/               # Bank All-Questions & Subject-wise
│   ├── BCSOthers/              # BCS miscellaneous exams
│   ├── HSCOthers/              # HSC miscellaneous exams
│   ├── Login/ Register/        # Auth pages
│   ├── ForgotPassword/         # Forgot password flow
│   ├── VerifyCode/             # OTP verification
│   ├── SetNewPassword/         # Password reset
│   ├── ResetPassword/          # Reset confirmation
│   ├── Profile.jsx             # User profile edit
│   ├── UserProfile.jsx         # Public user profile view
│   ├── ExamReview.jsx          # Detailed post-exam review
│   └── About.jsx               # About page
├── components/                 # Reusable UI (WebcamPanel, QuestionDisplay, etc.)
├── hooks/
│   ├── useWebcamMonitoring.js  # Face detection & violation logic
│   ├── useWebcamCapture.js     # Periodic snapshot capture
│   ├── useExamMonitoring.js    # Aggregated exam integrity monitoring
│   ├── useExamTimer.js         # Server-synced countdown timer
│   ├── useFullscreen.js        # Fullscreen enforcement & exit detection
│   └── useProfile.js           # Profile data & update logic
└── services/                   # Axios API call wrappers
```

---

## 🔐 Authentication & Route Protection

- **Student routes** (`/exam/live`, `/exam/practice`, `/student/dashboard`, etc.) are wrapped in `PrivateRoute` — requires a valid student session.
- **Admin routes** (`/admin`, `/admin/create-exam`, `/admin/management`, etc.) are wrapped in `AdminPrivateRoute` — requires a valid admin/editor session.

---

## 📝 License

MIT License.
