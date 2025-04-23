#include "student_mapping.h"

// Define the students array
Student students[NUM_STUDENTS];

void initializeStudents() {
    // Initialize student 1
    students[0].name = "Yash Ratnaparkhi";
    students[0].rollNo = "02";
    students[0].macAddress = "45:41:4c:65:2b:d6";
    students[0].isPresent = false;
    students[0].lastSeen = 0;

    // Initialize student 2
    students[1].name = "Dikshat Bhanarkar";
    students[1].rollNo = "18";
    students[1].macAddress = "d3:28:08:31:7e:25";
    students[1].isPresent = false;
    students[1].lastSeen = 0;

    // Initialize student 3
    students[2].name = "Aditi Mishra";
    students[2].rollNo = "01";
    students[2].macAddress = "f2:33:79:10:07:24";
    students[2].isPresent = false;
    students[2].lastSeen = 0;
} 