CAMPUS QUEST UNIT TESTS - DROP-IN

1. Copy the contents of this folder into the ROOT of the Campus Quest project.
   Allow Windows to merge the src folder. Do NOT replace your whole src folder.

2. In PowerShell, from the Campus Quest project root, run:

   .\setup-tests.ps1

3. After setup, the normal commands are:

   npm test
   npm run test:coverage

The coverage HTML report is generated in coverage/index.html.

These tests cover assignment behaviours including student-number validation,
mission definitions, Society Fair Sudoku, Student Wellness doctor response,
Student Wellness card swipe, Closing Scene card swipe, Jammie Rush startup/map
navigation, and Operation Student Card photoshoot rendering.
