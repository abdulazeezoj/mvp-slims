# Virtual SIWES Supervision Platform - ABU Zaria

I want to build a web-based platform that digitizes the entire SIWES supervision process for Ahmadu Bello University, Zaria. The platform will allow students to maintain their logbooks online, enable remote supervision by both industry and school supervisors, and automate the generation of physical logbook copies when needed.

## Student Authentication & Profile Setup

Students will sign in using their matriculation number and state of origin. Once logged in, they'll complete their profile by submitting essential information like:
- Course and department
- Semester and session
- Industry supervisor's name and email
- Training organization details

## Daily Logbook Management

The core functionality revolves around daily logbook entries. Students will record their activities from **Monday to Saturday**, spanning from **Week 1 to Week 24** (or whatever duration the admin configures for different programs). 

For each week, students can:
- Upload sketches and technical diagrams
- Use an embedded **draw.io editor** to create diagrams directly in the platform and export them as JPEG images

## Automated Supervision Workflow

The supervision workflow is automated and notification-driven:

**Industry Supervisors:**
- Receive automated weekly notifications to review student entries
- Provide comments that are automatically timestamped with the review date

**School Supervisors/Lecturers:**
- Get notified when assigned to a student
- Review student progress either weekly or view everything together in a consolidated report

## Physical Logbook Generation

A critical feature is the ability to **auto-generate a properly formatted physical logbook**. This ensures students can print official copies that comply with ABU's SIWES documentation standards whenever required, while maintaining all their work digitally throughout the training period.

## Impact

The platform essentially:
- Eliminates the manual effort of maintaining handwritten logbooks
- Enables supervisors to monitor students remotely regardless of their location
- Creates a permanent digital record of all SIWES activities for institutional compliance and future reference