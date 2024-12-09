
#include <ESP8266WiFi.h>
#include <WiFiUdp.h>
#include <NTPClient.h>

extern int redLed, greenLed;

// Wifi
char ssid[] = SECRET_SSID;  // your network SSID (name)
char pass[] = SECRET_PASS;  // your network password
int keyIndex = 0;
WiFiClient espClient;

// NTP Client settings
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 0, 60000);

void checkWiFi() {
  if (WiFi.status() != WL_CONNECTED) {
    digitalWrite(redLed, HIGH);
    Serial.println();
    Serial.print("Attempting to connect to SSID: ");
    Serial.println(ssid);
    WiFi.begin(ssid, pass);  // Connect to WPA/WPA2 network
    while (WiFi.status() != WL_CONNECTED) {
      delay(500);
      Serial.print(".");
    }
    Serial.println();
    Serial.print("Connected, IP address: ");
    Serial.println(WiFi.localIP());

    // Initialize NTP client
    timeClient.begin();
  }
  digitalWrite(redLed, LOW);
}


unsigned long getTime() {
  timeClient.update();  // Ensure the time client has the latest time
  return timeClient.getEpochTime();  // Return the Unix timestamp
}
