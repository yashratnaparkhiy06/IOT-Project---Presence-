#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEScan.h>
#include <BLEAdvertisedDevice.h>
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <ArduinoJson.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// WiFi credentials
#define WIFI_SSID "YashSR"
#define WIFI_PASSWORD "firebasebro"

// Firebase configuration
#define API_KEY "AIzaSyAYJOTmOqzFuCWW7Q3lmXzGabq32O_9cZU"
#define DATABASE_URL "https://presence-38724-default-rtdb.firebaseio.com"
#define USER_EMAIL "test@gmail.com"  // Replace with your Firebase auth email
#define USER_PASSWORD "12345678"      // Replace with your Firebase auth password

// BLE scan settings
#define SCAN_TIME 5
#define NUM_STUDENTS 3

// OLED Display settings
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define SCREEN_ADDRESS 0x3C

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// Structure to hold student information
struct Student {
    String name;
    String rollNo;
    String macAddress;
    bool isPresent;
    unsigned long lastSeen;
};

// Firebase objects
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// BLE objects
BLEScan* pBLEScan;
bool isScanning = false;

// Array to store student data
Student students[NUM_STUDENTS];

// Add these new variables
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org");
unsigned long lastHistoryUpdate = 0;
const unsigned long HISTORY_UPDATE_INTERVAL = 300000; // 5 minutes
int scanInterval = 30; // Default scan interval in seconds
int timeoutDuration = 5; // Default timeout in minutes
bool notificationSound = true;

// Add these new variables for display states
enum DisplayState {
    SHOW_LOGO,
    SHOW_WIFI_CONNECTING,
    SHOW_BLE_SCANNING,
    SHOW_ATTENDANCE
};

DisplayState currentDisplayState = SHOW_LOGO;
unsigned long displayStateStartTime = 0;
const unsigned long DISPLAY_STATE_DURATION = 2000; // 2 seconds per state

// WiFi symbol bitmap
const unsigned char wifi_symbol[] PROGMEM = {
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x1f,0xf0,0x00,0x00,0x00,
    0x00,0x03,0xff,0xff,0x80,0x00,0x00,
    0x00,0x1f,0xf0,0x1f,0xf0,0x00,0x00,
    0x00,0x7e,0x00,0x00,0xfc,0x00,0x00,
    0x01,0xf0,0x00,0x00,0x1f,0x00,0x00,
    0x03,0xc0,0x00,0x00,0x07,0xc0,0x00,
    0x0f,0x00,0x00,0x00,0x01,0xe0,0x00,
    0x1c,0x00,0x00,0x00,0x00,0x70,0x00,
    0x38,0x00,0x07,0xc0,0x00,0x38,0x00,
    0x70,0x00,0xff,0xfe,0x00,0x1e,0x00,
    0xe0,0x03,0xfc,0x7f,0xc0,0x0e,0x00,
    0x00,0x1f,0x80,0x03,0xf0,0x00,0x00,
    0x00,0x3c,0x00,0x00,0x78,0x00,0x00,
    0x00,0xf0,0x00,0x00,0x1c,0x00,0x00,
    0x01,0xe0,0x00,0x00,0x0c,0x00,0x00,
    0x03,0x80,0x00,0x00,0x00,0x00,0x00,
    0x03,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x3f,0xf8,0x07,0x1e,0x00,
    0x00,0x00,0xff,0xfe,0x1f,0xbf,0x80,
    0x00,0x03,0xe0,0x04,0x7f,0xff,0xc0,
    0x00,0x07,0x80,0x00,0xff,0xff,0xe0,
    0x00,0x0e,0x00,0x00,0xff,0xff,0xe0,
    0x00,0x0c,0x00,0x00,0x7f,0xff,0xc0,
    0x00,0x00,0x00,0x00,0xfe,0x07,0xe0,
    0x00,0x00,0x00,0x03,0xf8,0x03,0xf8,
    0x00,0x00,0x07,0xe7,0xf9,0xf1,0xfc,
    0x00,0x00,0x1f,0xe7,0xf1,0xf9,0xfc,
    0x00,0x00,0x1f,0xe7,0xf3,0xf9,0xfc,
    0x00,0x00,0x3f,0xe7,0xf3,0xf9,0xfc,
    0x00,0x00,0x3f,0xe7,0xf1,0xf1,0xfc,
    0x00,0x00,0x3f,0xe3,0xf8,0xe3,0xfc,
    0x00,0x00,0x3f,0xf3,0xfc,0x07,0xf8,
    0x00,0x00,0x1f,0xf0,0x7f,0x0f,0xc0,
    0x00,0x00,0x0f,0xe0,0x7f,0xff,0xe0,
    0x00,0x00,0x07,0xc0,0xff,0xff,0xe0,
    0x00,0x00,0x00,0x00,0x7f,0xff,0xe0,
    0x00,0x00,0x00,0x00,0x3f,0xff,0x80,
    0x00,0x00,0x00,0x00,0x1f,0xbf,0x00,
    0x00,0x00,0x00,0x00,0x03,0x18,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00
};

// BLE Callback class
class MyAdvertisedDeviceCallbacks: public BLEAdvertisedDeviceCallbacks {
    void onResult(BLEAdvertisedDevice advertisedDevice) {
        String macAddress = advertisedDevice.getAddress().toString().c_str();
        
        // Check if this MAC address belongs to a student
        for (int i = 0; i < NUM_STUDENTS; i++) {
            if (students[i].macAddress == macAddress) {
                students[i].isPresent = true;
                students[i].lastSeen = millis();
                Serial.printf("Student found: %s (Roll No: %s)\n", 
                    students[i].name.c_str(), 
                    students[i].rollNo.c_str());
                break;
            }
        }
    }
};

void showStartupScreen() {
    display.clearDisplay();
    display.setTextSize(2);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(10, 20);
    display.println("Presence ++");
    display.display();
    delay(2000);
}

void showWiFiScreen() {
    display.clearDisplay();
    // Draw WiFi symbol
    display.drawBitmap(32, 0, wifi_symbol, 56, 48, SSD1306_WHITE);
    
    // Show connection status
    display.setTextSize(1);
    display.setCursor(0, 50);
    if (WiFi.status() == WL_CONNECTED) {
        display.println("Connected");
    } else {
        display.println("Connecting...");
    }
    display.display();
}

void showAttendanceScreen() {
    display.clearDisplay();
    display.setTextSize(1);
    
    // Display header
    display.setCursor(0, 0);
    display.println("Attendance Status");
    display.drawLine(0, 10, 128, 10, SSD1306_WHITE);
    
    // Count present students
    int presentCount = 0;
    for (int i = 0; i < NUM_STUDENTS; i++) {
        if (students[i].isPresent) presentCount++;
    }
    
    // Display counts
    display.setCursor(0, 15);
    display.print("Present: ");
    display.println(presentCount);
    
    display.setCursor(0, 25);
    display.print("Absent: ");
    display.println(NUM_STUDENTS - presentCount);
    
    // Display last update
    display.setCursor(0, 35);
    display.print("Last Update: ");
    unsigned long seconds = (millis() - lastHistoryUpdate) / 1000;
    display.print(seconds);
    display.println("s ago");
    
    // Display status
    display.setCursor(0, 45);
    display.print("Status: ");
    display.println(isScanning ? "Scanning" : "Idle");
    
    display.display();
}

void setup() {
    Serial.begin(115200);
    Serial.println("Starting BLE Scanner...");

    // Initialize OLED display
    if(!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
        Serial.println(F("SSD1306 allocation failed"));
        for(;;);
    }
    display.clearDisplay();
    
    // Show startup screen
    showStartupScreen();
    
    // Initialize WiFi
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    
    // Show WiFi screen until connected
    while (WiFi.status() != WL_CONNECTED) {
        showWiFiScreen();
        delay(500);
    }
    Serial.println("WiFi Connected!");

    // Initialize Firebase
    config.api_key = API_KEY;
    config.database_url = DATABASE_URL;
    auth.user.email = USER_EMAIL;
    auth.user.password = USER_PASSWORD;

    Firebase.begin(&config, &auth);
    Firebase.reconnectWiFi(true);

    // Wait for Firebase authentication
    while (!Firebase.ready()) {
        Serial.println("Connecting to Firebase...");
        delay(1000);
    }
    Serial.println("Firebase Connected!");
    
    // Initialize BLE
    BLEDevice::init("ESP32_Scanner");
    pBLEScan = BLEDevice::getScan();
    pBLEScan->setAdvertisedDeviceCallbacks(new MyAdvertisedDeviceCallbacks());
    pBLEScan->setActiveScan(true);
    pBLEScan->setInterval(100);
    pBLEScan->setWindow(99);

    // Initialize students
    initializeStudents();
    printStudents();

    // Initialize NTP client
    timeClient.begin();
    timeClient.setTimeOffset(19800); // IST offset (5:30)
    
    // Load settings from Firebase
    loadSettings();

    // Initial Firebase update
    updateFirebase();
}

void loop() {
    if (!isScanning) {
        scanForDevices();
    }
    
    // Update display
    showAttendanceScreen();
    
    delay(1000);

    // Update history periodically
    if (millis() - lastHistoryUpdate >= HISTORY_UPDATE_INTERVAL) {
        updateHistory();
        lastHistoryUpdate = millis();
    }
    
    // Check for settings updates
    if (Firebase.ready()) {
        FirebaseJson json;
        if (Firebase.RTDB.getJSON(&fbdo, "esp32_attendance/settings")) {
            FirebaseJsonData result;
            json = fbdo.jsonObject();
            
            if (json.get(result, "scanInterval")) {
                int newInterval = result.intValue;
                if (newInterval != scanInterval) {
                    scanInterval = newInterval;
                    // Update scan interval
                    pBLEScan->setInterval(scanInterval * 1000);
                }
            }
        }
    }
}

void initializeStudents() {
    // Student 1
    students[0].name = "Yash Ratnaparkhi";
    students[0].rollNo = "02";
    students[0].macAddress = "45:41:4c:65:2b:d6";
    students[0].isPresent = false;
    students[0].lastSeen = 0;

    // Student 2
    students[1].name = "Dikshat Bhanarkar";
    students[1].rollNo = "18";
    students[1].macAddress = "d3:28:08:31:7e:25";
    students[1].isPresent = false;
    students[1].lastSeen = 0;

    // Student 3
    students[2].name = "Aditi Mishra";
    students[2].rollNo = "01";
    students[2].macAddress = "f2:33:79:10:07:24";
    students[2].isPresent = false;
    students[2].lastSeen = 0;

    Serial.printf("Initialized %d students\n", NUM_STUDENTS);
}

void scanForDevices() {
    isScanning = true;
    Serial.println("Starting BLE scan...");
    
    BLEScanResults* foundDevices = pBLEScan->start(SCAN_TIME, false);
    Serial.print("Devices found: ");
    Serial.println(foundDevices->getCount());
    
    // Reset all students to absent before scanning
    for (int i = 0; i < NUM_STUDENTS; i++) {
        students[i].isPresent = false;
    }
    
    for (int i = 0; i < foundDevices->getCount(); i++) {
        BLEAdvertisedDevice device = foundDevices->getDevice(i);
        String macAddress = device.getAddress().toString().c_str();
        
        // Check if this MAC address belongs to a student
        for (int j = 0; j < NUM_STUDENTS; j++) {
            if (students[j].macAddress == macAddress) {
                students[j].isPresent = true;
                students[j].lastSeen = millis();
                Serial.printf("Student found: %s (Roll No: %s)\n", 
                    students[j].name.c_str(), 
                    students[j].rollNo.c_str());
                break;
            }
        }
    }
    
    pBLEScan->clearResults();
    updateFirebase();
    printStudents();
    isScanning = false;
}

void updateFirebase() {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi not connected!");
        return;
    }

    // Check if Firebase authentication is still valid
    if (Firebase.ready()) {
        Serial.println("Updating Firebase data...");
        
        // Update NTP time
        timeClient.update();
        unsigned long currentEpochTime = timeClient.getEpochTime();
        String currentTime = timeClient.getFormattedTime();
        
        for (int i = 0; i < NUM_STUDENTS; i++) {
            String studentPath = "esp32_attendance/students/" + students[i].rollNo;
            
            FirebaseJson json;
            json.set("name", students[i].name);
            json.set("mac_address", students[i].macAddress);
            json.set("status", students[i].isPresent ? "present" : "absent");
            
            // Calculate the time of day in milliseconds
            unsigned long timeOfDay = (timeClient.getHours() * 3600 + 
                                    timeClient.getMinutes() * 60 + 
                                    timeClient.getSeconds()) * 1000;
            
            json.set("last_seen", String(timeOfDay));
            
            if (Firebase.RTDB.setJSON(&fbdo, studentPath.c_str(), &json)) {
                Serial.printf("Updated %s's status successfully\n", students[i].name.c_str());
            } else {
                Serial.printf("Failed to update %s's status: %s\n", 
                    students[i].name.c_str(), 
                    fbdo.errorReason().c_str());
            }
            delay(100); // Small delay between updates to prevent rate limiting
        }
    } else {
        Serial.println("Firebase not ready, attempting to reconnect...");
        Firebase.reconnectWiFi(true);
        delay(1000);
    }
}

void printStudents() {
    Serial.println("\nRegistered Students:");
    for (int i = 0; i < NUM_STUDENTS; i++) {
        Serial.printf("%d. %s (Roll No: %s) - %s\n", 
            i + 1,
            students[i].name.c_str(),
            students[i].rollNo.c_str(),
            students[i].isPresent ? "Present" : "Absent");
    }
}

void loadSettings() {
    if (Firebase.ready()) {
        FirebaseJson json;
        if (Firebase.RTDB.getJSON(&fbdo, "esp32_attendance/settings")) {
            FirebaseJsonData result;
            json = fbdo.jsonObject();
            
            if (json.get(result, "scanInterval")) {
                scanInterval = result.intValue;
            }
            if (json.get(result, "timeoutDuration")) {
                timeoutDuration = result.intValue;
            }
            if (json.get(result, "notificationSound")) {
                notificationSound = (result.stringValue == "enabled");
            }
        }
    }
}

void updateHistory() {
    if (!Firebase.ready()) {
        Serial.println("Firebase not ready for history update");
        return;
    }

    timeClient.update();
    String currentDate = String(timeClient.getEpochTime());
    
    // Count present students
    int presentCount = 0;
    int absentCount = 0;
    for (int i = 0; i < NUM_STUDENTS; i++) {
        if (students[i].isPresent) {
            presentCount++;
        } else {
            absentCount++;
        }
    }

    String historyPath = "esp32_attendance/history/" + currentDate;
    FirebaseJson json;
    json.set("date", currentDate);
    json.set("time", timeClient.getFormattedTime());
    json.set("present", presentCount);
    json.set("absent", absentCount);
    json.set("total", NUM_STUDENTS);

    if (Firebase.RTDB.setJSON(&fbdo, historyPath.c_str(), &json)) {
        Serial.println("History updated successfully");
    } else {
        Serial.printf("History update failed: %s\n", fbdo.errorReason().c_str());
    }
} 