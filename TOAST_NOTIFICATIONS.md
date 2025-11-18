# 🔔 Toast Notification System - Anti-Cheating Alerts

## Overview
The platform now includes a real-time toast notification system that alerts users about their behavior during the exam. All cheating activities are detected, logged, and displayed to the user immediately.

---

## 🎨 Toast Types & Colors

| Type | Color | Icon | Use Case |
|------|-------|------|----------|
| **Info** | Blue | ℹ️ | General information |
| **Success** | Green | ✅ | Successful actions |
| **Warning** | Yellow | ⚠️ | Medium severity violations |
| **Error** | Red | ❌ | High severity violations |
| **Critical** | Dark Red | 🚨 | Critical violations |

---

## 📋 All Toast Notifications

### ✅ Success Messages

**1. Test Started**
- **Trigger:** User starts the test
- **Message:** "✅ Test started! Stay focused and avoid suspicious behavior."
- **Duration:** 5 seconds

**2. Webcam Activated**
- **Trigger:** Webcam successfully initialized
- **Message:** "✅ Webcam monitoring activated. Please stay visible and centered."
- **Duration:** 4 seconds

**3. Test Submitted**
- **Trigger:** User successfully submits test
- **Message:** "🎉 Test submitted successfully! Your score: X/Y"
- **Duration:** 8 seconds

---

### ℹ️ Info Messages

**4. Window Focus Lost**
- **Trigger:** User clicks outside exam window
- **Message:** "🔔 Focus Lost: Please keep this window in focus during the exam."
- **Duration:** 4 seconds

---

### ⚠️ Warning Messages (Medium Severity)

**5. Tab Switch Detected**
- **Trigger:** User switches browser tab
- **Message:** "⚠️ Warning: Tab switching detected! This behavior is being monitored and logged."
- **Duration:** 6 seconds

**6. Face Position Issues**
- **Trigger:** ML detects face not centered or looking away
- **Message:** "⚠️ Warning: Face not centered - possible looking away"
- **Duration:** 5 seconds

**7. Time Running Out**
- **Trigger:** Less than 1 minute remaining
- **Message:** "⏰ Time is up! Your test is being auto-submitted..."
- **Duration:** 5 seconds

---

### ❌ Error Messages (High Severity)

**8. No Face Detected**
- **Trigger:** ML cannot detect face in webcam
- **Message:** "❌ HIGH ALERT: No face detected"
- **Duration:** 7 seconds

**9. Eyes Not Visible**
- **Trigger:** ML cannot detect eyes clearly
- **Message:** "❌ HIGH ALERT: Eyes not clearly visible - possible gaze away"
- **Duration:** 7 seconds

**10. Face Too Far/Close**
- **Trigger:** Face size ratio indicates distance issue
- **Message:** "❌ HIGH ALERT: Face too small - person too far" or "Face too close to camera"
- **Duration:** 7 seconds

**11. Webcam Access Denied**
- **Trigger:** Browser denies camera permission
- **Message:** "❌ Camera access denied. Please allow camera permission to continue."
- **Duration:** 6 seconds

**12. Webcam Error**
- **Trigger:** Technical error with webcam
- **Message:** "❌ Webcam monitoring error. Please ensure camera is working."
- **Duration:** 4 seconds

**13. Test Submission Failed**
- **Trigger:** Network/server error during submission
- **Message:** "❌ Failed to submit test. Please try again."
- **Duration:** 5 seconds

---

### 🚨 Critical Messages (Maximum Severity)

**14. Multiple Faces Detected**
- **Trigger:** ML detects more than one person in frame
- **Message:** "🚨 CRITICAL ALERT: Multiple faces detected (N)"
- **Duration:** 8 seconds

**15. Multiple Violations**
- **Trigger:** Combination of serious violations
- **Message:** "🚨 CRITICAL: Multiple faces detected (2) | Eyes not clearly visible"
- **Duration:** 8 seconds

---

## 🎯 Cheating Detection Flow

```
User Action → ML Analysis → Toast Notification + Visual Alert + Database Log

Examples:

1. User switches tab:
   └─> "⚠️ Tab switching detected!" (Yellow toast)
   └─> Counter updates: "⚠️ Tab Switches: 1"
   └─> Logged to database with severity: "medium"

2. Another person appears:
   └─> "🚨 CRITICAL: Multiple faces detected (2)" (Red toast)
   └─> Red alert box in webcam panel
   └─> Logged to database with severity: "critical" + cheating_score: 90

3. User looks away:
   └─> "⚠️ Face not centered" (Yellow toast)
   └─> Status shows analysis result
   └─> Logged to database with severity: "medium" + cheating_score: 30
```

---

## 📊 Toast Behavior

### Auto-Dismiss
- All toasts automatically dismiss after their duration
- User can manually close any toast by clicking the × button

### Stacking
- Multiple toasts stack vertically in top-right corner
- Most recent toast appears at the bottom of the stack
- Maximum width: 400px

### Animation
- Slide in from right with fade-in effect
- Smooth exit animation

### Z-Index
- Toasts appear above all other content (z-index: 50)
- Always visible even during exam

---

## 🛡️ Security Features

### Visual Feedback
- **Tab Switch Counter:** Header shows cumulative tab switches
- **Webcam Status:** Real-time monitoring status
- **Alert Badge:** Red warning badge for violations

### Persistent Logging
- Every toast notification is also logged to database
- Admin can review all violations post-exam
- Includes timestamp, question number, and ML analysis data

### User Awareness
- Users are constantly reminded they're being monitored
- Clear feedback on what behavior is problematic
- Encourages honest behavior through transparency

---

## 🎨 Visual Examples

### Success Toast (Green)
```
┌─────────────────────────────────────────┐
│ ✅ Test started!                        ×│
│    Stay focused and avoid suspicious     │
│    behavior.                              │
└─────────────────────────────────────────┘
```

### Warning Toast (Yellow)
```
┌─────────────────────────────────────────┐
│ ⚠️ Warning: Tab switching detected!    ×│
│    This behavior is being monitored      │
│    and logged.                            │
└─────────────────────────────────────────┘
```

### Critical Toast (Dark Red)
```
┌─────────────────────────────────────────┐
│ 🚨 CRITICAL ALERT: Multiple faces      ×│
│    detected (2)                           │
└─────────────────────────────────────────┘
```

---

## 🔧 Technical Implementation

### Toast Context Provider
- Uses React Context API for global state
- Manages toast queue and auto-dismiss timers
- Provides `addToast` function to all components

### Integration Points
1. **ExamInterface.jsx**: Tab/window events
2. **WebcamMonitor.jsx**: ML analysis results
3. **Timer.jsx**: Time warnings
4. **Store.js**: API errors

### Toast Function Signature
```javascript
addToast(message, type, duration)

// Parameters:
// - message: string (required)
// - type: 'info' | 'success' | 'warning' | 'error' | 'critical'
// - duration: milliseconds (0 = no auto-dismiss)

// Example:
addToast('Test started!', 'success', 5000);
```

---

## 📈 Impact on User Experience

### Positive Effects
- ✅ Clear, immediate feedback on behavior
- ✅ Reduces confusion about monitoring
- ✅ Encourages compliance through awareness
- ✅ Professional, non-intrusive design

### Deterrent Effect
- ⚠️ Users know they're being watched
- ⚠️ Real-time alerts prevent prolonged cheating
- ⚠️ Visible logging creates accountability

---

## 🚀 Future Enhancements

1. **Sound Alerts** (optional)
   - Play sound for critical violations
   - Configurable on/off

2. **Progressive Warnings**
   - First offense: Info
   - Second offense: Warning
   - Third offense: Critical + auto-submit

3. **Admin Dashboard Integration**
   - Real-time toast feed for proctors
   - Live monitoring of all test-takers

4. **Customizable Messages**
   - Admin can configure toast messages
   - Multi-language support

---

This toast system provides transparent, real-time feedback to users while maintaining a comprehensive log of all activities for post-exam review.
