#ifndef STUDENT_MAPPING_H
#define STUDENT_MAPPING_H

#include <Arduino.h>

// Structure to hold student information
struct Student {
    String name;
    String rollNo;
    String macAddress;
    bool isPresent;
    unsigned long lastSeen;
};

// Number of students
const int NUM_STUDENTS = 3;

// Array of students
extern Student students[NUM_STUDENTS];

// Function to initialize students
void initializeStudents();

#endif 